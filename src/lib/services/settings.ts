import { createClient } from "@/lib/supabase/client";
import type { StoreSettings, StoreSettingsUpdate } from "@/types";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "MONOLITH",
  logo_url: null,
  hero_headline: "ENGINEERED ARTIFACTS & FORM",
  hero_subtext:
    "Industrial precision meets utilitarian apparel. Constructed with aerospace titanium, bonded weather-membranes, and zero aesthetic compromise.",
  footer_text:
    "© 2026 MONOLITH ENTERPRISES INC. ALL RIGHTS RESERVED. ARCHITECTURAL LUXURY FOR THE DISCERNING INDIVIDUAL.",
  primary_color_hex: "#000000",
};

// In-memory runtime state for offline/demo/mock environments
let memorySettings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };

function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("placeholder");
}

/**
 * Retrieve global store settings from Supabase, with automatic fallback
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isPlaceholderEnv()) {
    return { ...memorySettings };
  }

  try {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("store_settings" as any) as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return { ...memorySettings };
    }

    const resolved: StoreSettings = {
      id: Number(data.id) || 1,
      store_name: data.store_name || memorySettings.store_name,
      logo_url: data.logo_url ?? memorySettings.logo_url,
      hero_headline: data.hero_headline || memorySettings.hero_headline,
      hero_subtext: data.hero_subtext || memorySettings.hero_subtext,
      footer_text: data.footer_text || memorySettings.footer_text,
      primary_color_hex: data.primary_color_hex || memorySettings.primary_color_hex,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    // Keep memory copy in sync
    memorySettings = { ...resolved };
    return resolved;
  } catch {
    return { ...memorySettings };
  }
}

/**
 * Update global store settings
 */
export async function updateStoreSettings(
  updates: StoreSettingsUpdate
): Promise<StoreSettings> {
  if (isPlaceholderEnv()) {
    memorySettings = {
      ...memorySettings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...memorySettings };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .upsert({
      id: 1,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[SETTINGS_SERVICE_ERROR] Supabase update failed:", error.message);
    throw new Error(`Failed to update store settings: ${error.message}`);
  }

  const resolved: StoreSettings = {
    id: 1,
    store_name: data.store_name,
    logo_url: data.logo_url,
    hero_headline: data.hero_headline,
    hero_subtext: data.hero_subtext,
    footer_text: data.footer_text,
    primary_color_hex: data.primary_color_hex,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  memorySettings = { ...resolved };
  return resolved;
}

/**
 * Upload store brand logo to Supabase Storage (bucket: product_images)
 */
export async function uploadStoreLogo(file: File): Promise<string> {
  if (isPlaceholderEnv()) {
    // Generate object URL or data preview in mock mode
    return URL.createObjectURL(file);
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `brand/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product_images")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("[LOGO_UPLOAD_ERROR] Failed to upload logo:", uploadError.message);
    throw new Error(`Failed to upload logo: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("product_images").getPublicUrl(fileName);
  return data.publicUrl;
}
