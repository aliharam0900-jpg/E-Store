import Link from "next/link";
import { ShieldAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnauthorizedPageProps {
  searchParams: Promise<{ banned?: string }>;
}

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const params = await searchParams;
  const isBanned = params.banned === "true";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        {isBanned ? (
          <UserX className="h-7 w-7" />
        ) : (
          <ShieldAlert className="h-7 w-7" />
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-destructive/30 bg-destructive/5 text-destructive mb-4">
        {isBanned ? "HTTP 403 • IDENTITY SUSPENDED" : "HTTP 403 • FORBIDDEN"}
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
        {isBanned ? "Account Suspended" : "Access Denied"}
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        {isBanned
          ? "Your account has been placed under administrative suspension. Access to the storefront and payment services is restricted. Please contact concierge support if you believe this is in error."
          : "Strict Role-Based Access Control (RBAC) is active. Your authenticated account lacks the elevated privileges required to access the requested system control surface."}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="default" asChild>
          <Link href="/">Return to Storefront</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Switch Identity</Link>
        </Button>
      </div>
    </div>
  );
}
