import { createClient } from "@/lib/supabase/client";
import type {
  AdminAnalyticsSummary,
  Revenue30DaysRecord,
  TopSellingProductRecord,
} from "@/types";

export interface LowStockVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  inventory_count: number;
  price_adjustment: number;
  product: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

const MOCK_ANALYTICS_SUMMARY: AdminAnalyticsSummary = {
  total_revenue: 124850,
  average_order_value: 285.05,
  total_orders: 438,
  active_customers: 294,
  low_stock_count: 3,
};

const MOCK_TOP_PRODUCTS: TopSellingProductRecord[] = [
  {
    product_id: "prod-001",
    product_title: "Monolith Technical Modular Shell Jacket",
    units_sold: 142,
    total_revenue: 48280,
  },
  {
    product_id: "prod-002",
    product_title: "Articulated Cargo Trousers",
    units_sold: 98,
    total_revenue: 21560,
  },
  {
    product_id: "prod-003",
    product_title: "Bonded Seam Minimalist Hoodie",
    units_sold: 76,
    total_revenue: 14440,
  },
  {
    product_id: "prod-004",
    product_title: "Modular Magnetic Belt",
    units_sold: 122,
    total_revenue: 10980,
  },
];

const MOCK_LOW_STOCK: LowStockVariant[] = [
  {
    id: "var-001",
    sku: "MSJ-BLK-S",
    size: "S",
    color: "Obsidian",
    inventory_count: 4,
    price_adjustment: 0,
    product: {
      id: "prod-001",
      title: "Monolith Technical Modular Shell Jacket",
      slug: "modular-shell-jacket",
    },
  },
  {
    id: "var-004",
    sku: "ACT-BLK-M",
    size: "M",
    color: "Charcoal",
    inventory_count: 2,
    price_adjustment: 0,
    product: {
      id: "prod-002",
      title: "Articulated Cargo Trousers",
      slug: "articulated-cargo-trousers",
    },
  },
];

/**
 * Fetch Executive Financial Analytics KPI summary
 */
export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  if (isPlaceholderEnv()) {
    return MOCK_ANALYTICS_SUMMARY;
  }

  try {
    const supabase = createClient();

    // 1. Attempt to query optimized Postgres View
    const { data, error } = await supabase
      .from("view_admin_analytics" as any)
      .select("*")
      .maybeSingle();

    const viewData = data as any;
    if (!error && viewData) {
      return {
        total_revenue: Number(viewData.total_revenue || 0),
        average_order_value: Number(viewData.average_order_value || 0),
        total_orders: Number(viewData.total_orders || 0),
        active_customers: Number(viewData.active_customers || 0),
        low_stock_count: Number(viewData.low_stock_count || 0),
      };
    }

    // 2. Direct fallback query if view not yet populated
    const { data: orders = [] } = await supabase
      .from("orders")
      .select("id, total_amount, user_id");

    const { count: lowStockCount } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .lt("inventory_count", 10);

    const orderList = orders || [];
    const totalRevenue = orderList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalOrders = orderList.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const distinctUsers = new Set(orderList.map((o) => o.user_id).filter(Boolean)).size;

    return {
      total_revenue: totalRevenue,
      average_order_value: aov,
      total_orders: totalOrders,
      active_customers: distinctUsers,
      low_stock_count: lowStockCount || 0,
    };
  } catch (err: any) {
    console.error("[ANALYTICS_SERVICE_ERROR] Failed to query analytics summary:", err?.message);
    return {
      total_revenue: 0,
      average_order_value: 0,
      total_orders: 0,
      active_customers: 0,
      low_stock_count: 0,
    };
  }
}

/**
 * Fetch rolling 30-day daily revenue data for time-series charts
 */
