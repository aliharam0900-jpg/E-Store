import { createClient } from "@/lib/supabase/client";
import type { OrderStatus, OrderWithDetails } from "@/types";

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

export const MOCK_ORDERS: OrderWithDetails[] = [
  {
    id: "ord-8831",
    user_id: "usr-001",
    total_amount: 340,
    status: "delivered",
    tracking_number: "FX-88492019US",
    tax_amount: 0,
    shipping_amount: 0,
    shipping_address: {
      line1: "742 Evergreen Terrace",
      city: "Springfield",
      state: "OR",
      postal_code: "97477",
      country: "US",
    },
    created_at: "2026-03-24T14:32:00Z",
    updated_at: "2026-03-24T18:15:00Z",
    user: {
      id: "usr-001",
      full_name: "Elena Rostova",
      email: "elena.rostova@cipher.io",
      role: "customer",
      is_banned: false,
      stripe_customer_id: "cus_mock_1",
      created_at: "2026-01-10T00:00:00Z",
      updated_at: "2026-01-10T00:00:00Z",
    },
    order_items: [
      {
        id: "item-001",
        order_id: "ord-8831",
        variant_id: "var-001",
        quantity: 1,
        price_at_time: 340,
        created_at: "2026-03-24T14:32:00Z",
        variant: {
          id: "var-001",
          product_id: "prod-001",
          sku: "MSJ-BLK-S",
          size: "S",
          color: "Obsidian",
          inventory_count: 4,
          price_adjustment: 0,
          created_at: "2026-01-01T00:00:00Z",
          product: {
            id: "prod-001",
            title: "Monolith Technical Modular Shell Jacket",
            slug: "modular-shell-jacket",
            description: null,
            base_price: 340,
            compare_at_price: null,
            category_id: "cat-001",
            is_published: true,
            seo_title: null,
            seo_description: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        },
      },
    ],
  },
  {
    id: "ord-8832",
    user_id: "usr-002",
    total_amount: 560,
    status: "processing",
    tracking_number: null,
    tax_amount: 0,
    shipping_amount: 0,
    shipping_address: {
      line1: "1000 Broadway Ave",
      city: "Seattle",
      state: "WA",
      postal_code: "98101",
      country: "US",
    },
    created_at: "2026-03-25T08:12:00Z",
    updated_at: "2026-03-25T08:12:00Z",
    user: {
      id: "usr-002",
      full_name: "Marcus Vance",
      email: "m.vance@techwear-lab.de",
      role: "customer",
      is_banned: false,
      stripe_customer_id: "cus_mock_2",
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    },
    order_items: [
      {
        id: "item-002",
        order_id: "ord-8832",
        variant_id: "var-004",
        quantity: 2,
        price_at_time: 220,
        created_at: "2026-03-25T08:12:00Z",
        variant: {
          id: "var-004",
          product_id: "prod-002",
          sku: "ACT-BLK-M",
          size: "M",
          color: "Charcoal",
          inventory_count: 2,
          price_adjustment: 0,
          created_at: "2026-01-01T00:00:00Z",
          product: {
            id: "prod-002",
            title: "Articulated Cargo Trousers",
            slug: "articulated-cargo-trousers",
            description: null,
            base_price: 220,
            compare_at_price: null,
            category_id: "cat-002",
            is_published: true,
            seo_title: null,
            seo_description: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        },
      },
    ],
  },
  {
    id: "ord-8833",
    user_id: "usr-003",
    total_amount: 340,
    status: "shipped",
    tracking_number: "DHL-99201948",
    tax_amount: 0,
    shipping_amount: 0,
    shipping_address: {
      line1: "42 Wallaby Way",
      city: "Sydney",
      state: "NSW",
      postal_code: "2000",
      country: "AU",
    },
    created_at: "2026-03-24T22:05:00Z",
    updated_at: "2026-03-25T02:00:00Z",
    user: {
      id: "usr-003",
      full_name: "Kaito Tanaka",
      email: "tanaka@neo-tokyo.jp",
      role: "customer",
      is_banned: false,
      stripe_customer_id: "cus_mock_3",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    },
    order_items: [],
  },
];

export async function getOrders(statusFilter?: OrderStatus | "all"): Promise<OrderWithDetails[]> {
  if (isPlaceholderEnv()) {
    if (statusFilter && statusFilter !== "all") {
      return MOCK_ORDERS.filter((o) => o.status === statusFilter);
    }
    return MOCK_ORDERS;
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select(`
        *,
        user:users(*),
        order_items(
          *,
          variant:product_variants(
            *,
            product:products(*)
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ORDERS_SERVICE_ERROR] Supabase orders query error:", error.message);
      return [];
    }

    return (data as unknown as OrderWithDetails[]) || [];
  } catch (err: any) {
    console.error("[ORDERS_SERVICE_ERROR] Failed to query orders:", err?.message);
    return [];
  }
}

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  if (isPlaceholderEnv()) {
    return MOCK_ORDERS.find((o) => o.id === id) || null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        user:users(*),
        order_items(
          *,
          variant:product_variants(
            *,
            product:products(*)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        console.error("[ORDER_BY_ID_ERROR]", error.message);
      }
      return null;
    }

    return data as unknown as OrderWithDetails;
  } catch (err: any) {
    console.error("[ORDER_BY_ID_ERROR]", err?.message);
    return null;
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  if (isPlaceholderEnv()) {
    const target = MOCK_ORDERS.find((o) => o.id === id);
    if (target) target.status = status;
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

export async function updateOrderTracking(
  id: string,
  tracking_number: string
): Promise<void> {
  if (isPlaceholderEnv()) {
    const target = MOCK_ORDERS.find((o) => o.id === id);
    if (target) target.tracking_number = tracking_number;
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ tracking_number })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update tracking number: ${error.message}`);
  }
}
