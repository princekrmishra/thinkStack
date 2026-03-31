import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, chats, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user exists in DB
  const clerkUser = await currentUser();
  if (clerkUser) {
    await db
      .insert(users)
      .values({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { updatedAt: new Date() },
      });
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));

  return NextResponse.json(userChats);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user exists in DB
  const clerkUser = await currentUser();
  if (clerkUser) {
    await db
      .insert(users)
      .values({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { updatedAt: new Date() },
      });
  }

  const body = await req.json();
  const [chat] = await db
    .insert(chats)
    .values({
      userId,
      title: body.title || "New Chat",
      models: body.models || [],
    })
    .returning();

  return NextResponse.json(chat, { status: 201 });
}