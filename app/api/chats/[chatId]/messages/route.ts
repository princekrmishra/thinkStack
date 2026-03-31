import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, chats, messages } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const [chat] = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, params.chatId), eq(chats.userId, userId)));

  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, params.chatId))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(chatMessages);
}