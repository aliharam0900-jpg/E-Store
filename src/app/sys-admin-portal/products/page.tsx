"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProducts,
  deleteProduct,
  toggleProductPublish,
} from "@/lib/services/products";
import { formatPrice } from "@/lib/utils/format";
import type { ProductWithDetails } from "@/types";

export default function ProductsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", { search, status: statusFilter }],
    queryFn: () => getProducts({ search, status: statusFilter }),
  });

  // Toggle publish mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: boolean }) =>
      toggleProductPublish(id, currentStatus),
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        newStatus ? "Product published to catalog" : "Product reverted to draft"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update visibility");
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product");
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" /> Product Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage inventory items, SKUs, pricing, and distribution visibility
          </p>
        </div>

        <Button asChild size="sm" className="gap-2 self-start sm:self-auto">
          <Link href="/sys-admin-portal/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: "all" | "published" | "draft") =>
              setStatusFilter(val)
            }
          >
            <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <span className="text-xs font-mono">LOADING_CATALOG_RECORDS...</span>
          </div>
        ) : error ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-destructive p-4 text-center">
            <p className="text-sm font-semibold">Failed to load product catalog</p>
            <p className="text-xs font-mono text-muted-foreground">{(error as any).message}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No products found</p>
              <p className="text-xs text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try clearing filters to display items."
                  : "Begin catalog setup by adding your first product record."}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs mt-2">
              <Link href="/sys-admin-portal/products/new">Create Product</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">Media</TableHead>
                <TableHead>Title & Taxonomy</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Stock / Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const totalStock = (product.variants || []).reduce(
                  (sum, v) => sum + (v.inventory_count || 0),
                  0
                );
                const primaryImage = product.images?.[0]?.image_url;

                return (
                  <TableRow key={product.id}>
                    {/* Thumbnail */}
                    <TableCell>
                      <div className="h-10 w-10 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                        {primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImage}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground opacity-40" />
                        )}
                      </div>
                    </TableCell>

                    {/* Title & Slug */}
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/sys-admin-portal/products/${product.id}/edit`}
                          className="font-medium text-xs text-foreground hover:underline"
                        >
                          {product.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            /{product.slug}
                          </span>
                          {product.category && (
                            <span className="inline-block text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border">
                              {product.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <div className="flex flex-col font-mono text-xs">
                        <span className="font-semibold text-foreground">
                          {formatPrice(product.base_price)}
                        </span>
                        {product.compare_at_price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Stock & Variants */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className={`font-mono text-xs font-medium ${
                            totalStock === 0
                              ? "text-destructive"
                              : totalStock < 5
                              ? "text-amber-500"
                              : "text-foreground"
                          }`}
                        >
                          {totalStock} units
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {product.variants?.length || 0} variant(s)
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {product.is_published ? (
                        <Badge variant="success">PUBLISHED</Badge>
                      ) : (
                        <Badge variant="neutral">DRAFT</Badge>
                      )}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/sys-admin-portal/products/${product.id}/edit`}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit Details
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: product.id,
                                currentStatus: product.is_published,
                              })
                            }
                            className="flex items-center gap-2"
                          >
                            {product.is_published ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" /> Publish
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete "${product.title}"? This will delete all variants and images.`
                                )
                              ) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
