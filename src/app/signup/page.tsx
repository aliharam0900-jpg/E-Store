"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { signupCustomerAction } from "@/app/actions/auth";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signupCustomerAction(email, password, fullName);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account.");
        toast.error(res.error || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully! Welcome to Monolith.");
      router.push("/account");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred while creating your account.");
      toast.error("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-sm space-y-6 border border-border bg-card p-8 rounded-lg shadow-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background">
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create an Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Join Monolith to manage architectural purchases and track shipments
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
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              type="text"
              placeholder="Elena Rostova"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
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
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            <p className="text-[10px] text-muted-foreground">Minimum 6 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password *</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full font-mono text-xs"
            disabled={isLoading}
            aria-label="Create Account"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Registering Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline hover:opacity-80"
          >
            Sign in
          </Link>
        </div>

        <div className="border-t border-border pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
