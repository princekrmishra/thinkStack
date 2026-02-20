import { db } from "@/lib/db";
import { users, userModelPreferences } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pref = await db
      .select()
      .from(userModelPreferences)
      .where(eq(userModelPreferences.userId, user[0].id));

    if (!pref.length) {
      return NextResponse.json({ preferences: null });
    }

    return NextResponse.json({ preferences: pref[0].preferences });

  } catch (error) {
    console.error("GET preferences error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth(); // ✅ FIXED

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferences } = await req.json();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await db
      .select()
      .from(userModelPreferences)
      .where(eq(userModelPreferences.userId, user[0].id));

    if (existing.length) {
      await db
        .update(userModelPreferences)
        .set({
          preferences,
          updatedAt: new Date(),
        })
        .where(eq(userModelPreferences.userId, user[0].id));
    } else {
      await db.insert(userModelPreferences).values({
        userId: user[0].id,
        preferences,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}