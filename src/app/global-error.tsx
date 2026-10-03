"use client";

import * as React from "react";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Critical root layout exception telemetry
    console.error("[CRITICAL_ROOT_LAYOUT_EXCEPTION]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col items-center justify-center bg-[#09090B] text-[#FAFAFA] p-4 text-center antialiased">
        <div className="max-w-md w-full border border-[#27272A] p-8 rounded-lg bg-[#18181B] space-y-6">
          <div className="inline-block px-3 py-1 text-xs font-mono font-medium rounded-full bg-red-950/60 border border-red-800 text-red-300">
            SYSTEM CRITICAL FAULT
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Root Layout Interruption
          </h1>

          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            The root shell experienced an unrecoverable rendering halt. Diagnostics
            have been captured. Raw stack traces are restricted.
          </p>

          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-md bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Re-initialize Application
          </button>
        </div>
      </body>
    </html>
  );
}
