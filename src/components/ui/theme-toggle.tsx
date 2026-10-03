"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const isCurrentlyDark = (resolvedTheme || theme) === "dark";
    const targetTheme = isCurrentlyDark ? "light" : "dark";
    setTheme(targetTheme);
  };

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      suppressHydrationWarning
      data-testid="theme-toggle"
      data-hydrated={mounted ? "true" : "false"}
      aria-label="Toggle theme"
      title={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className={`h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors ${className || ""}`}
    >
      {!mounted ? (
        <span className="h-4 w-4 block" />
      ) : isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
