"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { handleChatCommand } from "@/app/actions/chat";

let messageSeq = 0;
function createMessageId(prefix: string) {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Show me waterproof jackets",
  "Do you have cargo trousers?",
  "Recommend titanium artifacts",
  "What are your shipping policies?",
];

export function AiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Monolith. I am your in-house shopping concierge. Ask me about technical outerwear, cargo trousers, aerospace timepieces, or shipping policies.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Do not render chat widget in admin portal
  if (pathname.startsWith("/sys-admin-portal")) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: createMessageId("user"),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call in-house algorithmic server action (zero external LLM APIs)
      const res = await handleChatCommand(query);

      const assistantMessage: Message = {
        id: createMessageId("assistant"),
        role: "assistant",
        content: res.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("err"),
          role: "assistant",
          content:
            "I couldn't process that query right now, but please explore our [All Categories](/shop) page.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Parses markdown links e.g. [Title](/product/slug) into interactive buttons/links
   */
  const renderMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      const label = match[1];
      const href = match[2];
      parts.push(
        <Link
          key={`${href}-${match.index}`}
          href={href}
          onClick={() => setIsOpen(false)}
          className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 my-0.5 rounded bg-foreground/10 text-foreground hover:bg-foreground hover:text-background transition-colors border border-border"
        >
          <span>{label}</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-xs">
        {parts.map((part, i) =>
          typeof part === "string" ? <span key={i}>{part}</span> : part
        )}
      </div>
    );
  };

  return (
    <aside
      aria-label="In-House Shopping Concierge"
      className="fixed bottom-5 right-5 z-30"
    >
      {/* Floating Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          data-testid="ai-chat-trigger"
          aria-label="Open Shopping Concierge"
          className="h-11 px-4 rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90 font-mono text-xs font-semibold gap-2 border border-border flex items-center transition-all duration-200 hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          <span>Shopping Bot</span>
        </Button>
      )}

      {/* Expanded Floating Chat Window */}
      {isOpen && (
        <div
          data-testid="ai-chat-window"
          className="w-[calc(100vw-2.5rem)] sm:w-96 h-[490px] rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-card/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  SHOPPING CONCIERGE
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                    IN-HOUSE
                  </Badge>
                </h4>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Algorithmic catalog discovery
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Close Concierge"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-xs shadow-xs ${
                    m.role === "user"
                      ? "bg-foreground text-background font-medium"
                      : "bg-muted/60 text-foreground border border-border"
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
                {m.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompt Chips */}
          <div className="p-2.5 border-t border-border bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap text-[10px] font-mono px-2 py-1 rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border bg-background flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search jackets, trousers, watches, bags..."
              className="text-xs h-9 font-sans"
              disabled={isLoading}
              data-testid="ai-chat-input"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90"
              aria-label="Send message"
              data-testid="ai-chat-submit"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </aside>
  );
}
