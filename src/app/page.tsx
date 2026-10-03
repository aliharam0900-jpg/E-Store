"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Shield, Cpu, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSceneDynamic } from "@/components/3d/hero-canvas";
import { ProductCard } from "@/components/storefront/product-card";
import { getProducts } from "@/lib/services/products";
import { getStoreSettings } from "@/lib/services/settings";
import type { ProductWithDetails } from "@/types";

// Fallback preview items in case the Supabase database has not had products seeded yet
const sampleShowcaseProducts: ProductWithDetails[] = [
  {
    id: "sample-1",
    title: "Monolith Titanium Chrono 01",
    slug: "monolith-titanium-chrono-01",
    description: "Machined grade-5 titanium casing with sapphire crystal lens.",
    base_price: 495,
    compare_at_price: 580,
    category_id: "watches",
    is_published: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "watches",
      name: "Artifacts",
      slug: "artifacts",
      description: null,
      parent_id: null,
      created_at: new Date().toISOString(),
    },
    variants: [
      {
        id: "v1",
        product_id: "sample-1",
        sku: "MNT-CHRO-01",
        size: "42mm",
        color: "Raw Titanium",
        inventory_count: 8,
        price_adjustment: 0,
        created_at: new Date().toISOString(),
      },
    ],
    images: [
      {
        id: "img-1",
        product_id: "sample-1",
        image_url:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Titanium watch front",
        display_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: "img-2",
        product_id: "sample-1",
        image_url:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Titanium watch detail",
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "sample-2",
    title: "Ventile Technical Parka",
    slug: "ventile-technical-parka",
    description: "Weatherproof storm membrane engineered with bonded seam tape.",
    base_price: 360,
    compare_at_price: null,
    category_id: "apparel",
    is_published: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "apparel",
      name: "Outwear",
      slug: "outerwear",
      description: null,
      parent_id: null,
      created_at: new Date().toISOString(),
    },
    variants: [
      {
        id: "v2",
        product_id: "sample-2",
        sku: "VNT-PRK-BLK-M",
        size: "M",
        color: "Onyx Black",
        inventory_count: 14,
        price_adjustment: 0,
        created_at: new Date().toISOString(),
      },
    ],
    images: [
      {
        id: "img-3",
        product_id: "sample-2",
        image_url:
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Parka front",
        display_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: "img-4",
        product_id: "sample-2",
        image_url:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Parka back",
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "sample-3",
    title: "Carbon Utility Modular Bag",
    slug: "carbon-utility-modular-bag",
    description: "Ultra-high molecular weight polyethylene with Fidlock magnetic buckles.",
    base_price: 195,
    compare_at_price: 220,
    category_id: "accessories",
    is_published: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "accessories",
      name: "Equipment",
      slug: "equipment",
      description: null,
      parent_id: null,
      created_at: new Date().toISOString(),
    },
    variants: [
      {
        id: "v3",
        product_id: "sample-3",
        sku: "CRB-BAG-01",
        size: "18L",
        color: "Charcoal",
        inventory_count: 5,
        price_adjustment: 0,
        created_at: new Date().toISOString(),
      },
    ],
    images: [
      {
        id: "img-5",
        product_id: "sample-3",
        image_url:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Bag front",
        display_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: "img-6",
        product_id: "sample-3",
        image_url:
          "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Bag side",
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "sample-4",
    title: "Japanese Loopwheel Crewneck",
    slug: "japanese-loopwheel-crewneck",
    description: "Slow-knit 500gsm loopwheel cotton. Zero side seams.",
    base_price: 145,
    compare_at_price: null,
    category_id: "apparel",
    is_published: true,
    seo_title: null,
    seo_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "apparel",
      name: "Essentials",
      slug: "essentials",
      description: null,
      parent_id: null,
      created_at: new Date().toISOString(),
    },
    variants: [
      {
        id: "v4",
        product_id: "sample-4",
        sku: "LPW-CRW-GRY-L",
        size: "L",
        color: "Heather Gray",
        inventory_count: 22,
        price_adjustment: 0,
        created_at: new Date().toISOString(),
      },
    ],
    images: [
      {
        id: "img-7",
        product_id: "sample-4",
        image_url:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Crewneck front",
        display_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: "img-8",
        product_id: "sample-4",
        image_url:
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
        alt_text: "Crewneck fabric",
        display_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

export default function StorefrontHomePage() {
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["published_products"],
    queryFn: () => getProducts({ status: "published" }),
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["store_settings"],
    queryFn: () => getStoreSettings(),
  });

  const displayProducts = dbProducts.length > 0 ? dbProducts : sampleShowcaseProducts;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. 3D Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-border">
        {/* Subtle grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(hsl(var(--foreground)/0.15)_1px,transparent_1px)] [background-size:28px_28px]"
          aria-hidden="true"
        />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-foreground" />
                SERIES 04 • MATERIAL EVOLUTION
              </div>

              <h1 className="text-fluid-5xl font-black tracking-tight text-foreground leading-[0.95] uppercase">
                {storeSettings?.hero_headline || (
                  <>
                    Engineered <br />
                    Artifacts & Form.
                  </>
                )}
              </h1>

              <p className="text-fluid-base text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {storeSettings?.hero_subtext ||
                  "Industrial precision meets utilitarian apparel. Constructed with aerospace titanium, bonded weather-membranes, and zero aesthetic compromise."}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Button size="lg" asChild className="gap-2 text-xs font-semibold min-h-[44px]">
                  <Link href="/shop">
                    Explore Collection <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-xs min-h-[44px]">
                  <Link href="/shop" aria-label="All Categories">
                    All Categories
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border max-w-md mx-auto lg:mx-0 text-left font-mono">
                <div>
                  <span className="block text-xs font-bold text-foreground">GRADE 5</span>
                  <span className="text-[10px] text-muted-foreground">TITANIUM ALLOY</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-foreground">300K GSM</span>
                  <span className="text-[10px] text-muted-foreground">JAPANESE COTTON</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-foreground">60 FPS</span>
                  <span className="text-[10px] text-muted-foreground">WEBGL CORE</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Interactive 3D Canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex items-center justify-center w-full"
            >
              <div className="relative w-full max-w-md aspect-square rounded-2xl border border-border/80 bg-radial from-muted/40 via-card to-background p-2 shadow-2xl overflow-hidden">
                <HeroSceneDynamic />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-muted-foreground pointer-events-none">
                  <span>INTERACTIVE_R3F_PRISM</span>
                  <span>DRAG TO ROTATE</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Brand Ethos Ticker */}
      <div className="border-b border-border bg-muted/30 py-3 overflow-hidden">
        <div className="flex items-center justify-around text-xs font-mono text-muted-foreground tracking-widest uppercase">
          <span>• LIFETIME HARDWARE WARRANTY</span>
          <span className="hidden sm:inline">• CARBON-NEUTRAL EXPRESS FULFILLMENT</span>
          <span>• SECURE STRIPE ENCRYPTED CHECKOUT</span>
          <span className="hidden md:inline">• REAL-TIME INVENTORY ALLOCATION</span>
        </div>
      </div>

      {/* 3. Featured Collection Section */}
      <section className="py-16 lg:py-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Curated Releases
            </div>
            <h2 className="text-fluid-2xl font-bold tracking-tight text-foreground">
              Core Technical Catalog
            </h2>
          </div>

          <Button variant="outline" size="sm" asChild className="self-start sm:self-auto text-xs min-h-[44px] flex items-center">
            <Link href="/shop" className="gap-1.5">
              View All Products <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.slice(0, 4).map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 2} />
          ))}
        </div>
      </section>

      {/* 4. Engineering Manifesto Grid */}
      <section className="border-t border-border bg-card/40 py-16 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Industrial Discipline
            </span>
            <h3 className="text-fluid-xl font-bold text-foreground tracking-tight mt-1">
              Architectural principles of every manufactured piece
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border rounded-lg p-6 bg-background space-y-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">
                01. Monolithic Durability
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fabricated with materials resistant to abrasion, oxidation, and tensile stress.
                Engineered for decades, not seasons.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6 bg-background space-y-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-foreground">
                <Cpu className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">
                02. Real-Time Inventory Control
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stock is locked in real-time with sub-millisecond edge synchronization.
                Zero phantom allocations or delayed cancellations.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6 bg-background space-y-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">
                03. Strict Cryptographic Security
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero telemetry leakage. Customer payment credentials are tokenized
                with end-to-end PCI DSS Level 1 compliance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
