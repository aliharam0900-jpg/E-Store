import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://monolith.store"
  ).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/sys-admin-portal/",
        "/api/",
        "/checkout/",
        "/unauthorized",
        "/login",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
