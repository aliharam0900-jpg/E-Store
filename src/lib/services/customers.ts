import { createClient } from "@/lib/supabase/client";
import type { CustomerCrmRecord, Order } from "@/types";

export interface CustomerOrderHistory extends Order {
  item_count?: number;
}

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

export const MOCK_CUSTOMERS: CustomerCrmRecord[] = [
  {
    id: "usr-001",
    email: "elena.rostova@cipher.io",
    full_name: "Elena Rostova",
    role: "customer",
    is_banned: false,
    stripe_customer_id: "cus_mock_1",
    created_at: "2026-01-10T00:00:00Z",
    order_count: 5,
    lifetime_value: 1720,
    last_order_at: "2026-03-24T14:32:00Z",
  },
  {
    id: "usr-002",
    email: "m.vance@techwear-lab.de",
    full_name: "Marcus Vance",
    role: "customer",
    is_banned: false,
    stripe_customer_id: "cus_mock_2",
    created_at: "2026-01-15T00:00:00Z",
    order_count: 3,
    lifetime_value: 880,
    last_order_at: "2026-03-25T08:12:00Z",
  },
  {
    id: "usr-003",
    email: "tanaka@neo-tokyo.jp",
    full_name: "Kaito Tanaka",
    role: "customer",
    is_banned: false,
    stripe_customer_id: "cus_mock_3",
    created_at: "2026-02-01T00:00:00Z",
    order_count: 2,
    lifetime_value: 560,
    last_order_at: "2026-03-24T22:05:00Z",
  },
  {
    id: "usr-004",
    email: "banned.user@shadow.net",
    full_name: "Suspended Identity",
    role: "customer",
    is_banned: true,
    stripe_customer_id: null,
    created_at: "2026-02-14T00:00:00Z",
    order_count: 0,
    lifetime_value: 0,
    last_order_at: null,
  },
];

/**
 * Fetch all customers joined with their lifetime order metrics
 */
export async function getCustomersCrm(): Promise<CustomerCrmRecord[]> {
  if (isPlaceholderEnv()) {
    return MOCK_CUSTOMERS;
  }

  try {
    const supabase = createClient();

    // 1. Try high-performance Postgres View
    const { data: viewData, error: viewError } = await supabase
      .from("view_customer_crm" as any)
      .select("*")
      .order("lifetime_value", { ascending: false });

    if (!viewError && viewData && viewData.length > 0) {
      return viewData.map((d: any) => ({
        id: d.id,
        email: d.email,
        full_name: d.full_name,
        role: d.role,
        is_banned: Boolean(d.is_banned),
        stripe_customer_id: d.stripe_customer_id,
        created_at: d.created_at,
        order_count: Number(d.order_count || 0),
        lifetime_value: Number(d.lifetime_value || 0),
        last_order_at: d.last_order_at,
      }));
    }

    // 2. Direct fallback query joining users and orders
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError || !users) {
      console.error("[CUSTOMERS_SERVICE_ERROR] Failed to query users:", usersError?.message);
      return [];
    }

    const { data: orders = [] } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, created_at");

    const orderMap = new Map<
      string,
      { count: number; ltv: number; lastOrder: string | null }
    >();

    (orders || []).forEach((o) => {
      if (!o.user_id) return;
      const existing = orderMap.get(o.user_id) || {
        count: 0,
        ltv: 0,
        lastOrder: null,
      };
      existing.count += 1;
      existing.ltv += Number(o.total_amount || 0);
      if (!existing.lastOrder || new Date(o.created_at) > new Date(existing.lastOrder)) {
        existing.lastOrder = o.created_at;
      }
      orderMap.set(o.user_id, existing);
    });

    return users.map((u) => {
      const stats = orderMap.get(u.id) || { count: 0, ltv: 0, lastOrder: null };
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        is_banned: Boolean(u.is_banned),
        stripe_customer_id: u.stripe_customer_id,
        created_at: u.created_at,
        order_count: stats.count,
        lifetime_value: stats.ltv,
        last_order_at: stats.lastOrder,
      };
    });
  } catch (err: any) {
    console.error("[CUSTOMERS_SERVICE_ERROR] Failed to query customers CRM:", err?.message);
    return [];
  }
}

/**
 * Fetch detailed order history for a specific customer
 */
export async function getCustomerOrderHistory(
  userId: string
): Promise<CustomerOrderHistory[]> {
  if (isPlaceholderEnv()) {
    return [];
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load customer orders:", error);
      return [];
    }

    return (data || []).map((o: any) => ({
      ...o,
      item_count: o.order_items?.length || 0,
    }));
  } catch (err: any) {
    console.warn("[CUSTOMERS_SERVICE_WARN] Fallback order history:", err?.message);
    return [];
  }
}
