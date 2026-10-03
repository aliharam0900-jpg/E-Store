"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Customer sign in with standard email and password via Supabase Auth
 */
export async function loginCustomerAction(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      success: false,
      error: "Please provide both an email address and password.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || "Invalid email or password credentials.",
      };
    }

    return {
      success: true,
      redirectTo: "/account",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during authentication.",
    };
  }
}

/**
 * Customer sign up with email and password via Supabase Auth
 */
export async function signupCustomerAction(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthActionResult> {
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      success: false,
      error: "Please provide both an email address and password.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Automatically sign in if session is established or return success
    return {
      success: true,
      redirectTo: "/account",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during account creation.",
    };
  }
}

/**
 * Customer sign out clearing Supabase Auth session
 */
export async function signOutCustomerAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface DemoLoginResult {
  success: boolean;
  error?: string;
}

/**
 * Sets a local development session cookie granting super_admin access
 */
export async function loginAsDemoAdmin(
  email?: string,
  _password?: string
): Promise<DemoLoginResult> {
  const normalizedEmail = (email || "").trim().toLowerCase();

  // If email was provided in the form, ensure it matches the enterprise admin or allow quick bypass
  if (email && normalizedEmail !== "admin@enterprise.internal") {
    return {
      success: false,
      error: "For demo administrative access, use 'admin@enterprise.internal' or click Quick Demo Sign-In.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set("monolith_dev_admin_session", "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true };
}

/**
 * Clears the admin session cookie and redirects to login
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("monolith_dev_admin_session");
  redirect("/login");
}
