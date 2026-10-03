"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight, ShoppingBag, ShieldCheck, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCartStore();

  React.useEffect(() => {
    // Automatically purge the cart upon confirmed checkout
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 px-4 sm:px-6">
      {/* Visual Badge Icon */}
      <div className="inline-flex items-center justify-center p-4 rounded-full bg-foreground text-background shadow-lg">
        <Check className="h-8 w-8 stroke-[2.5]" />
      </div>

      <div className="space-y-3">
        <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          Transaction Authorized & Fulfilled
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
          PAYMENT CONFIRMED
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Thank you for your acquisition. Your order has been registered into our queue
          and is now being prepared by our fulfillment specialists.
        </p>
      </div>

      {/* Session Reference Card */}
      {sessionId && (
        <div className="bg-card border border-border rounded-lg p-4 max-w-md mx-auto text-left space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Payment Reference</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Verified
            </span>
          </div>
          <div className="font-mono text-xs break-all bg-muted/60 p-2.5 rounded border border-border/50 text-foreground">
            {sessionId}
          </div>
        </div>
      )}

      {/* Reassurance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
        <div className="border border-border rounded-lg p-4 bg-card/40 space-y-2">
          <Truck className="h-5 w-5 text-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground">
            Express Transit
          </h4>
          <p className="text-xs text-muted-foreground">
            Real-time tracking updates will be transmitted to your email address.
          </p>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card/40 space-y-2">
          <ShieldCheck className="h-5 w-5 text-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground">
            Authenticity Guaranteed
          </h4>
          <p className="text-xs text-muted-foreground">
            Every garment includes our cryptographic serial certificate of origin.
          </p>
        </div>

        <div className="border border-border rounded-lg p-4 bg-card/40 space-y-2">
          <Package className="h-5 w-5 text-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground">
            Discrete Packaging
          </h4>
          <p className="text-xs text-muted-foreground">
            Shipped in reinforced weatherproof recyclable monolithic containers.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-border">
        <Button asChild className="w-full sm:w-auto gap-2">
          <Link href="/shop">
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto gap-2">
          <Link href="/">
            Return Home <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16">
      <React.Suspense
        fallback={
          <div className="text-center font-mono text-xs text-muted-foreground">
            Finalizing order credentials...
          </div>
        }
      >
        <SuccessContent />
      </React.Suspense>
    </div>
  );
}
