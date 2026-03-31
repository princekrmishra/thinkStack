import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { callMultipleModels } from "@/lib/openrouter";
import { db, chats, messages, users } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const requestSchema = z.object({
  message: z.string().min(1).max(10_000),
  models: z
    .array(
      z.object({
        id: z.string(),
        provider: z.string(),
      })
    )
    .min(1)
    .max(6),
  chatId: z.string().uuid().optional(),
  enableWebSearch: z.boolean().optional().default(false),
  conversationHistory: z
    .record(
      z.string(),
      z.array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })
      )
    )
    .optional(),
});

// ─── POST /api/multi-model ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Upsert user into DB (guards against missing webhook sync)
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
          set: {
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            updatedAt: new Date(),
          },
        });
    }

    // 3. Rate limiting (20 requests/minute per user)
    const limit = rateLimit(`multi-model:${userId}`, 20, 60_000);
    if (!limit.success) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before sending another request.",
        },
        {
          status: 429,
          headers: { "X-RateLimit-Reset": String(limit.resetAt) },
        }
      );
    }

    // 4. Parse & validate body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, models, chatId, conversationHistory, enableWebSearch } =
      parsed.data;

    // 5. Resolve or create chat session
    let resolvedChatId = chatId;

    if (!resolvedChatId) {
      const title =
        message.slice(0, 60) + (message.length > 60 ? "…" : "");
      const [newChat] = await db
        .insert(chats)
        .values({
          userId,
          title,
          models: models.map((m) => ({
            ...m,
            name: modelDisplayName(m.id),
          })),
        })
        .returning();
      resolvedChatId = newChat.id;
    }

    // 6. Save the user message
    const [userMsg] = await db
      .insert(messages)
      .values({
        chatId: resolvedChatId,
        role: "user",
        content: message,
        status: "success",
      })
      .returning();

    // 7. Build per-model message arrays (inject conversation history)
    const modelMessagesMap = models.map((model) => {
      const history = conversationHistory?.[model.id] || [];
      const openRouterMessages = [
        {
          role: "system" as const,
          content:
            "You are a helpful, concise, and accurate AI assistant. Format your responses clearly. If you have access to web search, use it to provide up-to-date information.",
        },
        ...history,
        { role: "user" as const, content: message },
      ];
      return { model, messages: openRouterMessages };
    });

    // 8. Call all models in parallel — Promise.allSettled never throws
    const startTime = Date.now();
    const results = await Promise.allSettled(
      modelMessagesMap.map(({ model, messages: msgs }) =>
        callMultipleModels([model], msgs, { enableWebSearch })
      )
    );

    // 9. Flatten results
    const modelResults = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );

    // 10. Persist assistant messages to DB
    if (modelResults.length > 0) {
      await db.insert(messages).values(
        modelResults.map((result) => ({
          chatId: resolvedChatId!,
          role: "assistant" as const,
          content: result.output || "",
          model: result.model,
          provider: result.provider,
          status: result.status,
          error: result.error,
          latencyMs: result.latency,
          promptTokens: result.usage?.promptTokens,
          completionTokens: result.usage?.completionTokens,
          totalTokens: result.usage?.totalTokens,
          metadata: enableWebSearch ? { webSearchEnabled: true } : undefined,
        }))
      );
    }

    // 11. Update chat's updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, resolvedChatId));

    // 12. Return response
    return NextResponse.json({
      chatId: resolvedChatId,
      userMessageId: userMsg.id,
      results: modelResults,
      totalLatencyMs: Date.now() - startTime,
      webSearchEnabled: enableWebSearch,
    });
  } catch (error) {
    console.error("[multi-model] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modelDisplayName(modelId: string): string {
  const names: Record<string, string> = {
    "openai/gpt-4o-mini": "GPT-4o Mini",
    "anthropic/claude-3-haiku": "Claude 3 Haiku",
    "google/gemini-2.0-flash-001": "Gemini 2.0 Flash",
    "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B",
  };
  return names[modelId] || modelId;
}