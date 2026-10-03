"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  Settings,
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/sys-admin-portal",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/sys-admin-portal/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/sys-admin-portal/categories",
    icon: Tags,
  },
  {
    title: "Orders",
    href: "/sys-admin-portal/orders",
    icon: ShoppingBag,
  },
  {
    title: "Customers",
    href: "/sys-admin-portal/customers",
    icon: Users,
  },
  {
    title: "Discounts",
    href: "/sys-admin-portal/discounts",
    icon: Tags,
  },
  {
    title: "Marketing",
    href: "/sys-admin-portal/marketing",
    icon: Mail,
  },
  {
    title: "System Views",
    href: "/views",
    icon: Layers,
  },
  {
    title: "Settings",
    href: "/sys-admin-portal/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavClick, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card/60 backdrop-blur-sm border-r border-border",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <Link
          href="/sys-admin-portal"
          className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity"
          onClick={onNavClick}
        >
          <div className="h-7 w-7 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-sm">
            E
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-xs font-bold font-mono tracking-wider">
              SYS_ADMIN
            </span>
            <span className="text-[10px] text-muted-foreground font-mono leading-none">
              CONTROL PLANE
            </span>
          </div>
        </Link>
        <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-mono font-medium text-muted-foreground border border-border">
          PROD
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Platform Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/sys-admin-portal"
              ? pathname === "/sys-admin-portal"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "group flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md transition-all duration-150",
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-background"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {isActive && (
                <ChevronRight className="h-3 w-3 text-background opacity-80" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-border mt-auto space-y-2">
        <div className="rounded-md border border-border bg-muted/40 p-2.5 text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Edge RBAC
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            God-Mode active. Authenticated as Super Admin.
          </p>
        </div>

        <Link
          href="/views"
          className="flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            All Views Directory
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">INDEX</span>
        </Link>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Live Storefront
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">PREVIEW</span>
        </Link>
      </div>
    </div>
  );
}
