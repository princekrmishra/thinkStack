import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error("Missing CLERK_WEBHOOK_SECRET");

  const headerPayload = await headers(); // ← add await
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { id, email_addresses, first_name, last_name, image_url } =
    evt.data as Record<string, unknown>;

  if (evt.type === "user.created") {
    await db.insert(users).values({
      id: id as string,
      email: (email_addresses as Array<{ email_address: string }>)[0].email_address,
      firstName: first_name as string,
      lastName: last_name as string,
      imageUrl: image_url as string,
    });
  }

  if (evt.type === "user.updated") {
    await db
      .update(users)
      .set({
        email: (email_addresses as Array<{ email_address: string }>)[0].email_address,
        firstName: first_name as string,
        lastName: last_name as string,
        imageUrl: image_url as string,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id as string));
  }

  if (evt.type === "user.deleted") {
    await db.delete(users).where(eq(users.id, id as string));
  }

  return NextResponse.json({ success: true });
}