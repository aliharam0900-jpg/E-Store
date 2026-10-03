"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart-store";
import type { ProductWithDetails } from "@/types";

interface ProductCardProps {
  product: ProductWithDetails;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { activeCurrency, exchangeRates } = useCartStore();
  const images = product.images || [];
  const primaryImg = images[0]?.image_url || "/placeholder-product.jpg";
  const secondaryImg = images[1]?.image_url || null;

  // Calculate stock total across variants
  const totalStock = (product.variants || []).reduce(
    (sum, v) => sum + (v.inventory_count || 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col"
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-3/4 w-full overflow-hidden rounded-md border border-border bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Primary Image */}
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
          <Image
            src={primaryImg}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className={`object-cover object-center transition-opacity duration-300 ${
              secondaryImg ? "group-hover:opacity-0" : ""
            }`}
          />
        </div>

        {/* Secondary Image for Hover State */}
        {secondaryImg && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-hover:scale-105 transition-transform">
            <Image
              src={secondaryImg}
              alt={`${product.title} alternate view`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center"
            />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.category && (
            <span className="bg-background/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-foreground border border-border/80">
              {product.category.name}
            </span>
          )}
          {product.compare_at_price && product.compare_at_price > product.base_price && (
            <span className="bg-foreground text-background px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
              Sale
            </span>
          )}
        </div>

        {/* Stock Alert Badge */}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground border border-border px-3 py-1 bg-background">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Info Section */}
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/product/${product.slug}`}
            className="text-xs font-semibold text-foreground hover:underline line-clamp-1"
          >
            {product.title}
          </Link>

          <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
            <span className="font-bold text-foreground" suppressHydrationWarning>
              {formatPrice(product.base_price, activeCurrency, exchangeRates)}
            </span>
            {product.compare_at_price && (
              <span className="text-[10px] text-muted-foreground line-through" suppressHydrationWarning>
                {formatPrice(product.compare_at_price, activeCurrency, exchangeRates)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>
            {product.variants?.length ? `${product.variants.length} variant(s)` : "Standard Edition"}
          </span>
          {totalStock > 0 && totalStock <= 5 && (
            <span className="text-amber-500 text-[10px]">
              Only {totalStock} left
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
