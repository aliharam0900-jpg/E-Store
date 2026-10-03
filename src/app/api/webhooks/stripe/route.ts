import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[STRIPE_WEBHOOK_ERROR] Missing stripe-signature header.");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[STRIPE_WEBHOOK_ERROR] STRIPE_WEBHOOK_SECRET is not configured.");
      return NextResponse.json(
        { error: "Webhook secret not configured on server" },
        { status: 500 }
      );
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("[STRIPE_WEBHOOK_ERROR] Signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle successful checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    try {
      const supabaseAdmin = createAdminClient();

      // 1. Idempotency Check: Verify if this session was already fulfilled
      const { data: existingAudit } = await supabaseAdmin
        .from("audit_logs")
        .select("id")
        .eq("action", "stripe_order_fulfilled")
        .eq("record_id", sessionId)
        .maybeSingle();

      if (existingAudit) {
        console.log(`[STRIPE_WEBHOOK] Session ${sessionId} already processed. Skipping duplicate fulfillment.`);
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Check if order with this session id already exists in orders
      const { data: existingOrders } = await supabaseAdmin
        .from("orders")
        .select("id")
        .filter("shipping_address->>stripe_session_id", "eq", sessionId)
        .limit(1);

      if (existingOrders && existingOrders.length > 0) {
        console.log(`[STRIPE_WEBHOOK] Order for session ${sessionId} already found. Skipping duplicate.`);
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // 2. Parse Order Amounts & Shipping
      const totalAmount = (session.amount_total || 0) / 100;
      const taxAmount = (session.total_details?.amount_tax || 0) / 100;
      const shippingAmount = (session.total_details?.amount_shipping || 0) / 100;

      // Extract and validate user_id foreign key
      const rawUserId = session.metadata?.user_id;
      let validUserId: string | null = null;
      if (rawUserId && rawUserId !== "guest") {
        const { data: userRecord } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", rawUserId)
          .maybeSingle();
        if (userRecord) {
          validUserId = userRecord.id;
        }
      }

      // Customer & Shipping addresses
      const customerDetails = session.customer_details;
      const shippingDetails =
        (session as any).shipping_details || session.customer_details;

      const shippingAddress = {
        name: shippingDetails?.name || customerDetails?.name || "Valued Customer",
        email: customerDetails?.email || "",
        phone: customerDetails?.phone || "",
        line1: shippingDetails?.address?.line1 || "",
        line2: shippingDetails?.address?.line2 || "",
        city: shippingDetails?.address?.city || "",
        state: shippingDetails?.address?.state || "",
        postal_code: shippingDetails?.address?.postal_code || "",
        country: shippingDetails?.address?.country || "US",
        stripe_session_id: sessionId,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      };

      // 3. Insert into public.orders
      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: validUserId,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          status: "processing",
          shipping_address: shippingAddress,
        })
        .select("id")
        .single();

      if (orderError || !newOrder) {
        console.error("[STRIPE_WEBHOOK_ERROR] Failed inserting order:", orderError);
        return NextResponse.json(
          { error: "Failed to persist order to database" },
          { status: 500 }
        );
      }

      // 4. Parse Cart Items & Insert Line Items
      let parsedItems: Array<{
        product_id: string;
        variant_id: string;
        quantity: number;
        price: number;
      }> = [];

      try {
        if (session.metadata?.items) {
          parsedItems = JSON.parse(session.metadata.items);
        }
      } catch (err) {
        console.error("[STRIPE_WEBHOOK_ERROR] Failed to parse session metadata items:", err);
      }

      if (parsedItems.length > 0) {
        const orderItemsToInsert = parsedItems.map((item) => ({
          order_id: newOrder.id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price_at_time: item.price,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from("order_items")
          .insert(orderItemsToInsert);

        if (itemsError) {
          console.error("[STRIPE_WEBHOOK_ERROR] Failed inserting order_items:", itemsError);
        }

        // 5. Decrement Inventory in public.product_variants
        for (const item of parsedItems) {
          if (!item.variant_id) continue;

          try {
            const { data: variantRecord } = await supabaseAdmin
              .from("product_variants")
              .select("id, inventory_count")
              .eq("id", item.variant_id)
              .maybeSingle();

            if (variantRecord) {
              const currentStock = variantRecord.inventory_count ?? 0;
              const nextStock = Math.max(0, currentStock - item.quantity);

              await supabaseAdmin
                .from("product_variants")
                .update({ inventory_count: nextStock })
                .eq("id", item.variant_id);
            }
          } catch (invErr) {
            console.error(
              `[STRIPE_WEBHOOK_ERROR] Error decrementing stock for variant ${item.variant_id}:`,
              invErr
            );
          }
        }
      }

      // 6. Increment times_used if a promotional discount was redeemed
      const redeemedDiscountId = session.metadata?.discount_id;
      if (redeemedDiscountId) {
        try {
          const { data: disc } = await supabaseAdmin
            .from("discounts")
            .select("id, times_used")
            .eq("id", redeemedDiscountId)
            .maybeSingle();

          if (disc) {
            await supabaseAdmin
              .from("discounts")
              .update({ times_used: (disc.times_used || 0) + 1 })
              .eq("id", redeemedDiscountId);
          }
        } catch (discErr) {
          console.warn("[STRIPE_WEBHOOK_WARNING] Failed to increment discount usage:", discErr);
        }
      }

      // 7. Record Audit Log for Idempotency and Traceability
      await supabaseAdmin.from("audit_logs").insert({
        action: "stripe_order_fulfilled",
        table_affected: "orders",
        record_id: sessionId,
        admin_id: validUserId,
      });

      console.log(`[STRIPE_WEBHOOK] Order ${newOrder.id} fulfilled successfully.`);
      return NextResponse.json({ received: true, order_id: newOrder.id }, { status: 200 });
    } catch (fulfillError: any) {
      console.error("[STRIPE_WEBHOOK_FULFILLMENT_ERROR]", fulfillError);
      return NextResponse.json(
        { error: "Error fulfilling order" },
        { status: 500 }
      );
    }
  }

  // Acknowledge all other events
  return NextResponse.json({ received: true }, { status: 200 });
}
