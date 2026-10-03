import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutCustomerAction } from "@/app/actions/auth";
import {
  User,
  ShoppingBag,
  Package,
  Calendar,
  LogOut,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/account");
  }

  // Fetch orders matching the active user_id
  const { data: rawOrders } = await supabase
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
            id,
            title,
            slug
          )
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = rawOrders || [];
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Customer";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge variant="success">DELIVERED</Badge>;
      case "shipped":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono">SHIPPED</Badge>;
      case "processing":
        return <Badge variant="outline" className="border-amber-500 text-amber-500 font-mono">PROCESSING</Badge>;
      case "cancelled":
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">PENDING</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Header Profile Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg font-mono">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {displayName}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {user.email} • ID: {user.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
            <Link href="/shop">
              <ShoppingBag className="h-3.5 w-3.5" /> Continue Shopping
            </Link>
          </Button>
          <form action={signOutCustomerAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        {/* Main Orders Column */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Package className="h-5 w-5" /> Order History & Dispatches
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time fulfillment tracking and itemization of your acquisitions
            </p>
          </div>

          {orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-center p-10 space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    No orders recorded yet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Your collection history will appear here once you acquire pieces from our archive.
                  </p>
                </div>
                <Button asChild size="sm" className="mt-2 text-xs">
                  <Link href="/shop" className="gap-1.5">
                    Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const items = order.order_items || [];
                const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Card key={order.id} className="overflow-hidden border-border">
                    <CardHeader className="bg-muted/30 p-4 border-b border-border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono font-bold text-foreground">
                            ORDER #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3 w-3" /> {formattedDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(order.status)}
                          <span className="font-mono font-bold text-foreground">
                            {formatPrice(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {order.tracking_number && (
                        <div className="p-2.5 rounded bg-muted/40 border border-border flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Truck className="h-3.5 w-3.5 text-foreground" />
                            <span>Tracking: {order.tracking_number}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">EXPRESS COURIER</span>
                        </div>
                      )}

                      <div className="divide-y divide-border text-xs">
                        {items.map((item: any) => {
                          const variant = item.variant;
                          const product = variant?.product;
                          return (
                            <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <Link
                                  href={`/product/${product?.slug || ""}`}
                                  className="font-medium text-foreground hover:underline"
                                >
                                  {product?.title || "Archival Garment"}
                                </Link>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {variant?.size && `Size: ${variant.size}`}
                                  {variant?.color && ` • Color: ${variant.color}`}
                                  {variant?.sku && ` • SKU: ${variant.sku}`}
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <div>Qty: {item.quantity}</div>
                                <div className="text-muted-foreground text-[11px]">
                                  {formatPrice(item.price_at_time)} ea
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column: Account Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" /> Identity & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] block">Primary Email</span>
                <span className="font-mono font-medium text-foreground">{user.email}</span>
              </div>
              <div className="space-y-1 border-t border-border pt-2.5">
                <span className="text-muted-foreground text-[11px] block">Authentication Provider</span>
                <span className="font-mono text-foreground uppercase">
                  {user.app_metadata?.provider || "Supabase Email/PW"}
                </span>
              </div>
              <div className="space-y-1 border-t border-border pt-2.5">
                <span className="text-muted-foreground text-[11px] block">Account Created</span>
                <span className="font-mono text-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Concierge Support</CardTitle>
              <CardDescription className="text-xs">
                Inquiries regarding orders, bespoke tailoring, or warranty claims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                All Monolith artifacts are covered under lifetime manufacturing defect warranty.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/shop">Browse Full Catalog</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
