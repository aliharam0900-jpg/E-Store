"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  Shield,
  Layers,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";
import { CartSheet } from "./cart-sheet";
import { CurrencySelector } from "./currency-selector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import type { StoreSettings } from "@/types";

interface NavbarProps {
  settings?: StoreSettings;
}

export function Navbar({ settings }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { getTotalItems, toggleCart } = useCartStore();
  const totalItems = mounted ? getTotalItems() : 0;

  const storeName = settings?.store_name || "ATELIER";

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Do not render storefront navbar when inside admin portal
  if (pathname.startsWith("/sys-admin-portal")) {
    return null;
  }

  const navLinks = [
    { name: "Catalog", href: "/shop" },
    { name: "New Arrivals", href: "/shop?sort=newest" },
    { name: "Best Sellers", href: "/shop?sort=bestsellers" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
          isScrolled
            ? "bg-background/85 backdrop-blur-md border-b border-border py-3 shadow-xs"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Mobile Menu & Desktop Navigation */}
          <div className="flex items-center gap-6">
            {/* Mobile Menu Sheet */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center"
                    title="Open menu"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="font-bold tracking-tight text-base font-mono uppercase">
                      {`${storeName} // STORE`}
                    </div>
                    <nav className="flex flex-col space-y-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="min-h-[44px] flex items-center px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.name}
                        </Link>
                      ))}

                      {/* Mobile Cart Trigger in Sheet */}
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          toggleCart();
                        }}
                        suppressHydrationWarning
                        className="min-h-[44px] flex items-center justify-between w-full px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
                        aria-label="Shopping Cart"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          <span>Shopping Cart</span>
                        </div>
                        {mounted && totalItems > 0 && (
                          <span
                            suppressHydrationWarning
                            className="h-5 min-w-[20px] px-1.5 rounded-full bg-foreground text-background text-xs font-mono font-bold flex items-center justify-center"
                          >
                            {totalItems}
                          </span>
                        )}
                      </button>
                    </nav>
                    <div className="pt-2 border-t border-border">
                      <span className="text-[10px] font-mono text-muted-foreground block mb-1.5 uppercase">
                        Currency
                      </span>
                      <CurrencySelector />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-1">
                    <Link
                      href="/sys-admin-portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground px-1"
                    >
                      <Shield className="h-3.5 w-3.5" /> Staff Console
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity min-h-[44px]"
            >
              {settings?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo_url}
                  alt={storeName}
                  className="h-6 w-auto object-contain max-w-[120px]"
                />
              ) : (
                <div className="h-6 w-6 rounded bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs">
                  {storeName.charAt(0)}
                </div>
              )}
              <span className="font-mono text-sm tracking-wider uppercase font-bold">
                {storeName}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "hover:text-foreground transition-colors py-2",
                    pathname === link.href && "text-foreground font-semibold"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Action Controls: Currency Selector, Search, Theme Toggle, Account & Cart */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Currency Dropdown */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle className="min-h-[44px] min-w-[44px] flex items-center justify-center" />

            <Link
              href="/account"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
              title="Customer Account"
              aria-label="Customer Account"
            >
              <User className="h-4 w-4" />
            </Link>

            <Link
              href="/shop"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
              title="Search Catalog"
              aria-label="Search Catalog"
            >
              <Search className="h-4 w-4" />
            </Link>

            {/* Cart Trigger with Dynamic Badge */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCart}
              suppressHydrationWarning
              className="relative gap-2 min-h-[44px] px-3.5 text-xs flex items-center"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {mounted && totalItems > 0 && (
                <span
                  suppressHydrationWarning
                  className="h-4 min-w-[16px] px-1 rounded-full bg-foreground text-background text-[10px] font-mono font-bold flex items-center justify-center"
                >
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Global Slide-Over Cart Drawer */}
      <CartSheet />
    </>
  );
}
