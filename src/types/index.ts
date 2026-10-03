/**
 * Global TypeScript Interfaces & Domain Models
 * Enterprise E-Commerce Platform
 */

import type { Database } from "./supabase";

export * from "./supabase";

// Domain Models derived from Database schema
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductVariantInsert = Database["public"]["Tables"]["product_variants"]["Insert"];
export type ProductVariantUpdate = Database["public"]["Tables"]["product_variants"]["Update"];

export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductImageInsert = Database["public"]["Tables"]["product_images"]["Insert"];
export type ProductImageUpdate = Database["public"]["Tables"]["product_images"]["Update"];

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemUpdate = Database["public"]["Tables"]["order_items"]["Update"];

export type Discount = Database["public"]["Tables"]["discounts"]["Row"];
export type DiscountInsert = Database["public"]["Tables"]["discounts"]["Insert"];
export type DiscountUpdate = Database["public"]["Tables"]["discounts"]["Update"];

export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export type NewsletterSubscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
export type NewsletterSubscriberInsert = Database["public"]["Tables"]["newsletter_subscribers"]["Insert"];

// Composite Product with variants and images
export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  category: Category | null;
}

// Composite Order with items and user
export interface OrderWithDetails extends Order {
  order_items: (OrderItem & {
    variant: (ProductVariant & { product: Product }) | null;
  })[];
  user: User | null;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export type CustomerCrmRecord = Database["public"]["Views"]["view_customer_crm"]["Row"];
export type AdminAnalyticsSummary = Database["public"]["Views"]["view_admin_analytics"]["Row"];
export type Revenue30DaysRecord = Database["public"]["Views"]["view_revenue_30_days"]["Row"];
export type TopSellingProductRecord = Database["public"]["Views"]["view_top_selling_products"]["Row"];

export interface StoreSettings {
  id: number;
  store_name: string;
  logo_url: string | null;
  hero_headline: string;
  hero_subtext: string;
  footer_text: string;
  primary_color_hex: string;
  created_at?: string;
  updated_at?: string;
}

export type StoreSettingsUpdate = Partial<Omit<StoreSettings, "id" | "created_at" | "updated_at">>;

