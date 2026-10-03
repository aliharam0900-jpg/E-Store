"use server";

import { createClient } from "@/lib/supabase/server";

export interface ChatCommandResult {
  reply: string;
  products?: {
    id: string;
    title: string;
    slug: string;
    base_price: number;
  }[];
}

const STOP_WORDS = new Set([
  "show",
  "me",
  "do",
  "you",
  "have",
  "can",
  "i",
  "buy",
  "what",
  "where",
  "is",
  "are",
  "there",
  "looking",
  "for",
  "want",
  "need",
  "find",
  "get",
  "search",
  "tell",
  "about",
  "give",
  "the",
  "a",
  "an",
  "in",
  "with",
  "of",
  "and",
  "or",
  "to",
  "please",
  "some",
  "any",
  "item",
  "items",
  "product",
  "products",
  "piece",
  "pieces",
  "like",
]);

/**
 * Self-contained in-house algorithmic shopping assistant
 * Runs zero external LLM APIs; queries Supabase directly based on extracted intent.
 */
export async function handleChatCommand(
  rawInput: string
): Promise<ChatCommandResult> {
  const input = (rawInput || "").trim();
  if (!input) {
    return {
      reply: "How can I assist your wardrobe selection or material inquiry today?",
    };
  }

  const lower = input.toLowerCase();

  // 1. GREETING HANDLER
  const isGreeting =
    /^(hi|hello|hey|sup|yo|greetings|howdy)\b/i.test(lower) ||
    lower.includes("good morning") ||
    lower.includes("good afternoon") ||
    lower.includes("good evening");

  if (isGreeting) {
    return {
      reply:
        "Hello! I am your Monolith Concierge assistant. I can help you locate technical garments, discover aerospace artifacts, or check specifications. What are you looking for today?",
    };
  }

  // 2. COMMON FAQ & STATIC TOPICS
  if (lower === "help" || lower.includes("how does this work") || lower.includes("what can you do")) {
    return {
      reply:
        "I can search our technical catalog for you! Try asking for 'jackets', 'cargo pants', 'titanium watch', 'bags', 'hoodie', or browse our [All Categories](/shop) page.",
    };
  }

  if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("courier")) {
    return {
      reply:
        "We offer worldwide carbon-neutral express courier fulfillment with real-time tracking on all dispatches. Orders are processed within 24 hours of placement.",
    };
  }

  if (lower.includes("return") || lower.includes("refund") || lower.includes("warranty")) {
    return {
      reply:
        "All Monolith artifacts are backed by our lifetime warranty against manufacturing defects, plus 30-day complimentary returns for unworn pieces in original condition.",
    };
  }

  // 3. KEYWORD EXTRACTION (Stop-words removal)
  const cleanedTokens = lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));

  try {
    const supabase = await createClient();

    // Query published catalog items
    const { data: allProducts, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        slug,
        base_price,
        description,
        category:categories (
          name,
          slug
        )
      `)
      .eq("is_published", true);

    if (error || !allProducts || allProducts.length === 0) {
      return {
        reply: "I couldn't find anything matching that, but check out our [All Categories](/shop) page.",
        products: [],
      };
    }

    // Match products against extracted keywords or full search query
    const matchedProducts = allProducts.filter((product) => {
      const titleLower = product.title.toLowerCase();
      const descLower = (product.description || "").toLowerCase();
      const catLower = (product.category as any)?.name?.toLowerCase() || "";

      // Check full phrase match
      if (titleLower.includes(lower) || descLower.includes(lower) || catLower.includes(lower)) {
        return true;
      }

      // Check token match
      if (cleanedTokens.length === 0) {
        return false;
      }

      return cleanedTokens.some(
        (token) =>
          titleLower.includes(token) ||
          descLower.includes(token) ||
          catLower.includes(token)
      );
    });

    if (matchedProducts.length > 0) {
      const topItems = matchedProducts.slice(0, 5);
      const itemsList = topItems
        .map((p) => `- [${p.title}](/product/${p.slug}) — $${p.base_price}`)
        .join("\n");

      return {
        reply: `I found these items for you:\n\n${itemsList}\n\nYou can also explore the full collection on our [All Categories](/shop) page.`,
        products: topItems.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          base_price: Number(p.base_price),
        })),
      };
    }

    return {
      reply: "I couldn't find anything matching that, but check out our [All Categories](/shop) page.",
      products: [],
    };
  } catch (err) {
    console.error("[BOT_COMMAND_ERROR]", err);
    return {
      reply: "I couldn't find anything matching that, but check out our [All Categories](/shop) page.",
      products: [],
    };
  }
}
