"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import with SSR disabled to satisfy performance constraints and prevent hydration mismatch
export const HeroSceneDynamic = dynamic(
  () => import("@/components/3d/HeroScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] sm:min-h-[380px] lg:min-h-[440px] flex flex-col items-center justify-center text-muted-foreground">
        <div className="relative flex items-center justify-center">
          <div className="h-28 w-28 rounded-full border border-border/60 animate-ping opacity-20" />
          <div className="h-16 w-16 rounded-full border border-border flex items-center justify-center bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          </div>
        </div>
        <span className="font-mono text-[10px] mt-4 tracking-widest text-muted-foreground uppercase">
          INITIALIZING_3D_CANVAS
        </span>
      </div>
    ),
  }
);
