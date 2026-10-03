"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, ShieldAlert, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";

export function AdminHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Drawer Trigger */}
      <div className="flex items-center gap-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px] h-11 w-11">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AdminSidebar onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-mono text-xs font-bold tracking-wider">
          SYS_ADMIN
        </span>
      </div>

      {/* Desktop Search / Quick Status */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-foreground" />
          STEALTH_CMS // PHASE_3_ACTIVE
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-[10px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          SESSION_VALIDATED
        </div>

        <Button variant="outline" size="sm" asChild className="min-h-[44px] px-3.5 text-xs font-mono">
          <Link href="/">Exit Portal</Link>
        </Button>
      </div>
    </header>
  );
}
