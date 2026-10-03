"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/products/product-form";
import { getProductById } from "@/lib/services/products";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        <span className="text-xs font-mono">LOADING_PRODUCT_SCHEMA...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="h-10 w-10 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          Product Not Found
        </h2>
        <p className="text-xs text-muted-foreground">
          The requested product ID could not be retrieved from the catalog database.
        </p>
        <Button asChild size="sm" variant="outline" className="gap-2">
          <Link href="/sys-admin-portal/products">
            <ArrowLeft className="h-4 w-4" /> Return to Catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <ProductForm initialData={product} productId={id} />
    </div>
  );
}
