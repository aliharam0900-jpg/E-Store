import * as React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { getProductBySlug } from "@/lib/services/products";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | MONOLITH",
      description: "The requested apparel artifact could not be located.",
    };
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://monolith.store"
  ).replace(/\/$/, "");

  const title = `${product.seo_title || product.title} | MONOLITH`;
  const description =
    product.seo_description ||
    product.description?.slice(0, 160) ||
    "Technical precision garment engineered for durability and extreme performance.";

  const primaryImage = product.images?.[0]?.image_url || `${baseUrl}/og-default.jpg`;
  const productUrl = `${baseUrl}/product/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: "MONOLITH // Technical Apparel",
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
      creator: "@monolith_apparel",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="pt-16 pb-20">
      <ProductDetailView product={product} />
    </div>
  );
}
