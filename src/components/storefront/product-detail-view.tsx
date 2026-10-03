"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Check,
  Shield,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Loader2,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils/format";
import type { ProductWithDetails, ProductVariant } from "@/types";

interface ProductDetailViewProps {
  product: ProductWithDetails;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const images = product.images || [];
  const variants = product.variants || [];
  const { addItem, activeCurrency, exchangeRates } = useCartStore();

  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [zoomCoords, setZoomCoords] = React.useState({ x: 50, y: 50 });
  const [isAdding, setIsAdding] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState(false);
  const mobileGalleryRef = React.useRef<HTMLDivElement>(null);

  // Extract distinct colors and sizes
  const colors = React.useMemo(() => {
    const list = Array.from(
      new Set(variants.map((v) => v.color).filter(Boolean))
    ) as string[];
    return list;
  }, [variants]);

  const sizes = React.useMemo(() => {
    const list = Array.from(
      new Set(variants.map((v) => v.size).filter(Boolean))
    ) as string[];
    return list;
  }, [variants]);

  // Selected color and size state (default to first available variant)
  const defaultVariant = variants[0];
  const [selectedColor, setSelectedColor] = React.useState<string | null>(
    defaultVariant?.color || (colors.length ? colors[0] : null)
  );
  const [selectedSize, setSelectedSize] = React.useState<string | null>(
    defaultVariant?.size || (sizes.length ? sizes[0] : null)
  );

  // Find exact matching variant based on current selections
  const matchingVariant = React.useMemo(() => {
    return variants.find((v) => {
      const matchColor = !selectedColor || v.color === selectedColor;
      const matchSize = !selectedSize || v.size === selectedSize;
      return matchColor && matchSize;
    }) || variants[0];
  }, [variants, selectedColor, selectedSize]);

  // Crucial Logic: Determine if a size is disabled for the currently selected color
  const isSizeDisabled = (size: string) => {
    const variantForSize = variants.find((v) => {
      const matchColor = !selectedColor || v.color === selectedColor;
      return matchColor && v.size === size;
    });

    // Disabled if no such variant exists or inventory count is 0
    return !variantForSize || variantForSize.inventory_count <= 0;
  };

  // Dynamic calculated price incorporating variant price adjustment
  const currentPrice =
    product.base_price + (matchingVariant?.price_adjustment || 0);
  const isOutOfStock = !matchingVariant || matchingVariant.inventory_count <= 0;

