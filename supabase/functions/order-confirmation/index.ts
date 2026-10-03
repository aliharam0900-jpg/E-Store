import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Supabase Edge Function: Order Confirmation Email Dispatcher
 * Triggered by Supabase Database Webhook upon orders INSERT.
 * Compiles a bespoke HTML receipt and dispatches via Resend.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Support both direct custom payload and Supabase standard database webhook payload
    const record = body.record || body;
    const orderId = record.order_id || record.id;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing order_id in webhook payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client to retrieve items & shipping details
    const supabase = createClient(
      SUPABASE_URL ?? "",
      SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // Fetch order record with items and variant titles
    const { data: order, error: orderError } = await supabase
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

    if (orderError || !order) {
      console.error("[EDGE_FUNCTION_ORDER_ERROR]", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found or inaccessible" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const shippingAddress = order.shipping_address || {};
    const recipientEmail = shippingAddress.email;
    const recipientName = shippingAddress.name || "Valued Customer";

    if (!recipientEmail) {
      console.warn(`[EDGE_FUNCTION] Order ${orderId} has no recipient email address.`);
      return new Response(
        JSON.stringify({ message: "No email address found on order. Skipped." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Render HTML items rows
    const itemsHtml = (order.order_items || [])
      .map((item: any) => {
        const title = item.variant?.product?.title || "Custom Garment";
        const details = [
          item.variant?.size && `Size: ${item.variant.size}`,
          item.variant?.color && `Color: ${item.variant.color}`,
        ]
          .filter(Boolean)
          .join(" | ");

        const lineTotal = (item.quantity * Number(item.price_at_time)).toFixed(2);

        return `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-family: monospace; font-size: 13px; color: #f4f4f5;">
              <strong>${title}</strong><br/>
              <span style="color: #71717a; font-size: 11px;">${details || "Standard Edition"}</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-family: monospace; font-size: 13px; text-align: center; color: #a1a1aa;">
              ${item.quantity}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-family: monospace; font-size: 13px; text-align: right; color: #f4f4f5;">
              $${lineTotal}
            </td>
          </tr>
        `;
      })
      .join("");

    // Construct Bespoke Monochrome Email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation #${order.id.slice(0, 8)}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #121215; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; padding: 32px;">
                  <!-- Header -->
                  <tr>
                    <td>
                      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #a1a1aa; text-transform: uppercase;">
                        MONOLITH // DISPATCH_NOTICE
                      </div>
                      <h1 style="font-family: monospace; font-size: 24px; font-weight: 800; margin: 8px 0 16px 0; color: #ffffff; letter-spacing: -0.5px;">
                        ORDER CONFIRMED
                      </h1>
                      <p style="font-size: 13px; color: #a1a1aa; margin: 0 0 24px 0; line-height: 1.5;">
                        Hello ${recipientName},<br/>
                        Your acquisition has been verified and registered into our fulfillment ledger.
                      </p>
                    </td>
                  </tr>

                  <!-- Order Reference Card -->
                  <tr>
                    <td style="background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: monospace; font-size: 12px;">
                        <tr>
                          <td style="color: #71717a;">Order Identifier:</td>
                          <td style="text-align: right; color: #ffffff; font-weight: bold;">#${order.id.slice(0, 8).toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td style="color: #71717a; padding-top: 6px;">Status:</td>
                          <td style="text-align: right; color: #10b981; font-weight: bold; padding-top: 6px;">PROCESSING</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Items Table -->
                  <tr>
                    <td style="padding-top: 24px;">
                      <div style="font-family: monospace; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        Allocated Pieces
                      </div>
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <thead>
                          <tr>
                            <th align="left" style="font-family: monospace; font-size: 11px; color: #71717a; padding-bottom: 8px; border-bottom: 1px solid #3f3f46;">ITEM</th>
                            <th align="center" style="font-family: monospace; font-size: 11px; color: #71717a; padding-bottom: 8px; border-bottom: 1px solid #3f3f46;">QTY</th>
                            <th align="right" style="font-family: monospace; font-size: 11px; color: #71717a; padding-bottom: 8px; border-bottom: 1px solid #3f3f46;">PRICE</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Totals Breakdown -->
                  <tr>
                    <td style="padding-top: 20px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: monospace; font-size: 12px;">
                        <tr>
                          <td style="color: #71717a; padding: 4px 0;">Subtotal</td>
                          <td style="text-align: right; color: #a1a1aa; padding: 4px 0;">$${Number(order.total_amount - (order.tax_amount || 0) - (order.shipping_amount || 0)).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="color: #71717a; padding: 4px 0;">Tax</td>
                          <td style="text-align: right; color: #a1a1aa; padding: 4px 0;">$${Number(order.tax_amount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="color: #71717a; padding: 4px 0;">Shipping</td>
                          <td style="text-align: right; color: #a1a1aa; padding: 4px 0;">${order.shipping_amount > 0 ? `$${Number(order.shipping_amount).toFixed(2)}` : "COMPLIMENTARY"}</td>
                        </tr>
                        <tr>
                          <td style="color: #ffffff; font-weight: bold; font-size: 14px; padding-top: 10px; border-top: 1px solid #27272a;">Total Amount</td>
                          <td style="text-align: right; color: #ffffff; font-weight: bold; font-size: 14px; padding-top: 10px; border-top: 1px solid #27272a;">$${Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Shipping Destination -->
                  <tr>
                    <td style="padding-top: 24px;">
                      <div style="font-family: monospace; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                        Shipping Destination
                      </div>
                      <div style="font-family: monospace; font-size: 12px; color: #d4d4d8; line-height: 1.5; background-color: #18181b; padding: 12px; border-radius: 6px; border: 1px solid #27272a;">
                        ${recipientName}<br/>
                        ${shippingAddress.line1 || ""}${shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}<br/>
                        ${shippingAddress.city || ""}, ${shippingAddress.state || ""} ${shippingAddress.postal_code || ""}<br/>
                        ${shippingAddress.country || "US"}
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 32px; border-top: 1px solid #27272a; margin-top: 24px; text-align: center; font-family: monospace; font-size: 10px; color: #52525b;">
                      MONOLITH ENTERPRISE STORE • HIGH-PERFORMANCE COUTURE & INDUSTRIAL ASSETS<br/>
                      Tracking dispatch transmission will follow upon freight handover.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Dispatch via Resend API if API Key is configured
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MONOLITH <orders@resend.dev>", // replace with verified domain in production
          to: [recipientEmail],
          subject: `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
          html: emailHtml,
        }),
      });

      const resendData = await resendResponse.json();
      console.log(`[RESEND_DISPATCH_SUCCESS] Order ${orderId}:`, resendData);
      return new Response(
        JSON.stringify({ success: true, resend: resendData }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.log(
        `[RESEND_SIMULATION] RESEND_API_KEY is not set. Order confirmation email rendered for ${recipientEmail}:`,
        order.id
      );
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          recipient: recipientEmail,
          order_id: order.id,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("[EDGE_FUNCTION_FATAL]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
