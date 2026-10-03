"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { RootProvider } from "@/components/providers/root-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

interface GlobalLayoutWrapperProps {
  children: React.ReactNode;
}

export function GlobalLayoutWrapper({ children }: GlobalLayoutWrapperProps) {
  const pathname = usePathname();

  return (
    <RootProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background flex flex-col">
          <React.Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex-1 w-full"
              >
                {children}
              </motion.main>
            </AnimatePresence>
          </React.Suspense>
          <Toaster position="top-right" richColors />
        </div>
      </ThemeProvider>
    </RootProvider>
  );
}
