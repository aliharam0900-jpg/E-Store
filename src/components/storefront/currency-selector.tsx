"use client";

import * as React from "react";
import { ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import {
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@/lib/utils/format";

export function CurrencySelector({ className }: { className?: string }) {
  const { activeCurrency, setCurrency } = useCartStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentCurrency = mounted ? activeCurrency : "USD";
  const activeMeta =
    SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency) ||
    SUPPORTED_CURRENCIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid="currency-selector"
          aria-label={`Select currency, currently ${activeMeta.code}`}
          suppressHydrationWarning
          className={`h-8 px-2.5 text-xs font-mono font-medium gap-1 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors ${
            className ?? ""
          }`}
        >
          <Globe className="h-3.5 w-3.5 opacity-70" />
          <span suppressHydrationWarning>{activeMeta.code}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 font-mono text-xs p-1">
        {SUPPORTED_CURRENCIES.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setCurrency(item.code as CurrencyCode)}
            className={`flex items-center justify-between cursor-pointer py-1.5 px-2.5 rounded-sm ${
              activeCurrency === item.code
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{item.code}</span>
            <span className="opacity-70 text-[11px]">{item.symbol}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
