"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { subscribeNewsletterAction } from "@/app/actions/newsletter";
import type { StoreSettings } from "@/types";

interface FooterProps {
  settings?: StoreSettings;
}

export function Footer({ settings }: FooterProps) {
  const pathname = usePathname();
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (pathname.startsWith("/sys-admin-portal")) {
    return null;
  }

  const storeName = settings?.store_name || "ATELIER";
  const footerText =
    settings?.footer_text ||
    `© ${new Date().getFullYear()} ${storeName} INC. ALL RIGHTS RESERVED. ARCHITECTURAL LUXURY FOR THE DISCERNING INDIVIDUAL.`;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await subscribeNewsletterAction(email);
      if (res.success) {
        toast.success(res.message);
        setEmail("");
      } else if (res.alreadySubscribed) {
        toast.info(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to process newsletter subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card/60 text-muted-foreground mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-mono font-bold text-foreground tracking-wider uppercase text-sm">
              {settings?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo_url}
                  alt={storeName}
                  className="h-5 w-auto object-contain max-w-[100px]"
                />
              ) : (
                <span className="h-4 w-4 rounded-sm bg-foreground text-background flex items-center justify-center text-[10px]">
                  {storeName.charAt(0)}
                </span>
              )}
              {storeName}
            </div>
            <p className="text-xs leading-relaxed">
              Engineered high-performance apparel and accessories. Minimalist aesthetics
              grounded in industrial precision.
            </p>
          </div>

          {/* Catalog Navigation */}
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground tracking-wide uppercase text-[11px]">
              Catalog
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=newest" className="hover:text-foreground transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=bestsellers" className="hover:text-foreground transition-colors">
                  Essential Editions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & System */}
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold text-foreground tracking-wide uppercase text-[11px]">
              Platform & Legal
            </h4>
            <ul className="space-y-1.5">
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <Link
                  href="/sys-admin-portal"
                  className="hover:text-foreground transition-colors font-mono flex items-center gap-1"
                >
                  <ShieldCheck className="h-3 w-3" /> Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground tracking-wide uppercase text-[11px]">
              Join our Newsletter
            </h4>
            <p className="text-xs">
              Receive notification of archival drops, technical garment updates, and material studies.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2" aria-label="Join our Newsletter">
              <Input
                type="email"
                placeholder="client@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-8 text-xs bg-background"
                aria-label="Email address for newsletter"
              />
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs shrink-0">
                {isSubmitting ? "Joining..." : "Join"}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4">
          <p>{footerText}</p>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>STRICT_RBAC • SUPABASE_POSTGRESQL</span>
            <span>NEXTJS_APP_ROUTER</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
