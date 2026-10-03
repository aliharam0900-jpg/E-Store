import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground mb-6">
        <Compass className="h-7 w-7 stroke-[1.5]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-muted text-muted-foreground mb-4">
        STATUS 404 • ROUTE_NOT_FOUND
      </div>

      <h1 className="text-fluid-3xl font-extrabold tracking-tight text-foreground">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        The requested URL path does not exist or has been relocated to another
        partition. Verify the address or return to the main storefront.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="default" asChild>
          <Link href="/">Return to Storefront</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
