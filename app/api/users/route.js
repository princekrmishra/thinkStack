import { db } from "@/lib/db";
import { users } from "@/lib/schema";
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

    return NextResponse.json(user[0]);

  } catch (error) {
    console.error("GET user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, email } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (existingUser.length > 0) {
      return NextResponse.json({ message: "User exists" });
    }

    const newUser = await db
      .insert(users)
      .values({
        clerkId: userId,
        name,
        email,
      })
      .returning();

    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}