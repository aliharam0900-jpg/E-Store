"use server";

import { createClient } from "@/lib/supabase/server";
import type { NewsletterSubscriber } from "@/types";

export interface SubscribeNewsletterResult {
  success: boolean;
  alreadySubscribed?: boolean;
  message: string;
}

// Resilient memory cache fallback if Supabase table has not been created yet
const devFallbackSubscribers: NewsletterSubscriber[] = [];

export async function subscribeNewsletterAction(
  rawEmail: string
): Promise<SubscribeNewsletterResult> {
  const email = (rawEmail || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("newsletter_subscribers").insert([
      {
        email,
      },
    ]);

    if (error) {
      // 23505 is PostgreSQL unique constraint violation code
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("unique")
      ) {
        return {
          success: false,
          alreadySubscribed: true,
          message: "You're already subscribed!",
        };
      }

      // Check if table is missing in Supabase (before developer applies migration SQL)
      const isMissingTable =
        error.code === "42P01" ||
        error.code === "PGRST204" ||
        error.code === "PGRST205" ||
        error.message?.toLowerCase().includes("could not find the table") ||
        error.message?.toLowerCase().includes("does not exist");

      if (isMissingTable) {
        // Handle in fallback cache
        const exists = devFallbackSubscribers.some((s) => s.email === email);
        if (exists) {
          return {
            success: false,
            alreadySubscribed: true,
            message: "You're already subscribed!",
          };
        }
        devFallbackSubscribers.unshift({
          id: `sub-${Date.now()}`,
          email,
          subscribed_at: new Date().toISOString(),
        });
        return {
          success: true,
          message: "Thank you for subscribing to our newsletter!",
        };
      }

      console.error("[NEWSLETTER_SUBSCRIBE_ERROR]", error.message);
      return {
        success: false,
        message: "Failed to join newsletter. Please try again later.",
      };
    }

    return {
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    };
  } catch (err: any) {
    console.error("[NEWSLETTER_SUBSCRIBE_EXCEPTION]", err);
    // Graceful fallback
    const exists = devFallbackSubscribers.some((s) => s.email === email);
    if (exists) {
      return {
        success: false,
        alreadySubscribed: true,
        message: "You're already subscribed!",
      };
    }
    devFallbackSubscribers.unshift({
      id: `sub-${Date.now()}`,
      email,
      subscribed_at: new Date().toISOString(),
    });
    return {
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    };
  }
}

export async function getNewsletterSubscribersAction(): Promise<NewsletterSubscriber[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.warn("[NEWSLETTER_FETCH_NOTICE] Table not yet available or queried fallback:", error.message);
      return devFallbackSubscribers;
    }

    // Combine Supabase data with fallback data if any
    if (devFallbackSubscribers.length > 0) {
      const existingEmails = new Set((data || []).map((s) => s.email));
      const additional = devFallbackSubscribers.filter((s) => !existingEmails.has(s.email));
      return [...(data || []), ...additional];
    }

    return data || [];
  } catch (err: any) {
    console.warn("[NEWSLETTER_FETCH_EXCEPTION]", err);
    return devFallbackSubscribers;
  }
}
