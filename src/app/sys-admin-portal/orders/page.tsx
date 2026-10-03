"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Search,
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  MapPin,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getOrders,
  updateOrderStatus,
  updateOrderTracking,
} from "@/lib/services/orders";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { OrderStatus, OrderWithDetails } from "@/types";

const statusMeta: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "neutral"; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  processing: { label: "Processing", variant: "default", icon: Loader2 },
  shipped: { label: "Shipped", variant: "secondary", icon: Truck },
  delivered: { label: "Delivered", variant: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selectedOrder, setSelectedOrder] = React.useState<OrderWithDetails | null>(null);
  const [trackingInput, setTrackingInput] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">("table");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders("all"),
  });

  // Optimistic order status update
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: OrderStatus }) =>
      updateOrderStatus(id, newStatus),
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData<OrderWithDetails[]>(["orders"]);

      queryClient.setQueryData<OrderWithDetails[]>(["orders"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      return { previousOrders };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
      toast.error(err.message || "Failed to update order status");
    },
    onSuccess: (_, { newStatus }) => {
      toast.success(`Order marked as ${newStatus.toUpperCase()}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Tracking number update
  const trackingMutation = useMutation({
    mutationFn: ({ id, tracking }: { id: string; tracking: string }) =>
      updateOrderTracking(id, tracking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Tracking number saved");
      if (selectedOrder) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, tracking_number: trackingInput } : null
        );
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save tracking number");
    },
  });

  const handleOpenOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setTrackingInput(order.tracking_number || "");
  };

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchEmail = o.user?.email.toLowerCase().includes(q);
      const matchName = o.user?.full_name?.toLowerCase().includes(q);
      return !search || matchId || matchEmail || matchName;
    });
  }, [orders, search]);

  // Kanban groupings
  const kanbanColumns: OrderStatus[] = [
    "pending",
    "processing",
    "shipped",
    "delivered",
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Fulfillment & Orders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor incoming purchases, track shipments, and dispatch fulfillment status
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted p-1 rounded-md border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Dense Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" /> Kanban Board
          </button>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order ID, email, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          TOTAL: {filteredOrders.length} ORDERS
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-border rounded-lg bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <span className="text-xs font-mono">SYNCHRONIZING_ORDERS...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 p-4 text-center border border-border rounded-lg bg-card">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <PackageCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">No orders found</p>
          <p className="text-xs text-muted-foreground">
            New customer checkouts will populate this pipeline in real-time.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* Dense Data Table View */
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const meta = statusMeta[order.status];
                const itemsCount = (order.order_items || []).reduce(
                  (sum, i) => sum + i.quantity,
                  0
                );

                return (
                  <TableRow
                    key={order.id}
                    onClick={() => handleOpenOrder(order)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {order.user?.full_name || "Guest Customer"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {order.user?.email || "anonymous"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(order.created_at, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {itemsCount} item(s)
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="View Order Details"
                        aria-label="View Order Details"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((colStatus) => {
            const colOrders = filteredOrders.filter((o) => o.status === colStatus);
            const meta = statusMeta[colStatus];
            const Icon = meta.icon;

            return (
              <div
                key={colStatus}
                className="border border-border rounded-lg bg-card/60 p-3 space-y-3 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                      {meta.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colOrders.map((order) => (
                    <Card
                      key={order.id}
                      onClick={() => handleOpenOrder(order)}
                      className="cursor-pointer hover:border-foreground/40 transition-all p-3.5 space-y-2.5 bg-background shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-foreground">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground">
                        <p className="font-medium text-foreground truncate">
                          {order.user?.full_name || "Customer"}
                        </p>
                        <p className="text-[10px] font-mono truncate">
                          {order.user?.email}
                        </p>
                      </div>

                      <div className="border-t border-border pt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>
                          {order.order_items?.length || 0} SKU item(s)
                        </span>
                        <span>
                          {formatDate(order.created_at, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Sheet (Drawer) */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center justify-between pr-6">
                  <span className="font-mono text-xs text-muted-foreground">
                    ORDER SPECIFICATION
                  </span>
                  <Badge variant={statusMeta[selectedOrder.status].variant}>
                    {statusMeta[selectedOrder.status].label}
                  </Badge>
                </div>
                <SheetTitle className="font-mono text-lg tracking-tight">
                  #{selectedOrder.id}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Created {formatDate(selectedOrder.created_at, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </SheetDescription>
              </SheetHeader>

              {/* Status Update Control */}
              <div className="border border-border rounded-lg p-3.5 bg-muted/30 space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Workflow Dispatch Status
                </label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(val: OrderStatus) =>
                    statusMutation.mutate({ id: selectedOrder.id, newStatus: val })
                  }
                >
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="processing">In Processing / Packing</SelectItem>
                    <SelectItem value="shipped">Dispatched & Shipped</SelectItem>
                    <SelectItem value="delivered">Successfully Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled & Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Number */}
              <div className="border border-border rounded-lg p-3.5 bg-muted/30 space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Carrier Tracking Reference
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. 1Z9999999999999999 (UPS/FedEx)"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      trackingMutation.mutate({
                        id: selectedOrder.id,
                        tracking: trackingInput,
                      })
                    }
                    disabled={trackingMutation.isPending}
                    className="h-8 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Customer Profile & Address from JSONB */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border pb-2">
                  <MapPin className="h-3.5 w-3.5" /> Destination Shipping Details
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {selectedOrder.user?.full_name || "Customer Name Unavailable"}
                  </p>
                  <p className="font-mono text-[11px]">{selectedOrder.user?.email}</p>

                  {/* Render Parsed Shipping Address JSONB */}
                  {selectedOrder.shipping_address ? (
                    <div className="mt-2 text-xs leading-relaxed text-foreground border-t border-border pt-2 font-sans">
                      {typeof selectedOrder.shipping_address === "object" ? (
                        <>
                          <p>{(selectedOrder.shipping_address as any).line1 || (selectedOrder.shipping_address as any).street}</p>
                          {(selectedOrder.shipping_address as any).line2 && (
                            <p>{(selectedOrder.shipping_address as any).line2}</p>
                          )}
                          <p>
                            {(selectedOrder.shipping_address as any).city},{" "}
                            {(selectedOrder.shipping_address as any).state || (selectedOrder.shipping_address as any).province}{" "}
                            {(selectedOrder.shipping_address as any).postal_code || (selectedOrder.shipping_address as any).zip}
                          </p>
                          <p className="font-semibold">
                            {(selectedOrder.shipping_address as any).country || "United States"}
                          </p>
                        </>
                      ) : (
                        <p>{String(selectedOrder.shipping_address)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No shipping address payload stored.
                    </p>
                  )}
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-foreground border-b border-border pb-2">
                  Purchased Items ({selectedOrder.order_items?.length || 0})
                </div>

                <div className="divide-y divide-border">
                  {selectedOrder.order_items?.map((item) => {
                    const productTitle = item.variant?.product?.title || "Product";
                    const sku = item.variant?.sku || "SKU-N/A";
                    const size = item.variant?.size;
                    const color = item.variant?.color;

                    return (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col max-w-[70%]">
                          <span className="font-medium text-foreground">
                            {productTitle}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            SKU: {sku} {size && `• Size: ${size}`} {color && `• Color: ${color}`}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-semibold text-foreground">
                            {formatPrice(item.price_at_time * item.quantity)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {item.quantity} × {formatPrice(item.price_at_time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border border-border rounded-lg p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    {formatPrice(
                      selectedOrder.total_amount -
                        selectedOrder.tax_amount -
                        selectedOrder.shipping_amount
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax Amount</span>
                  <span>{formatPrice(selectedOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span>{formatPrice(selectedOrder.shipping_amount)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                  <span>Total Invoiced</span>
                  <span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
