import { createClient } from "@/lib/supabase/client";
import type { Discount, DiscountInsert, DiscountUpdate } from "@/types";

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

export const MOCK_DISCOUNTS: Discount[] = [
  {
    id: "disc-001",
    code: "WELCOME10",
    discount_type: "percentage",
    value: 10,
    expires_at: "2026-12-31T23:59:59Z",
    usage_limit: 500,
    times_used: 142,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "disc-002",
    code: "VIP50",
    discount_type: "fixed",
    value: 50,
    expires_at: "2026-12-31T23:59:59Z",
    usage_limit: 100,
    times_used: 28,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "disc-003",
    code: "ARCHIVE20",
    discount_type: "percentage",
    value: 20,
    expires_at: "2026-12-31T23:59:59Z",
    usage_limit: 250,
    times_used: 89,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export async function getDiscounts(): Promise<Discount[]> {
  if (isPlaceholderEnv()) {
    return MOCK_DISCOUNTS;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[DISCOUNTS_SERVICE_ERROR] Supabase query error:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error("[DISCOUNTS_SERVICE_ERROR] Failed to query discounts:", err?.message);
    return [];
  }
}

export async function getDiscountById(id: string): Promise<Discount | null> {
  if (isPlaceholderEnv()) {
    return MOCK_DISCOUNTS.find((d) => d.id === id) || null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return MOCK_DISCOUNTS.find((d) => d.id === id) || null;
    }

    return data;
  } catch (err: any) {
    console.warn("[DISCOUNTS_SERVICE_WARN] Fallback discount by id:", err?.message);
    return MOCK_DISCOUNTS.find((d) => d.id === id) || null;
  }
}

export async function createDiscount(discount: DiscountInsert): Promise<Discount> {
  if (isPlaceholderEnv()) {
    const newDiscount: Discount = {
      id: `disc-${Date.now()}`,
      code: discount.code.trim().toUpperCase(),
      discount_type: discount.discount_type,
      value: discount.value,
      expires_at: discount.expires_at || null,
      usage_limit: discount.usage_limit || null,
      times_used: 0,
      created_at: new Date().toISOString(),
    };
    MOCK_DISCOUNTS.unshift(newDiscount);
    return newDiscount;
  }

  const supabase = createClient();
  const normalized = {
    ...discount,
    code: discount.code.trim().toUpperCase(),
  };

  const { data, error } = await supabase
    .from("discounts")
    .insert(normalized)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create discount: ${error.message}`);
  }

  return data;
}

export async function updateDiscount(
  id: string,
  discount: DiscountUpdate
): Promise<Discount> {
  if (isPlaceholderEnv()) {
    const index = MOCK_DISCOUNTS.findIndex((d) => d.id === id);
    if (index > -1) {
      MOCK_DISCOUNTS[index] = {
        ...MOCK_DISCOUNTS[index],
        ...discount,
        ...(discount.code ? { code: discount.code.trim().toUpperCase() } : {}),
      };
      return MOCK_DISCOUNTS[index];
    }
  }

  const supabase = createClient();
  const updates = {
    ...discount,
    ...(discount.code ? { code: discount.code.trim().toUpperCase() } : {}),
  };

  const { data, error } = await supabase
    .from("discounts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update discount: ${error.message}`);
  }

  return data;
}

export async function deleteDiscount(id: string): Promise<void> {
  if (isPlaceholderEnv()) {
    const index = MOCK_DISCOUNTS.findIndex((d) => d.id === id);
    if (index > -1) {
      MOCK_DISCOUNTS.splice(index, 1);
    }
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("discounts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete discount: ${error.message}`);
  }
}
