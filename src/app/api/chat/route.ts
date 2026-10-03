import { NextResponse } from "next/server";
import { handleChatCommand } from "@/app/actions/chat";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "online",
    engine: "in-house-algorithmic-bot",
    externalApi: false,
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request payload: messages array required." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.content || "";

    const result = await handleChatCommand(userText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CHAT_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process chat message." },
      { status: 500 }
    );
  }
}
