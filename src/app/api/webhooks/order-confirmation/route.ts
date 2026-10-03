import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Next.js Webhook Receiver for Order Confirmation Emails
 * Triggered by Supabase Database Webhook or direct order creation.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = body.record || body;
    const orderId = record.order_id || record.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id in webhook payload" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Query order with items
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          variant:product_variants (
            id,
            sku,
            size,
            color,
            product:products (
              title
            )
          )
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const shipping = order.shipping_address as any;
    const recipientEmail = shipping?.email;
    const recipientName = shipping?.name || "Customer";

    if (!recipientEmail) {
      return NextResponse.json(
        { message: "No recipient email found on order" },
        { status: 200 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Dispatches via Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MONOLITH <orders@resend.dev>",
          to: [recipientEmail],
          subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
          html: `<p>Thank you ${recipientName}, your order #${order.id} for $${order.total_amount} is confirmed.</p>`,
        }),
      });

      const resData = await res.json();
      return NextResponse.json({ success: true, resend: resData });
    }

    // Mock dispatch if RESEND_API_KEY is not defined
    console.log(
      `[MOCK_EMAIL_DISPATCH] Order #${order.id} confirmation prepared for ${recipientEmail}. Total: $${order.total_amount}`
    );

    return NextResponse.json({
      success: true,
      mocked: true,
      recipient: recipientEmail,
      order_id: order.id,
    });
  } catch (err: any) {
    console.error("[ORDER_EMAIL_WEBHOOK_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed processing order email webhook" },
      { status: 500 }
    );
  }
}