export async function getRevenue30Days(): Promise<Revenue30DaysRecord[]> {
  if (isPlaceholderEnv()) {
    const series: Revenue30DaysRecord[] = [];
    const baseRevenue = [
      3200, 4100, 3850, 4900, 5200, 6100, 4400, 3900, 4200, 5100,
      4800, 5600, 6300, 5900, 4700, 5200, 6400, 7100, 5800, 6200,
      6900, 7400, 6800, 7200, 8100, 7600, 8400, 8900, 9200, 9600,
    ];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const idx = 29 - i;
      const rev = baseRevenue[idx] || 4500;
      series.push({
        date: dateStr,
        label,
        revenue: rev,
        order_count: Math.round(rev / 285),
      });
    }
    return series;
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("view_revenue_30_days" as any)
      .select("*")
      .order("date", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        date: d.date,
        label: d.label,
        revenue: Number(d.revenue || 0),
        order_count: Number(d.order_count || 0),
      }));
    }

    // Fallback: Generate 30 day series client-side from orders
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: rawOrders = [] } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const dateMap = new Map<string, { revenue: number; count: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      dateMap.set(dateKey, { revenue: 0, count: 0 });
    }

    (rawOrders || []).forEach((order) => {
      const dateKey = order.created_at.split("T")[0];
      if (dateMap.has(dateKey)) {
        const current = dateMap.get(dateKey)!;
        current.revenue += Number(order.total_amount || 0);
        current.count += 1;
      }
    });

    return Array.from(dateMap.entries()).map(([dateStr, metrics]) => {
      const dateObj = new Date(dateStr + "T00:00:00");
      const label = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return {
        date: dateStr,
        label,
        revenue: metrics.revenue,
        order_count: metrics.count,
      };
    });
  } catch (err: any) {
    console.warn("[ANALYTICS_SERVICE_WARN] Fallback 30-day revenue:", err?.message);
    return [];
  }
}

/**
 * Fetch Top Selling Products by Volume
 */
export async function getTopSellingProducts(): Promise<TopSellingProductRecord[]> {
  if (isPlaceholderEnv()) {
    return MOCK_TOP_PRODUCTS;
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("view_top_selling_products" as any)
      .select("*")
      .limit(10);

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        product_id: item.product_id,
        product_title: item.product_title,
        units_sold: Number(item.units_sold || 0),
        total_revenue: Number(item.total_revenue || 0),
      }));
    }

    // Fallback: Query order_items
    const { data: items = [] } = await supabase
      .from("order_items")
      .select(`
        quantity,
        price_at_time,
        variant:product_variants (
          product:products (
            id,
            title
          )
        )
      `);

    const productAgg = new Map<
      string,
      { title: string; units: number; revenue: number }
    >();

    (items || []).forEach((oi: any) => {
      const prod = oi.variant?.product;
      if (!prod) return;
      const existing = productAgg.get(prod.id) || {
        title: prod.title,
        units: 0,
        revenue: 0,
      };
      existing.units += oi.quantity;
      existing.revenue += oi.quantity * (Number(oi.price_at_time) || 0);
      productAgg.set(prod.id, existing);
    });

    return Array.from(productAgg.entries())
      .map(([product_id, val]) => ({
        product_id,
        product_title: val.title,
        units_sold: val.units,
        total_revenue: val.revenue,
      }))
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 10);
  } catch (err: any) {
    console.error("[ANALYTICS_SERVICE_ERROR] Failed to query top products:", err?.message);
    return [];
  }
}

/**
 * Fetch Low Stock Variants (< 10 units)
 */
export async function getLowStockVariants(): Promise<LowStockVariant[]> {
  if (isPlaceholderEnv()) {
    return MOCK_LOW_STOCK;
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("product_variants")
      .select(`
        id,
        sku,
        size,
        color,
        inventory_count,
        price_adjustment,
        product:products (
          id,
          title,
          slug
        )
      `)
      .lt("inventory_count", 10)
      .order("inventory_count", { ascending: true })
      .limit(20);

    if (error) {
      console.error("[ANALYTICS_SERVICE_ERROR] Failed to load low stock variants:", error.message);
      return [];
    }

    return (data as any) || [];
  } catch (err: any) {
    console.error("[ANALYTICS_SERVICE_ERROR] Failed to query low stock variants:", err?.message);
    return [];
  }
}