  // Handle zoom hover coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x, y });
  };

  // Add to cart with micro-interaction
  const handleAddToCart = () => {
    if (isOutOfStock || !matchingVariant) return;

    setIsAdding(true);

    setTimeout(() => {
      addItem({
        product_id: product.id,
        variant_id: matchingVariant.id,
        productId: product.id,
        variantId: matchingVariant.id,
        title: product.title,
        sku: matchingVariant.sku,
        selected_size: matchingVariant.size || "",
        selected_color: matchingVariant.color || "",
        size: matchingVariant.size,
        color: matchingVariant.color,
        price: currentPrice,
        image_url: images[0]?.image_url || "",
        image: images[0]?.image_url || null,
      });

      setIsAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }, 400);
  };

  const activeImage = images[activeImageIndex]?.image_url || "/placeholder-product.jpg";

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-8">
        <Link href="/shop" className="hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px]">
          <ArrowLeft className="h-3 w-3" /> Catalog
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-foreground transition-colors flex items-center min-h-[44px]"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">
          {product.title}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery (Mobile Swipeable + Desktop Interactive) */}
        <div className="lg:col-span-7">
          {/* Mobile Swipeable Gallery with touch-pan-x (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            <div
              ref={mobileGalleryRef}
              className="relative w-full aspect-3/4 overflow-x-auto flex snap-x snap-mandatory touch-pan-x scroll-smooth rounded-lg border border-border bg-card no-scrollbar"
              onScroll={(e) => {
                const target = e.currentTarget;
                if (target.clientWidth > 0) {
                  const index = Math.round(target.scrollLeft / target.clientWidth);
                  if (index !== activeImageIndex && index >= 0 && index < images.length) {
                    setActiveImageIndex(index);
                  }
                }
              }}
            >
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="w-full h-full shrink-0 snap-center relative aspect-3/4"
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || `${product.title} image ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover object-center"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full shrink-0 snap-center relative aspect-3/4">
                  <Image
                    src="/placeholder-product.jpg"
                    alt={product.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                </div>
              )}
            </div>

            {/* Mobile Dots Indicator */}
            {images.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      if (mobileGalleryRef.current) {
                        mobileGalleryRef.current.scrollTo({
                          left: idx * mobileGalleryRef.current.clientWidth,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 cursor-pointer"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <span
                      className={`h-2 rounded-full transition-all ${
                        activeImageIndex === idx
                          ? "w-6 bg-foreground"
                          : "w-2 bg-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop/Tablet Interactive Gallery (hidden sm:flex) */}
          <div className="hidden sm:flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails strip */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0 pb-2 sm:pb-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative min-w-[44px] min-h-[44px] h-18 w-18 sm:h-20 sm:w-20 rounded-md overflow-hidden border transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-foreground ring-1 ring-foreground"
                        : "border-border hover:border-foreground/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || `View ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Hero Gallery Viewport with Hover Zoom */}
            <div
              className="relative flex-1 aspect-3/4 rounded-lg overflow-hidden border border-border bg-card cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={activeImage}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center transition-transform duration-200"
                style={{
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: isZoomed ? "scale(1.8)" : "scale(1)",
                }}
              />

              {/* Hover to Zoom indicator */}
              <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 pointer-events-none border border-border">
                <ZoomIn className="h-3 w-3" />
                <span>HOVER TO ZOOM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Dynamic Variant Engine, CTA */}
        <div className="lg:col-span-5 space-y-6 lg:pl-4 pb-28 sm:pb-12">
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center gap-2">
              {product.category && (
                <Badge variant="outline" className="text-[10px] font-mono uppercase">
                  {product.category.name}
                </Badge>
              )}
              <span className="font-mono text-[10px] text-muted-foreground">
                SKU: {matchingVariant?.sku || "SKU-N/A"}
              </span>
            </div>

            <h1 className="text-fluid-2xl font-extrabold tracking-tight text-foreground">
              {product.title}
            </h1>

            {/* Price with Dynamic Adjustment Display */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono text-2xl font-bold text-foreground">
                {formatPrice(currentPrice, activeCurrency, exchangeRates)}
              </span>
              {product.compare_at_price && (
                <span className="font-mono text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price, activeCurrency, exchangeRates)}
                </span>
              )}
              {matchingVariant?.price_adjustment !== 0 && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  (Includes {matchingVariant?.price_adjustment > 0 ? "+" : ""}
                  {formatPrice(matchingVariant?.price_adjustment || 0, activeCurrency, exchangeRates)} variant offset)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line border-b border-border pb-6 font-sans">
              {product.description}
            </div>
          )}

          {/* 1. Dynamic Variant Engine: Colors */}
          {colors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Color</span>
                <span className="font-mono text-muted-foreground text-[11px]">
                  {selectedColor || "Select"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-md text-xs font-mono border transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Dynamic Variant Engine: Sizes with Dynamic Inventory Guard */}
          {sizes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Size</span>
                <span className="font-mono text-muted-foreground text-[11px]">
                  {selectedSize || "Select"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const disabled = isSizeDisabled(size);

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-md text-xs font-mono border transition-all flex items-center justify-center relative ${
                        disabled
                          ? "opacity-30 border-border text-muted-foreground line-through cursor-not-allowed bg-muted/40"
                          : isSelected
                          ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                          : "border-border text-foreground hover:border-foreground/50 hover:bg-muted cursor-pointer"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Notice */}
          <div className="text-xs font-mono">
            {isOutOfStock ? (
              <span className="text-destructive font-semibold">
                ● Currently Sold Out
              </span>
            ) : matchingVariant.inventory_count <= 5 ? (
              <span className="text-amber-500 font-semibold">
                ● Low Inventory: Only {matchingVariant.inventory_count} remaining
              </span>
            ) : (
              <span className="text-emerald-500 font-medium">
                ● In Stock & Ready to Dispatch
              </span>
            )}
          </div>

          {/* Call to Action Button */}
          <div className="pt-2">
            <Button
              size="lg"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
              className="w-full h-12 text-sm font-semibold tracking-wide uppercase gap-2 transition-transform active:scale-[0.98]"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding to Cart...
                </>
              ) : justAdded ? (
                <>
                  <Check className="h-4 w-4" /> Added to Order
                </>
              ) : isOutOfStock ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Add to Cart • {formatPrice(currentPrice, activeCurrency, exchangeRates)}
                </>
              )}
            </Button>
          </div>

          {/* Value Props Guarantee */}
          <div className="border border-border rounded-lg p-4 bg-card/60 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Complimentary express delivery on orders over $150</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>30-day archival exchange and returns guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Authenticity guaranteed • Monolith Serialized Hardware</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
