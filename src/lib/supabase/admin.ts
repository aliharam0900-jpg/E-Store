import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Service Role Supabase Client
 * 
 * Bypasses Row Level Security (RLS) for server-side admin operations,
 * background workers, and fulfillment webhooks (e.g. Stripe checkout.session.completed).
 * 
 * WARNING: NEVER import or expose this client on the client-side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Required for admin operations and webhooks."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
