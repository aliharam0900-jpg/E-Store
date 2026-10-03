import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryInsert, CategoryUpdate } from "@/types";

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-001",
    name: "Outerwear",
    slug: "outerwear",
    description: "Weather-resistant apparel",
    parent_id: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-002",
    name: "Trousers",
    slug: "trousers",
    description: "Technical pants and trousers",
    parent_id: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

export async function getCategories(): Promise<Category[]> {
  if (isPlaceholderEnv()) {
    return MOCK_CATEGORIES;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[CATEGORIES_SERVICE_ERROR] Supabase categories query error:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error("[CATEGORIES_SERVICE_ERROR] Failed to query categories:", err.message);
    return [];
  }
}

export async function createCategory(
  category: CategoryInsert
): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert([category])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

export async function updateCategory(
  id: string,
  updates: CategoryUpdate
): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}
