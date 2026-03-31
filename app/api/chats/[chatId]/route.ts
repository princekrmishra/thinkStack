import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, chats } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, params.chatId), eq(chats.userId, userId)));

  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(chat);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(chats)
    .where(and(eq(chats.id, params.chatId), eq(chats.userId, userId)));

  return NextResponse.json({ success: true });
}