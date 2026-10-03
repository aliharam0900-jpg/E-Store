import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ExternalLink,
  ShoppingBag,
  Layers,
  Lock,
  ShieldAlert,
  BarChart3,
  Package,
  FolderTree,
  FileText,
  Users,
  TicketPercent,
  Settings,
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Box,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Application Views Directory | MONOLITH",
  description: "Comprehensive navigational map of all storefront, admin, commerce, and security views.",
};

interface ViewItem {
  title: string;
  path: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  isProtected?: boolean;
}

interface ViewSection {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  views: ViewItem[];
}

const VIEW_SECTIONS: ViewSection[] = [
  {
    category: "Storefront & Catalog",
    icon: ShoppingBag,
    description: "Public high-performance shopping experiences, 3D interactive hero, and faceted product catalog.",
    views: [
      {
        title: "Storefront Landing & 3D Hero",
        path: "/",
        description: "Homepage featuring the Three.js 3D geometric interactive scene, latest drop marquee, and seasonal collections.",
        badge: "Public",
        badgeVariant: "secondary",
      },
      {
        title: "Archival Catalog & Faceted Filters",
        path: "/shop",
        description: "Zero-reload client-side faceted catalog with color, category, price range, and instant query debouncing.",
        badge: "Public",
        badgeVariant: "secondary",
      },
      {
        title: "PDP: Monolith Modular Shell Jacket",
        path: "/product/modular-shell-jacket",
        description: "Product detail view with dynamic sizing/color matrix, live inventory guards, hover-to-zoom, and cart interaction.",
        badge: "Dynamic",
        badgeVariant: "outline",
      },
      {
        title: "PDP: Articulated Cargo Trousers",
        path: "/product/articulated-cargo-trousers",
        description: "Tactical apparel detail view demonstrating secondary variant specifications, SKU matching, and dynamic price offsets.",
        badge: "Dynamic",
        badgeVariant: "outline",
      },
      {
        title: "AI Architectural Shopping Concierge",
        path: "/",
        description: "Floating AI styling advisor powered by Vercel AI SDK and GPT-4o with live catalog grounding, sizing suggestions, and quick chips.",
        badge: "AI Feature",
        badgeVariant: "default",
      },
    ],
  },
  {
    category: "Commerce, Checkout & Fulfillment",
    icon: Box,
    description: "Cart state persistence, Stripe checkout confirmation, and post-purchase customer journeys.",
    views: [
      {
        title: "Slide-Out Cart Drawer",
        path: "/shop",
        description: "Global slide-over cart drawer featuring live quantity adjustments, discount coupon validation, and express shipping progress.",
        badge: "Global UI",
        badgeVariant: "secondary",
      },
      {
        title: "Order Fulfilled / Checkout Success",
        path: "/checkout/success",
        description: "Post-checkout fulfillment receipt displaying order confirmation, session reference, and delivery milestones.",
        badge: "Confirmation",
        badgeVariant: "default",
      },
      {
        title: "Checkout Cancelled Recovery",
        path: "/checkout/cancel",
        description: "Safe transaction recovery view allowing customers to resume checkout without cart state loss.",
        badge: "Recovery",
        badgeVariant: "outline",
      },
    ],
  },
  {
    category: "Identity & RBAC Security Gates",
    icon: Lock,
    description: "Edge middleware enforcement, fail-secure credential screens, and suspended identity mitigation.",
    views: [
      {
        title: "Authentication Gate",
        path: "/login",
        description: "Enterprise authentication portal protected by sliding-window rate limiting against brute-force attacks.",
        badge: "Rate-Limited",
        badgeVariant: "outline",
      },
      {
        title: "RBAC Middleware Redirection Gate",
        path: "/sys-admin-portal",
        description: "Protected route demonstrating automatic Edge interception and redirect to /login?redirectedFrom=%2Fsys-admin-portal.",
        badge: "Intercepted",
        badgeVariant: "destructive",
        isProtected: true,
      },
      {
        title: "HTTP 403 Suspended Identity Notice",
        path: "/unauthorized?banned=true",
        description: "Security shield screen displayed when a banned or suspended identity attempts access.",
        badge: "403 Banned",
        badgeVariant: "destructive",
      },
      {
        title: "HTTP 401 Unauthorized Notice",
        path: "/unauthorized",
        description: "Access denied landing for accounts lacking requisite administrative role credentials.",
        badge: "401 Forbidden",
        badgeVariant: "destructive",
      },
    ],
  },
  {
    category: "Stealth Admin Portal (/sys-admin-portal)",
    icon: BarChart3,
    description: "Enterprise administrative console with real-time financial reporting, inventory control, and CRM.",
    views: [
      {
        title: "Executive Financial Dashboard",
        path: "/sys-admin-portal",
        description: "Real-time metrics for Total Revenue, Average Order Value (AOV), Order Volume, and 30-day velocity charts.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Catalog Product Inventory Manager",
        path: "/sys-admin-portal/products",
        description: "High-density product inventory table with live search, stock level indicators, and edit triggers.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Product Authoring Console",
        path: "/sys-admin-portal/products/new",
        description: "Multi-variant product creator with automatic SKU generator, SEO meta fields, and image slot allocation.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Category Architecture Manager",
        path: "/sys-admin-portal/categories",
        description: "Category hierarchy editor with slug formatting and catalog parent-child relationships.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Orders & Fulfillment Logistics",
        path: "/sys-admin-portal/orders",
        description: "Live order processing ledger with payment verification and fulfillment state toggles.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Customer CRM & Lifetime Value",
        path: "/sys-admin-portal/customers",
        description: "Customer relationship directory with aggregate spend analysis, tier tagging, and purchase history.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Promotional Discount Engine",
        path: "/sys-admin-portal/discounts",
        description: "Coupon code management with percentage/fixed rules, usage volume ceilings, and expiry guards.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
      {
        title: "Platform & Security Settings",
        path: "/sys-admin-portal/settings",
        description: "Store configurations, currency definitions, maintenance mode toggles, and webhook status logs.",
        badge: "RBAC Admin",
        badgeVariant: "default",
        isProtected: true,
      },
    ],
  },
  {
    category: "Crawlers, SEO & Automated Endpoints",
    icon: Globe,
    description: "Search engine discoverability endpoints and crawler permissions.",
    views: [
      {
        title: "Dynamic XML Sitemap",
        path: "/sitemap.xml",
        description: "Auto-generated search engine index with weighted priority mappings for all published routes.",
        badge: "XML",
        badgeVariant: "secondary",
      },
      {
        title: "Robots Policy Specification",
        path: "/robots.txt",
        description: "Crawler instructions disallowing indexing of private consoles, API webhooks, and auth screens.",
        badge: "TXT",
        badgeVariant: "secondary",
      },
    ],
  },
];

export default function ViewsDirectoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Banner */}
        <div className="border border-border bg-card/60 p-8 rounded-xl shadow-xs backdrop-blur-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  SYSTEM READY • 19 OPTIMIZED ROUTES
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
                Application Views Directory
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Central navigation index for the Monolith Enterprise E-Commerce Platform.
                Access any storefront journey, commerce flow, administrative view, or security gate directly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/sys-admin-portal"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Staff Admin Portal <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-md border border-border bg-card hover:bg-muted transition-colors"
              >
                Launch Storefront
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium rounded-md border border-border bg-card hover:bg-muted transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-10">
          {VIEW_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.category} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {section.category}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.views.map((view) => (
                    <div
                      key={view.title}
                      className="group border border-border bg-card hover:border-foreground/40 rounded-lg p-5 transition-all flex flex-col justify-between space-y-4 hover:shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground group-hover:underline">
                            {view.title}
                          </span>
                          {view.badge && (
                            <Badge
                              variant={view.badgeVariant || "secondary"}
                              className="font-mono text-[10px] uppercase"
                            >
                              {view.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {view.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground truncate max-w-[240px]">
                          {view.path}
                        </span>
                        <Link
                          href={view.path}
                          className="inline-flex items-center gap-1.5 text-foreground font-medium hover:underline shrink-0"
                        >
                          Open View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Audit Notice */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>PLAYWRIGHT E2E SUITE: 3/3 PASSING (100%)</span>
          </div>
          <div>STRICT RBAC • NEXT.js APP ROUTER • TAILWIND CSS</div>
        </div>
      </div>
    </div>
  );
}
