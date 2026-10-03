"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log telemetry cleanly without dumping stack trace into customer DOM
    console.error("[TELEMETRY_CRASH_REPORT]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-muted text-muted-foreground mb-4">
        HTTP 500 • RUNTIME_EXCEPTION {error.digest && `• REF: ${error.digest}`}
      </div>

      <h1 className="text-fluid-3xl font-extrabold tracking-tight text-foreground">
        Unexpected Application Error
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        An operational anomaly occurred while rendering this interface. The incident
        has been recorded for engineering diagnostics. Stack traces are masked for security.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to Safety</Link>
        </Button>
      </div>
    </div>
  );
}
