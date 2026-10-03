"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateStoreSettings, getStoreSettings } from "@/lib/services/settings";
import type { StoreSettings, StoreSettingsUpdate } from "@/types";

export interface SettingsActionResult {
  success: boolean;
  settings?: StoreSettings;
  error?: string;
}

export async function fetchSettingsAction(): Promise<StoreSettings> {
  return await getStoreSettings();
}

export async function updateSettingsAction(
  updates: StoreSettingsUpdate
): Promise<SettingsActionResult> {
  try {
    if (
      updates.primary_color_hex &&
      !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(updates.primary_color_hex)
    ) {
      return {
        success: false,
        error: "Primary color must be a valid hex code (e.g. #000000 or #111).",
      };
    }

    // Wrap the Supabase update() call in a strict try/catch block
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: _data, error } = await (supabase.from("store_settings" as any) as any)
        .upsert({
          id: 1,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("SUPABASE UPDATE ERROR:", error);
        return {
          success: false,
          error: error.message || "Permission Denied",
        };
      }
    } catch (error) {
      console.error("SUPABASE UPDATE ERROR:", error);
      const isPlaceholder =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (!isPlaceholder) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Permission Denied",
        };
      }
    }

    const updated = await updateStoreSettings(updates);

    // Revalidate storefront and admin settings to purge router cache
    revalidatePath("/", "layout");
    revalidatePath("/sys-admin-portal/settings");

    return {
      success: true,
      settings: updated,
    };
  } catch (error) {
    console.error("SUPABASE UPDATE ERROR:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update store settings.",
    };
  }
}
