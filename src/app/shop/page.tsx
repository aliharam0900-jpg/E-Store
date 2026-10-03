import * as React from "react";
import type { Metadata } from "next";
import { ShopCatalog } from "@/components/storefront/shop-catalog";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Catalog Collection | MONOLITH",
  description: "Explore the comprehensive archive of precision engineered apparel and objects.",
};

export default function ShopPage() {
  return (
    <div className="pt-16 pb-20">
      <React.Suspense
        fallback={
          <div className="h-96 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <span className="font-mono text-xs">INITIALIZING_CATALOG...</span>
          </div>
        }
      >
        <ShopCatalog />
      </React.Suspense>
    </div>
  );
}
