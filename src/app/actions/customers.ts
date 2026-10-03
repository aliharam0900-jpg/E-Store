"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ToggleBanResult {
  success: boolean;
  is_banned?: boolean;
  error?: string;
}

/**
 * Server Action to suspend or reinstate a user account
 * Enforces is_banned in public.users and synchronizes auth metadata for Edge Middleware.
 */
export async function toggleCustomerBanAction(
  targetUserId: string,
  newBannedState: boolean
): Promise<ToggleBanResult> {
  try {
    // Verify caller is an authorized admin
    const authClient = await createClient();
    const {
      data: { user: caller },
    } = await authClient.auth.getUser();

    if (!caller) {
      return { success: false, error: "Unauthorized. Authentication required." };
    }

    const callerRole =
      caller.app_metadata?.role || caller.user_metadata?.role;
    if (callerRole !== "super_admin" && callerRole !== "store_manager") {
      return {
        success: false,
        error: "Forbidden. Administrative role required to suspend identities.",
      };
    }

    if (caller.id === targetUserId) {
      return {
        success: false,
        error: "Administrative self-suspension is strictly prohibited.",
      };
    }

    const supabaseAdmin = createAdminClient();

    // 1. Update public.users database record
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update({ is_banned: newBannedState })
      .eq("id", targetUserId);

    if (dbError) {
      throw new Error(`Failed to update database profile: ${dbError.message}`);
    }

    // 2. Synchronize Supabase Auth user metadata for immediate edge middleware enforcement
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        app_metadata: { is_banned: newBannedState },
        user_metadata: { is_banned: newBannedState },
      });
    } catch (authErr: any) {
      console.warn("[CRM_AUTH_METADATA_SYNC_WARN]", authErr);
    }

    // 3. Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: caller.id,
      action: newBannedState ? "CUSTOMER_SUSPENDED" : "CUSTOMER_REINSTATED",
      table_affected: "users",
      record_id: targetUserId,
    });

    return {
      success: true,
      is_banned: newBannedState,
    };
  } catch (err: any) {
    console.error("[TOGGLE_CUSTOMER_BAN_ERROR]", err);
    return {
      success: false,
      error: err.message || "Failed to update account suspension status.",
    };
  }
}
