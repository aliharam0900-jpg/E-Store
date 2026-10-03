"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log telemetry cleanly for monitoring without customer exposure
    console.error("[UI_COMPONENT_CRASH]", {
      component: this.props.componentName || "AnonymousComponent",
      message: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-6 my-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Component Rendering Fault
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            A non-fatal error interrupted this module. Stack details are suppressed.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Recover Component
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
