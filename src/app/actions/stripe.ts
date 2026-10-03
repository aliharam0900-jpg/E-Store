"use server";

import { headers } from "next/headers";
import type { Stripe } from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/stores/useCartStore";
import {
  type CurrencyCode,
  DEFAULT_EXCHANGE_RATES,
} from "@/lib/utils/format";

export interface CreateCheckoutResult {
  success: boolean;
  url?: string | null;
  error?: string;
}

export async function createCheckoutSession(
  cartItems: CartItem[],
  promoCode?: string | null,
  currency: CurrencyCode = "USD"
): Promise<CreateCheckoutResult> {
  try {
    if (!cartItems || cartItems.length === 0) {
      return {
        success: false,
        error: "Your cart is empty. Please add items before checking out.",
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        success: false,
        error:
          "Payment gateway is not currently configured. STRIPE_SECRET_KEY is missing.",
      };
    }

    // Determine target currency and exchange rate
    const normalizedCurrency = (currency || "USD").toUpperCase() as CurrencyCode;
    const stripeCurrency = normalizedCurrency.toLowerCase();
    const exchangeRate = DEFAULT_EXCHANGE_RATES[normalizedCurrency] ?? 1.0;
    const isZeroDecimal = normalizedCurrency === "JPY";

    // Determine current user if authenticated
    let userId: string | null = null;
    let supabaseClient: any = null;
    try {
      supabaseClient = await createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Proceed as guest checkout if auth client fails or user is unauthenticated
      userId = null;
    }

    // Handle Promo Code Discount Verification & Dynamic Stripe Coupon
    let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined = undefined;
    let validDiscountId: string | null = null;
    let validDiscountCode: string | null = null;

    if (promoCode && promoCode.trim()) {
      try {
        if (!supabaseClient) {
          supabaseClient = await createClient();
        }
        const normalizedCode = promoCode.trim().toUpperCase();
        const { data: discountRecord } = await supabaseClient
          .from("discounts")
          .select("*")
          .eq("code", normalizedCode)
          .maybeSingle();

        if (discountRecord) {
          const isExpired =
            discountRecord.expires_at &&
            new Date(discountRecord.expires_at).getTime() <= Date.now();
          const isExhausted =
            discountRecord.usage_limit !== null &&
            discountRecord.usage_limit !== undefined &&
            discountRecord.times_used >= discountRecord.usage_limit;

          if (!isExpired && !isExhausted) {
            validDiscountId = discountRecord.id;
            validDiscountCode = discountRecord.code;

            const convertedDiscountVal = Number(discountRecord.value) * exchangeRate;
            const amountOff = isZeroDecimal
              ? Math.max(50, Math.round(convertedDiscountVal))
              : Math.max(50, Math.round(convertedDiscountVal * 100));

            // Generate ephemeral single-use Stripe coupon in active currency
            const coupon = await stripe.coupons.create({
              name: `PROMO: ${discountRecord.code} (${normalizedCurrency})`,
              ...(discountRecord.discount_type === "percentage"
                ? { percent_off: Number(discountRecord.value) }
                : {
                    amount_off: amountOff,
                    currency: stripeCurrency,
                  }),
              duration: "once",
            });

            stripeDiscounts = [{ coupon: coupon.id }];
          }
        }
      } catch (couponErr) {
        console.warn("[STRIPE_COUPON_WARNING] Could not attach coupon:", couponErr);
      }
    }

    // Determine request origin for dynamic redirection
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const headerOrigin = headersList.get("origin") || headersList.get("referer");

    let baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (headerOrigin ? new URL(headerOrigin).origin : `${proto}://${host}`);

    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, "");

    // Format line items for Stripe Checkout with active currency conversion
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map(
      (item) => {
        const itemTitle = item.title || "Custom Product";
        const variantDetails = [
          (item.selected_size || item.size) && `Size: ${item.selected_size || item.size}`,
          (item.selected_color || item.color) && `Color: ${item.selected_color || item.color}`,
        ]
          .filter(Boolean)
          .join(" | ");

        const imageUrl = item.image_url || item.image || "";
        const isValidHttpsUrl =
          imageUrl.startsWith("https://") || imageUrl.startsWith("http://");

        // Convert base USD item price to target currency
        const convertedPrice = item.price * exchangeRate;
        const unitAmount = isZeroDecimal
          ? Math.max(50, Math.round(convertedPrice))
          : Math.max(50, Math.round(convertedPrice * 100));

        return {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: itemTitle,
              description: variantDetails || undefined,
              images: isValidHttpsUrl ? [imageUrl] : undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: Math.max(1, item.quantity),
        };
      }
    );

    // Format metadata containing user_id, serialized cart items, currency, and applied discount
    const metadataItems = cartItems.map((item) => ({
      product_id: item.product_id || item.productId,
      variant_id: item.variant_id || item.variantId,
      quantity: item.quantity,
      price: item.price,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      discounts: stripeDiscounts,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: [
          "US",
          "CA",
          "GB",
          "AU",
          "DE",
          "FR",
          "IT",
          "ES",
          "NL",
          "SE",
          "JP",
          "PK",
        ],
      },
      metadata: {
        user_id: userId || "guest",
        discount_id: validDiscountId || "",
        discount_code: validDiscountCode || "",
        currency: stripeCurrency,
        exchange_rate: String(exchangeRate),
        items: JSON.stringify(metadataItems),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    return {
      success: true,
      url: session.url,
    };
  } catch (err: any) {
    console.error("[STRIPE_SERVER_ACTION_ERROR]", err);
    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred while communicating with the payment processor.",
    };
  }
}
