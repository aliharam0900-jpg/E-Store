"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAdminAnalyticsSummary,
  getRevenue30Days,
  getTopSellingProducts,
  getLowStockVariants,
} from "@/lib/services/analytics";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { TopProductsChart } from "@/components/admin/analytics/top-products-chart";
import { LowStockTable } from "@/components/admin/analytics/low-stock-table";
import { formatPrice } from "@/lib/utils/format";

export default function AdminPortalDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["admin_analytics_summary"],
    queryFn: getAdminAnalyticsSummary,
  });

  const { data: revenueData = [], isLoading: isRevenueLoading } = useQuery({
    queryKey: ["admin_revenue_30_days"],
    queryFn: getRevenue30Days,
  });

  const { data: topProducts = [], isLoading: isTopProductsLoading } = useQuery({
    queryKey: ["admin_top_products"],
    queryFn: getTopSellingProducts,
  });

  const { data: lowStock = [], isLoading: isLowStockLoading } = useQuery({
    queryKey: ["admin_low_stock"],
    queryFn: getLowStockVariants,
  });

  const totalRevenue = summary?.total_revenue || 0;
  const aov = summary?.average_order_value || 0;
  const totalOrders = summary?.total_orders || 0;
  const activeCustomers = summary?.active_customers || 0;

  return (
    <div className="space-y-8">
      {/* Executive Command Header */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                STEALTH_CMS // PHASE_6_ACTIVE
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
              Executive Financial Cockpit
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Real-time telemetry measuring gross merchant volume, average order values,
              inventory velocity, and fulfillment pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="gap-1.5 text-xs font-mono">
              <Link href="/sys-admin-portal/products/new">
                <Plus className="h-3.5 w-3.5" /> New Product
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-mono"
            >
              <Link href="/sys-admin-portal/discounts">
                <Sparkles className="h-3.5 w-3.5" /> Promo Codes
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-4 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-mono uppercase tracking-wider">
              Total Revenue (All-Time)
            </span>
            <DollarSign className="h-4 w-4 text-foreground" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground">
              {isSummaryLoading ? "—" : formatPrice(totalRevenue)}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Net captured transaction volume
            </p>
          </div>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="p-4 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-mono uppercase tracking-wider">
              Average Order Value
            </span>
            <TrendingUp className="h-4 w-4 text-foreground" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground">
              {isSummaryLoading ? "—" : formatPrice(aov)}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Across all settled cart checkouts
            </p>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-4 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-mono uppercase tracking-wider">
              Total Orders
            </span>
            <ShoppingBag className="h-4 w-4 text-foreground" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground">
              {isSummaryLoading ? "—" : totalOrders}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Fulfillment records in pipeline
            </p>
          </div>
        </Card>

        {/* Active Customers */}
        <Card className="p-4 flex flex-col justify-between border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-mono uppercase tracking-wider">
              Active Customers
            </span>
            <Users className="h-4 w-4 text-foreground" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground">
              {isSummaryLoading ? "—" : activeCustomers}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Accounts with registered purchases
            </p>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} isLoading={isRevenueLoading} />
        <TopProductsChart
          data={topProducts}
          isLoading={isTopProductsLoading}
        />
      </div>

      {/* Low Stock Replenishment Table */}
      <LowStockTable variants={lowStock} isLoading={isLowStockLoading} />

      {/* Management Jump Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/sys-admin-portal/customers"
          className="border border-border rounded-lg p-4 bg-card hover:border-foreground/40 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground font-mono">
                Customer 360 & CRM
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inspect consumer lifetime value (LTV), transaction histories, and manage
              identity access and suspensions.
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground mt-4 block">
            OPEN_CRM →
          </span>
        </Link>

        <Link
          href="/sys-admin-portal/discounts"
          className="border border-border rounded-lg p-4 bg-card hover:border-foreground/40 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground font-mono">
                Discounts & Promotions
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deploy percentage and fixed-value promotional codes with strict usage
              quotas and automated Stripe coupon sync.
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground mt-4 block">
            MANAGE_PROMOS →
          </span>
        </Link>

        <Link
          href="/sys-admin-portal/orders"
          className="border border-border rounded-lg p-4 bg-card hover:border-foreground/40 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground font-mono">
                Order Fulfillment
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track warehouse dispatch queues, assign courier tracking numbers, and view
              audit trails.
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground mt-4 block">
            DISPATCH_FLOW →
          </span>
        </Link>
      </div>
    </div>
  );
}
