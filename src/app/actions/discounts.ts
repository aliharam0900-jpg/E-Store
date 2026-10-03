"use server";

import { createClient } from "@/lib/supabase/server";
import type { DiscountType } from "@/types";

export interface ValidatePromoCodeResult {
  valid: boolean;
  discount?: {
    id: string;
    code: string;
    discount_type: DiscountType;
    value: number;
    description?: string;
  };
  error?: string;
}

/**
 * Validates a promotional discount code server-side against Supabase
 */
export async function validatePromoCode(
  rawCode: string
): Promise<ValidatePromoCodeResult> {
  try {
    if (!rawCode || !rawCode.trim()) {
      return { valid: false, error: "Please enter a promotional code." };
    }

    const normalizedCode = rawCode.trim().toUpperCase();
    const supabase = await createClient();

    // Query discount record
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error || !discount) {
      return {
        valid: false,
        error: `Promo code "${normalizedCode}" is invalid or does not exist.`,
      };
    }

    // Check expiration date
    if (discount.expires_at) {
      const expiryDate = new Date(discount.expires_at);
      if (expiryDate.getTime() <= Date.now()) {
        return {
          valid: false,
          error: `Promo code "${normalizedCode}" expired on ${expiryDate.toLocaleDateString()}.`,
        };
      }
    }

    // Check usage limits
    if (discount.usage_limit !== null && discount.usage_limit !== undefined) {
      if (discount.times_used >= discount.usage_limit) {
        return {
          valid: false,
          error: `Promo code "${normalizedCode}" has reached its maximum redemption limit.`,
        };
      }
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        value: Number(discount.value),
        description:
          discount.discount_type === "percentage"
            ? `${discount.value}% OFF`
            : `$${discount.value} OFF`,
      },
    };
  } catch (err: any) {
    console.error("[VALIDATE_PROMO_ERROR]", err);
    return {
      valid: false,
      error: "An unexpected error occurred while validating promo code.",
    };
  }
}
