"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";

export default function CheckoutCancelPage() {
  const { openCart, items } = useCartStore();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted border border-border text-muted-foreground">
          <XCircle className="h-8 w-8 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
            Transaction Interrupted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
            CHECKOUT CANCELLED
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your payment session was cancelled. No charges have been made to your payment
            instrument. All items remain securely stored in your cart.
          </p>
        </div>

        {items.length > 0 && (
          <div className="bg-card/60 border border-border rounded-lg p-3 text-xs font-mono text-muted-foreground flex items-center justify-between">
            <span>Items retained in cart:</span>
            <span className="font-bold text-foreground">{items.length} item(s)</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border">
          {items.length > 0 && (
            <Button
              onClick={openCart}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Review Cart & Retry
            </Button>
          )}
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto gap-2"
          >
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4" /> Browse Catalog
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
