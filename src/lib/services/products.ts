import { createClient } from "@/lib/supabase/client";
import type {
  Product,
  ProductWithDetails,
  ProductVariant,
  ProductImage,
} from "@/types";

export interface CreateProductInput {
  title: string;
  slug: string;
  description?: string | null;
  base_price: number;
  compare_at_price?: number | null;
  category_id?: string | null;
  is_published?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  variants: {
    sku: string;
    size?: string | null;
    color?: string | null;
    inventory_count: number;
    price_adjustment: number;
  }[];
  images: {
    image_url: string;
    alt_text?: string | null;
    display_order: number;
  }[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

const MOCK_PRODUCTS: ProductWithDetails[] = [
  {
    id: "prod-001",
    title: "Monolith Technical Modular Shell Jacket",
    slug: "modular-shell-jacket",
    description: "Multi-climate technical outerwear engineered with waterproof GORE-TEX membrane, bonded seam architecture, and ergonomic articulation.",
    base_price: 340,
    compare_at_price: 395,
    category_id: "cat-001",
    is_published: true,
    seo_title: "Modular Shell Jacket | Technical Apparel",
    seo_description: "Precision engineered technical jacket by Monolith.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    category: {
      id: "cat-001",
      name: "Outerwear",
      slug: "outerwear",
      description: "Weather-resistant apparel",
      parent_id: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    variants: [
      {
        id: "var-001",
        product_id: "prod-001",
        sku: "MSJ-BLK-S",
        size: "S",
        color: "Obsidian",
        inventory_count: 24,
        price_adjustment: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "var-002",
        product_id: "prod-001",
        sku: "MSJ-BLK-M",
        size: "M",
        color: "Obsidian",
        inventory_count: 18,
        price_adjustment: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "var-003",
        product_id: "prod-001",
        sku: "MSJ-BLK-L",
        size: "L",
        color: "Obsidian",
        inventory_count: 15,
        price_adjustment: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    images: [
      {
        id: "img-001",
        product_id: "prod-001",
        image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000",
        alt_text: "Monolith Shell Jacket",
        display_order: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "prod-002",
    title: "Articulated Cargo Trousers",
    slug: "articulated-cargo-trousers",
    description: "Reinforced ripstop trousers featuring magnetic Fidlock tensioners, water-repellent DWR coating, and laser-cut modular pocket compartments.",
    base_price: 220,
    compare_at_price: null,
    category_id: "cat-002",
    is_published: true,
    seo_title: "Articulated Cargo Trousers | Techwear Pants",
    seo_description: "Durable tactical cargo trousers.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    category: {
      id: "cat-002",
      name: "Trousers",
      slug: "trousers",
      description: "Technical pants and trousers",
      parent_id: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    variants: [
      {
        id: "var-004",
        product_id: "prod-002",
        sku: "ACT-BLK-M",
        size: "M",
        color: "Charcoal",
        inventory_count: 30,
        price_adjustment: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    images: [
      {
        id: "img-002",
        product_id: "prod-002",
        image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000",
        alt_text: "Articulated Cargo Trousers",
        display_order: 0,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
  },
];

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

function filterMockProducts(options?: {
  search?: string;
  status?: "all" | "published" | "draft";
  categoryId?: string;
}): ProductWithDetails[] {
  let list = [...MOCK_PRODUCTS];
  if (options?.status === "published") {
    list = list.filter((p) => p.is_published);
  } else if (options?.status === "draft") {
    list = list.filter((p) => !p.is_published);
  }
  if (options?.categoryId) {
    list = list.filter((p) => p.category_id === options.categoryId);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getProducts(options?: {
  search?: string;
  status?: "all" | "published" | "draft";
  categoryId?: string;
}): Promise<ProductWithDetails[]> {
  if (isPlaceholderEnv()) {
    return filterMockProducts(options);
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .order("created_at", { ascending: false });

    if (options?.search) {
      query = query.ilike("title", `%${options.search}%`);
    }

    if (options?.status === "published") {
      query = query.eq("is_published", true);
    } else if (options?.status === "draft") {
      query = query.eq("is_published", false);
    }

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[PRODUCTS_SERVICE_ERROR] Supabase products query error:", error.message);
      return [];
    }

    return (data as unknown as ProductWithDetails[]) || [];
  } catch (err: any) {
    console.error("[PRODUCTS_SERVICE_ERROR] Failed to query products from Supabase:", err?.message);
    return [];
  }
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  if (isPlaceholderEnv()) {
    return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        console.error("[PRODUCT_BY_ID_ERROR]", error.message);
      }
      return null;
    }

    return data as unknown as ProductWithDetails;
  } catch (err: any) {
    console.error("[PRODUCT_BY_ID_ERROR]", err?.message);
    return null;
  }
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  if (isPlaceholderEnv()) {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq("slug", slug)
      .single();

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        console.error("[PRODUCT_BY_SLUG_ERROR]", error.message);
      }
      return null;
    }

    return data as unknown as ProductWithDetails;
  } catch (err: any) {
    console.error("[PRODUCT_BY_SLUG_ERROR]", err?.message);
    return null;
  }
}

export async function createProduct(
  input: CreateProductInput
): Promise<ProductWithDetails> {
  const supabase = createClient();

  // 1. Insert product record
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([
      {
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        base_price: input.base_price,
        compare_at_price: input.compare_at_price || null,
        category_id: input.category_id || null,
        is_published: input.is_published ?? false,
        seo_title: input.seo_title || null,
        seo_description: input.seo_description || null,
      },
    ])
    .select()
    .single();

  if (productError || !product) {
    throw new Error(`Failed to create product: ${productError?.message}`);
  }

  // 2. Insert variants if provided
  if (input.variants && input.variants.length > 0) {
    const variantsToInsert = input.variants.map((v) => ({
      product_id: product.id,
      sku: v.sku,
      size: v.size || null,
      color: v.color || null,
      inventory_count: v.inventory_count,
      price_adjustment: v.price_adjustment,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantsToInsert);

    if (variantError) {
      throw new Error(`Failed to insert variants: ${variantError.message}`);
    }
  }

  // 3. Insert images if provided
  if (input.images && input.images.length > 0) {
    const imagesToInsert = input.images.map((img, idx) => ({
      product_id: product.id,
      image_url: img.image_url,
      alt_text: img.alt_text || null,
      display_order: img.display_order ?? idx,
    }));

    const { error: imageError } = await supabase
      .from("product_images")
      .insert(imagesToInsert);

    if (imageError) {
      throw new Error(`Failed to insert images: ${imageError.message}`);
    }
  }

  return (await getProductById(product.id))!;
}

export async function updateProduct(
  id: string,
  input: Partial<CreateProductInput>
): Promise<ProductWithDetails> {
  const supabase = createClient();

  // 1. Update product base data
  const updatePayload: Partial<Product> = {};
  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.slug !== undefined) updatePayload.slug = input.slug;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.base_price !== undefined) updatePayload.base_price = input.base_price;
  if (input.compare_at_price !== undefined)
    updatePayload.compare_at_price = input.compare_at_price;
  if (input.category_id !== undefined) updatePayload.category_id = input.category_id;
  if (input.is_published !== undefined) updatePayload.is_published = input.is_published;
  if (input.seo_title !== undefined) updatePayload.seo_title = input.seo_title;
  if (input.seo_description !== undefined)
    updatePayload.seo_description = input.seo_description;

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }
  }

  // 2. Sync variants if provided
  if (input.variants !== undefined) {
    // Delete existing variants and re-insert new set
    await supabase.from("product_variants").delete().eq("product_id", id);

    if (input.variants.length > 0) {
      const variantsToInsert = input.variants.map((v) => ({
        product_id: id,
        sku: v.sku,
        size: v.size || null,
        color: v.color || null,
        inventory_count: v.inventory_count,
        price_adjustment: v.price_adjustment,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert);

      if (variantError) {
        throw new Error(`Failed to update variants: ${variantError.message}`);
      }
    }
  }

  // 3. Sync images if provided
  if (input.images !== undefined) {
    await supabase.from("product_images").delete().eq("product_id", id);

    if (input.images.length > 0) {
      const imagesToInsert = input.images.map((img, idx) => ({
        product_id: id,
        image_url: img.image_url,
        alt_text: img.alt_text || null,
        display_order: img.display_order ?? idx,
      }));

      const { error: imageError } = await supabase
        .from("product_images")
        .insert(imagesToInsert);

      if (imageError) {
        throw new Error(`Failed to update images: ${imageError.message}`);
      }
    }
  }

  return (await getProductById(id))!;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function toggleProductPublish(
  id: string,
  currentStatus: boolean
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to toggle publish status: ${error.message}`);
  }

  return !currentStatus;
}
