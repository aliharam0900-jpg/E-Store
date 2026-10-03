"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Loader2,
  Lock,
  Tag,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/useCartStore";
import { createCheckoutSession } from "@/app/actions/stripe";
import { validatePromoCode } from "@/app/actions/discounts";
import { formatPrice } from "@/lib/utils/format";

export function CartSheet() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    appliedDiscount,
    applyDiscount,
    removeDiscount,
    getRawSubtotal,
    getDiscountAmount,
    cartTotal,
    activeCurrency,
    exchangeRates,
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [promoInput, setPromoInput] = React.useState("");
  const [isValidatingPromo, setIsValidatingPromo] = React.useState(false);

  const rawSubtotal = getRawSubtotal();
  const discountAmount = getDiscountAmount();
  const total = cartTotal();

  const freeShippingThreshold = 150;
  const progressToFreeShipping = Math.min(
    100,
    (rawSubtotal / freeShippingThreshold) * 100
  );

  const handleApplyPromo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoInput.trim() || isValidatingPromo) return;

    try {
      setIsValidatingPromo(true);
      const res = await validatePromoCode(promoInput.trim());

      if (!res.valid || !res.discount) {
        toast.error(res.error || "Invalid promotional code.");
        setIsValidatingPromo(false);
        return;
      }

      applyDiscount({
        id: res.discount.id,
        code: res.discount.code,
        type: res.discount.discount_type,
        value: res.discount.value,
      });

      setPromoInput("");
      toast.success(
        `Applied "${res.discount.code}" (${res.discount.description})`
      );
    } catch (err: any) {
      toast.error("Failed to validate promo code.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || isCheckingOut) return;

    try {
      setIsCheckingOut(true);
      const result = await createCheckoutSession(
        items,
        appliedDiscount?.code || null,
        activeCurrency
      );

      if (!result.success || !result.url) {
        toast.error(
          result.error || "Unable to initialize checkout session with Stripe."
        );
        setIsCheckingOut(false);
        return;
      }

      // Redirect user directly to Stripe Hosted Checkout
      window.location.href = result.url;
    } catch (err: any) {
      console.error("[CHECKOUT_CLIENT_ERROR]", err);
      toast.error(
        "A network communication error occurred with the checkout gateway."
      );
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background text-foreground border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-foreground" />
              <SheetTitle className="text-base font-bold tracking-tight font-mono">
                SHOPPING CART
              </SheetTitle>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {items.length} unique item(s)
            </span>
          </div>

          {/* Free Shipping Progress bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
              <span className="text-muted-foreground">
                {rawSubtotal >= freeShippingThreshold ? (
                  <span className="text-emerald-500 font-medium">
                    Complimentary Express Shipping Unlocked
                  </span>
                ) : (
                  <span>
                    Add{" "}
                    <strong className="text-foreground">
                      {formatPrice(
                        Math.max(0, freeShippingThreshold - rawSubtotal),
                        activeCurrency,
                        exchangeRates
                      )}
                    </strong>{" "}
                    for Free Shipping
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(progressToFreeShipping)}%
              </span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="font-semibold text-sm text-foreground font-mono">
                YOUR CART IS EMPTY
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Explore the latest seasonal arrivals and limited editions in our catalog.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                asChild
                className="mt-3 font-mono text-xs"
              >
                <Link href="/shop">Explore Catalog</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => {
                const variantKey = item.variant_id || item.variantId || "";
                const img = item.image_url || item.image;
                const size = item.selected_size || item.size;
                const color = item.selected_color || item.color;

                return (
                  <div
                    key={variantKey}
                    className="py-4 flex gap-4 first:pt-0 last:pb-0"
                  >
                    {/* Thumbnail */}
                    <div className="h-20 w-20 rounded-md border border-border bg-muted overflow-hidden shrink-0">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground font-mono text-[10px]">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-xs text-foreground line-clamp-1">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground mt-0.5">
                            {size && <span>Size: {size}</span>}
                            {size && color && <span>•</span>}
                            {color && <span>Color: {color}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isCheckingOut}
                          onClick={() => removeItem(variantKey)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity selector */}
                        <div className="flex items-center border border-border rounded-md bg-muted/40">
                          <button
                            type="button"
                            disabled={isCheckingOut}
                            onClick={() =>
                              updateQuantity(variantKey, item.quantity - 1)
                            }
                            className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs px-2.5 min-w-[24px] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isCheckingOut}
                            onClick={() =>
                              updateQuantity(variantKey, item.quantity + 1)
                            }
                            className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="font-mono text-xs font-semibold text-foreground">
                          {formatPrice(item.price * item.quantity, activeCurrency, exchangeRates)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-border bg-card/40 flex flex-col gap-3">
            {/* Promo Code Input Section */}
            <div className="w-full">
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-muted/50 border border-border rounded-md px-3 py-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Tag className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{appliedDiscount.code}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                      {appliedDiscount.type === "percentage"
                        ? `${appliedDiscount.value}% OFF`
                        : `${formatPrice(appliedDiscount.value, activeCurrency, exchangeRates)} OFF`}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Remove coupon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleApplyPromo}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Promo code (e.g. SUMMER20)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="pl-8 h-8 text-xs font-mono uppercase"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!promoInput.trim() || isValidatingPromo}
                    className="h-8 px-3 text-xs font-mono"
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 font-mono text-xs w-full pt-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Subtotal</span>
                <span>{formatPrice(rawSubtotal, activeCurrency, exchangeRates)}</span>
              </div>

              {appliedDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span className="flex items-center gap-1">
                    Discount ({appliedDiscount.code})
                  </span>
                  <span>-{formatPrice(discountAmount, activeCurrency, exchangeRates)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {rawSubtotal >= freeShippingThreshold
                    ? "FREE"
                    : "Calculated at checkout"}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2 font-mono">
                <span>Total Amount</span>
                <span>{formatPrice(total, activeCurrency, exchangeRates)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <Button
              className="w-full gap-2 text-xs font-semibold font-mono h-10 mt-1"
              disabled={isCheckingOut || items.length === 0}
              onClick={handleCheckout}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Checkout Now <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-mono">
              256-bit SSL encrypted • Card data processed securely by Stripe
            </p>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
