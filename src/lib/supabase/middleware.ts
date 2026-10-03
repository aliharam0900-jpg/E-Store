import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export interface SessionAuthResult {
  response: NextResponse;
  user: any;
  error: any;
}

/**
 * Refreshes auth tokens and synchronizes session cookies on edge middleware requests.
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionAuthResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail-secure: If credentials are not present, do not allow unauthenticated bypass
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response,
      user: null,
      error: new Error("Missing Supabase credentials"),
    };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Securely retrieve the user from Supabase Auth service
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return {
      response,
      user,
      error,
    };
  } catch (err) {
    // Fail-secure: Treat network or parsing failures as unauthenticated
    return {
      response,
      user: null,
      error: err,
    };
  }
}
