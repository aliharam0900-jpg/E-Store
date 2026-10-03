export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "super_admin"
  | "store_manager"
  | "support_agent"
  | "customer";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DiscountType = "percentage" | "fixed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: UserRole;
          is_banned: boolean;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          role?: UserRole;
          is_banned?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          role?: UserRole;
          is_banned?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscribed_at?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: number;
          store_name: string;
          logo_url: string | null;
          hero_headline: string;
          hero_subtext: string;
          footer_text: string;
          primary_color_hex: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          store_name?: string;
          logo_url?: string | null;
          hero_headline?: string;
          hero_subtext?: string;
          footer_text?: string;
          primary_color_hex?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          store_name?: string;
          logo_url?: string | null;
          hero_headline?: string;
          hero_subtext?: string;
          footer_text?: string;
          primary_color_hex?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          base_price: number;
          compare_at_price: number | null;
          category_id: string | null;
          is_published: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          base_price: number;
          compare_at_price?: number | null;
          category_id?: string | null;
          is_published?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          base_price?: number;
          compare_at_price?: number | null;
          category_id?: string | null;
          is_published?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string | null;
          color: string | null;
          inventory_count: number;
          price_adjustment: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          size?: string | null;
          color?: string | null;
          inventory_count?: number;
          price_adjustment?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          size?: string | null;
          color?: string | null;
          inventory_count?: number;
          price_adjustment?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          alt_text?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          total_amount: number;
          tax_amount: number;
          shipping_amount: number;
          status: OrderStatus;
          shipping_address: Json;
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total_amount: number;
          tax_amount?: number;
          shipping_amount?: number;
          status?: OrderStatus;
          shipping_address: Json;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          total_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          status?: OrderStatus;
          shipping_address?: Json;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          quantity: number;
          price_at_time: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          quantity: number;
          price_at_time: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          quantity?: number;
          price_at_time?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          discount_type: DiscountType;
          value: number;
          expires_at: string | null;
          usage_limit: number | null;
          times_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          value: number;
          expires_at?: string | null;
          usage_limit?: number | null;
          times_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: DiscountType;
          value?: number;
          expires_at?: string | null;
          usage_limit?: number | null;
          times_used?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          table_affected: string;
          record_id: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          table_affected: string;
          record_id?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: string;
          table_affected?: string;
          record_id?: string | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      view_admin_analytics: {
        Row: {
          total_revenue: number;
          average_order_value: number;
          total_orders: number;
          active_customers: number;
          low_stock_count: number;
        };
        Relationships: [];
      };
      view_revenue_30_days: {
        Row: {
          date: string;
          label: string;
          revenue: number;
          order_count: number;
        };
        Relationships: [];
      };
      view_top_selling_products: {
        Row: {
          product_id: string;
          product_title: string;
          units_sold: number;
          total_revenue: number;
        };
        Relationships: [];
      };
      view_customer_crm: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          is_banned: boolean;
          stripe_customer_id: string | null;
          created_at: string;
          order_count: number;
          lifetime_value: number;
          last_order_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin_or_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      discount_type: DiscountType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
