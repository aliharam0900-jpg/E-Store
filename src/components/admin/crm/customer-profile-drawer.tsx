"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  ShoppingBag,
  DollarSign,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Ban,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomerOrderHistory } from "@/lib/services/customers";
import { toggleCustomerBanAction } from "@/app/actions/customers";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { CustomerCrmRecord } from "@/types";

interface CustomerProfileDrawerProps {
  customer: CustomerCrmRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated?: (updatedCustomer: CustomerCrmRecord) => void;
}

export function CustomerProfileDrawer({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated,
}: CustomerProfileDrawerProps) {
  const queryClient = useQueryClient();

  const { data: orderHistory = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ["customer_orders", customer?.id],
    queryFn: () => (customer?.id ? getCustomerOrderHistory(customer.id) : []),
    enabled: !!customer?.id && isOpen,
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      toggleCustomerBanAction(userId, banned),
    onSuccess: (res, vars) => {
      if (!res.success) {
        toast.error(res.error || "Failed to update account status.");
        return;
      }

      toast.success(
        vars.banned
          ? `Account suspended. Middleware will block customer requests.`
          : `Account reinstated. Access privileges restored.`
      );

      queryClient.invalidateQueries({ queryKey: ["customers_crm"] });

      if (customer && onCustomerUpdated) {
        onCustomerUpdated({
          ...customer,
          is_banned: vars.banned,
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update account status.");
    },
  });

  if (!customer) return null;

  const aov =
    customer.order_count > 0
      ? customer.lifetime_value / customer.order_count
      : 0;

  const handleToggleBan = () => {
    const nextState = !customer.is_banned;
    const confirmMsg = nextState
      ? `Are you sure you want to suspend "${customer.email}"? This will immediately terminate checkout authorization and storefront sessions via edge middleware.`
      : `Reinstate account for "${customer.email}"?`;

    if (window.confirm(confirmMsg)) {
      banMutation.mutate({ userId: customer.id, banned: nextState });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 bg-background text-foreground border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm font-mono">
                {customer.full_name
                  ? customer.full_name.slice(0, 2).toUpperCase()
                  : "U"}
              </div>
              <div>
                <SheetTitle className="text-base font-bold font-mono tracking-tight">
                  {customer.full_name || "Anonymous Consumer"}
                </SheetTitle>
                <p className="text-xs font-mono text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>

            <Badge
              variant={customer.is_banned ? "destructive" : "default"}
              className="font-mono text-[10px]"
            >
              {customer.is_banned ? "SUSPENDED" : "ACTIVE"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground pt-1">
            <span>Role: {customer.role.toUpperCase()}</span>
            <span>•</span>
            <span>
              Member since:{" "}
              {formatDate(customer.created_at, {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* LTV & Engagement Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 border-border bg-card">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Lifetime Value
              </span>
              <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                {formatPrice(customer.lifetime_value)}
              </span>
            </Card>

            <Card className="p-3 border-border bg-card">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Total Orders
              </span>
              <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                {customer.order_count}
              </span>
            </Card>

            <Card className="p-3 border-border bg-card">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Avg Order Value
              </span>
              <span className="text-lg font-bold font-mono text-foreground mt-1 block">
                {formatPrice(aov)}
              </span>
            </Card>
          </div>

          {/* Account Security & Suspension Control */}
          <div className="border border-border rounded-lg p-4 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold font-mono text-foreground uppercase tracking-wider flex items-center gap-2">
                  {customer.is_banned ? (
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  )}
                  Access Control Authority
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {customer.is_banned
                    ? "Identity is currently banned. Edge middleware blocks requests to /shop and checkout."
                    : "Identity in good standing with standard customer checkout privileges."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={customer.is_banned ? "default" : "destructive"}
              size="sm"
              disabled={banMutation.isPending}
              onClick={handleToggleBan}
              className="w-full font-mono text-xs gap-2"
            >
              {banMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : customer.is_banned ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Reinstate Customer Identity
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  Suspend Account Access
                </>
              )}
            </Button>
          </div>

          {/* Customer Order History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                Transaction History ({orderHistory.length})
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                Last active:{" "}
                {customer.last_order_at
                  ? formatDate(customer.last_order_at, {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </span>
            </div>

            {isOrdersLoading ? (
              <div className="h-32 flex items-center justify-center font-mono text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                RETRIEVING_ORDER_LEDGER...
              </div>
            ) : orderHistory.length === 0 ? (
              <div className="border border-border rounded-lg p-6 text-center text-xs text-muted-foreground font-mono">
                No purchases recorded for this customer identity.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent text-[10px] font-mono">
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderHistory.map((order) => (
                      <TableRow
                        key={order.id}
                        className="text-xs font-mono hover:bg-muted/40"
                      >
                        <TableCell className="font-semibold text-foreground">
                          <Link
                            href="/sys-admin-portal/orders"
                            className="hover:underline flex items-center gap-1"
                          >
                            #{order.id.slice(0, 8)}
                            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px]">
                          {formatDate(order.created_at, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : order.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[9px] uppercase px-1.5 py-0"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
