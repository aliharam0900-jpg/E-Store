import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://monolith.store"
  ).replace(/\/$/, "");

  const supabase = createClient();

  // 1. Static Core Landing Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // 2. Dynamic Published Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_published", true);

    if (products && products.length > 0) {
      productRoutes = products.map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("[SITEMAP_PRODUCTS_ERROR]", err);
  }

  // 3. Dynamic Categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at");

    if (categories && categories.length > 0) {
      categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/shop?category=${category.slug}`,
        lastModified: new Date(category.created_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("[SITEMAP_CATEGORIES_ERROR]", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
