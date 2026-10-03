"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Sparkles, ShieldCheck, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { loginCustomerAction, loginAsDemoAdmin } from "@/app/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/account";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Check if trying demo admin login
      if (email.trim().toLowerCase() === "admin@enterprise.internal" && password === "admin") {
        const res = await loginAsDemoAdmin(email, password);
        if (res.success) {
          toast.success("Authenticated as Super Administrator");
          router.push("/sys-admin-portal");
          router.refresh();
          return;
        }
      }

      // Customer Supabase sign-in
      const res = await loginCustomerAction(email, password);
      if (!res.success) {
        const errorText = res.error || "Invalid login credentials.";
        setErrorMessage(errorText);
        toast.error(errorText);
        setIsLoading(false);
        return;
      }

      toast.success("Signed in successfully. Welcome back!");
      router.push(redirectedFrom);
      router.refresh();
    } catch {
      const errorText = "An unexpected error occurred during login.";
      setErrorMessage(errorText);
      toast.error(errorText);
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = async () => {
    setIsLoading(true);
    try {
      await loginAsDemoAdmin("admin@enterprise.internal", "admin");
      toast.success("Authenticated as Super Administrator");
      router.push("/sys-admin-portal");
      router.refresh();
    } catch {
      toast.error("Failed to authenticate demo session.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 border border-border bg-card p-8 rounded-lg shadow-sm">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-muted-foreground">
          Access your architectural orders, tracking, and customer profile
        </p>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="client@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-[11px] text-muted-foreground hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full font-mono text-xs"
          disabled={isLoading}
          aria-label="Sign In"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Validating Session...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Sign up link */}
      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline hover:opacity-80"
        >
          Create an account
        </Link>
      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-mono">
          <span className="bg-card px-2 text-muted-foreground text-[10px]">Staff & Demo</span>
        </div>
      </div>

      {/* Demo Admin Quick Access */}
      <Button
        type="button"
        variant="outline"
        onClick={handleQuickDemoAccess}
        disabled={isLoading}
        className="w-full font-mono text-xs gap-1.5 border-foreground/30 hover:border-foreground"
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        Instant Demo Admin Access
      </Button>

      <div className="border-t border-border pt-4 text-center">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to Storefront
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <React.Suspense
        fallback={
          <div className="w-full max-w-sm h-96 flex flex-col items-center justify-center gap-2 border border-border bg-card p-8 rounded-lg shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">INITIALIZING_AUTH...</span>
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
