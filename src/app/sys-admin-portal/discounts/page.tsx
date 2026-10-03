"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Copy,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "@/lib/services/discounts";
import { formatDate } from "@/lib/utils/format";
import type { Discount, DiscountType } from "@/types";

export default function DiscountsManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");

  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);

  // Form state
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState<DiscountType>("percentage");
  const [value, setValue] = React.useState<number>(10);
  const [expiresAt, setExpiresAt] = React.useState<string>("");
  const [usageLimit, setUsageLimit] = React.useState<string>("");
  const [currentTime] = React.useState(() => Date.now());

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: getDiscounts,
  });

  const createMutation = useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Promo code created successfully.");
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create promo code.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Promo code updated successfully.");
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update promo code.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Promo code deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete promo code.");
    },
  });

  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setCode("");
    setDiscountType("percentage");
    setValue(15);
    setExpiresAt("");
    setUsageLimit("");
    setIsOpen(true);
  };

  const handleOpenEdit = (d: Discount) => {
    setEditingDiscount(d);
    setCode(d.code);
    setDiscountType(d.discount_type);
    setValue(d.value);
    setExpiresAt(d.expires_at ? d.expires_at.slice(0, 16) : "");
    setUsageLimit(d.usage_limit ? String(d.usage_limit) : "");
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingDiscount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Code is required");
      return;
    }
    if (value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      value: Number(value),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      usage_limit: usageLimit.trim() ? parseInt(usageLimit, 10) : null,
    };

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data: payload });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const filteredDiscounts = React.useMemo(() => {
    return discounts.filter((d) => {
      const q = search.toLowerCase();
      return !search || d.code.toLowerCase().includes(q);
    });
  }, [discounts, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info(`Copied "${text}" to clipboard.`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <Tag className="h-5 w-5" /> Promo Codes & Discounts
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated checkout discounts with usage thresholds and Stripe synchronization
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 font-mono text-xs">
          <Plus className="h-3.5 w-3.5" /> Create Promo Code
        </Button>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs font-mono uppercase"
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {filteredDiscounts.length} ACTIVE_RULES
        </div>
      </div>

      {/* Discounts Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground font-mono text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <span>FETCHING_DISCOUNT_RULES...</span>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center p-4">
            <p className="text-sm font-semibold text-foreground font-mono">No promotional codes found</p>
            <p className="text-xs text-muted-foreground">
              Create your first campaign coupon (e.g., SUMMER20, WELCOME10) to stimulate conversions.
            </p>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              variant="outline"
              className="mt-3 font-mono text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New Promo Code
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-[11px] font-mono">
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => {
                const isExpired =
                  discount.expires_at &&
                  new Date(discount.expires_at).getTime() <= currentTime;
                const isExhausted =
                  discount.usage_limit !== null &&
                  discount.times_used >= discount.usage_limit;
                const isActive = !isExpired && !isExhausted;

                return (
                  <TableRow key={discount.id} className="text-xs hover:bg-muted/40 font-mono">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                          {discount.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(discount.code)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {discount.discount_type === "percentage" ? "Percentage" : "Fixed USD"}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {discount.discount_type === "percentage"
                        ? `${discount.value}%`
                        : `$${discount.value}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {discount.times_used}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          / {discount.usage_limit ?? "∞"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      {discount.expires_at ? (
                        formatDate(discount.expires_at, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground/60">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ACTIVE
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive" className="text-[10px]">
                          EXPIRED
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          EXHAUSTED
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(discount)}
                          title="Edit Promo Code"
                          aria-label="Edit Promo Code"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete promo code "${discount.code}"?`)) {
                              deleteMutation.mutate(discount.id);
                            }
                          }}
                          title="Delete Promo Code"
                          aria-label="Delete Promo Code"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Promo Code Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-mono">
              {editingDiscount ? "EDIT PROMO CODE" : "CREATE NEW PROMO CODE"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define redemption rules, percent or fixed deductions, and expiration limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-mono font-medium text-foreground block mb-1">
                Coupon Code *
              </label>
              <Input
                placeholder="e.g. VIP20, WINTERSALE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono font-medium text-foreground block mb-1">
                  Discount Type *
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 text-xs font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Dollar ($)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-foreground block mb-1">
                  Value ({discountType === "percentage" ? "%" : "$"}) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono font-medium text-foreground block mb-1">
                  Expiration Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-foreground block mb-1">
                  Usage Limit (Optional)
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseDialog}
                className="font-mono text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="font-mono text-xs"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                {editingDiscount ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
