"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  X,
  Search,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/storefront/product-card";
import { getProducts } from "@/lib/services/products";
import { getCategories } from "@/lib/services/categories";
import type { ProductWithDetails } from "@/types";

export function ShopCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL search params
  const currentCategory = searchParams.get("category") || "all";
  const currentColor = searchParams.get("color") || "all";
  const currentSort = searchParams.get("sort") || "featured";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSearch = searchParams.get("q") || "";

  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(currentSearch);

  // Update URL search parameters
  const updateFilter = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Sync search input with URL after typing debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateFilter("q", searchInput || null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateFilter]);

  // Fetch published products & categories
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["published_products"],
    queryFn: () => getProducts({ status: "published" }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Extract distinct colors from product variants
  const availableColors = React.useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.color) colorSet.add(v.color);
      });
    });
    return Array.from(colorSet);
  }, [products]);

  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
    setSearchInput("");
  };

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (currentSearch) {
          const matchTitle = product.title.toLowerCase().includes(currentSearch.toLowerCase());
          const matchSku = (product.variants || []).some((v) =>
            v.sku.toLowerCase().includes(currentSearch.toLowerCase())
          );
          if (!matchTitle && !matchSku) return false;
        }

        // Category filter
        if (currentCategory !== "all") {
          if (product.category?.slug !== currentCategory) return false;
        }

        // Color filter
        if (currentColor !== "all") {
          const hasColor = (product.variants || []).some(
            (v) => v.color?.toLowerCase() === currentColor.toLowerCase()
          );
          if (!hasColor) return false;
        }

        // Price range filter
        if (currentMinPrice && product.base_price < parseFloat(currentMinPrice)) {
          return false;
        }
        if (currentMaxPrice && product.base_price > parseFloat(currentMaxPrice)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentSort === "price-asc") return a.base_price - b.base_price;
        if (currentSort === "price-desc") return b.base_price - a.base_price;
        if (currentSort === "newest")
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0; // default featured
      });
  }, [
    products,
    currentSearch,
    currentCategory,
    currentColor,
    currentMinPrice,
    currentMaxPrice,
    currentSort,
  ]);

  const activeFilterCount =
    (currentCategory !== "all" ? 1 : 0) +
    (currentColor !== "all" ? 1 : 0) +
    (currentMinPrice || currentMaxPrice ? 1 : 0) +
    (currentSearch ? 1 : 0);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-1">
            Archival Catalog
          </span>
          <h1 className="text-fluid-3xl font-extrabold tracking-tight text-foreground">
            Complete Collection
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
            Filter through technical apparel, accessories, and precision artifacts with
            zero-reload faceted parameters.
          </p>
        </div>

        {/* Top Controls: Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pieces..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-10 sm:h-9 text-xs min-h-[44px] sm:min-h-[36px]"
            />
          </div>

          <Select
            value={currentSort}
            onValueChange={(val) => updateFilter("sort", val)}
          >
            <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9 text-xs min-h-[44px] sm:min-h-[36px]">
              <SelectValue placeholder="Sort Catalog" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured Editions</SelectItem>
              <SelectItem value="newest">Newest Releases</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden gap-1.5 text-xs min-h-[44px] flex items-center"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 pt-8 items-start">
        {/* Sidebar Filters (Desktop & Mobile Dropdown) */}
        <aside
          className={`w-full md:w-56 lg:w-64 shrink-0 space-y-6 ${
            mobileFilterOpen ? "block" : "hidden md:block"
          }`}
        >
          {/* Active Filter Clear Header */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-mono font-medium text-foreground">
                Active Filters ({activeFilterCount})
              </span>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer min-h-[44px] flex items-center"
              >
                Reset All
              </button>
            </div>
          )}

          {/* 1. Category Facet */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              Categories
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => updateFilter("category", "all")}
                className={`w-full text-left px-2.5 py-2 min-h-[44px] rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  currentCategory === "all"
                    ? "font-semibold text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span>All Categories</span>
                {currentCategory === "all" && <Check className="h-3 w-3" />}
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilter("category", cat.slug)}
                  className={`w-full text-left px-2.5 py-2 min-h-[44px] rounded text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    currentCategory === cat.slug
                      ? "font-semibold text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <span>{cat.name}</span>
                  {currentCategory === cat.slug && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color Facet */}
          {availableColors.length > 0 && (
            <div className="space-y-2.5 border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                Color Palette
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => updateFilter("color", "all")}
                  className={`px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-xs font-mono border transition-all cursor-pointer ${
                    currentColor === "all"
                      ? "bg-foreground text-background border-foreground font-bold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateFilter("color", color)}
                    className={`px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-xs font-mono border transition-all cursor-pointer ${
                      currentColor.toLowerCase() === color.toLowerCase()
                        ? "bg-foreground text-background border-foreground font-bold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Price Brackets */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
              Price Range ($)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min ($)"
                value={currentMinPrice}
                onChange={(e) => updateFilter("minPrice", e.target.value)}
                className="h-10 sm:h-8 text-xs font-mono min-h-[44px] sm:min-h-[36px]"
              />
              <Input
                type="number"
                placeholder="Max ($)"
                value={currentMaxPrice}
                onChange={(e) => updateFilter("maxPrice", e.target.value)}
                className="h-10 sm:h-8 text-xs font-mono min-h-[44px] sm:min-h-[36px]"
              />
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1 min-w-0 w-full">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              <span className="font-mono text-xs">SYNCHRONIZING_CATALOG...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6 border border-border rounded-lg bg-card/40 space-y-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                No matching pieces found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Try loosening your filter parameters or search queries to view available inventory.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs mt-2 min-h-[44px]"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-4">
                SHOWING {filteredProducts.length} ARTIFACTS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
