import { ModelResponse } from "@/types";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CallModelOptions {
  model: string;
  provider: string;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  enableWebSearch?: boolean; // ← add this
}

export async function callModel(options: CallModelOptions): Promise<ModelResponse> {
  const {
    model,
    provider,
    messages,
    maxTokens = 2048,
    temperature = 0.7,
    signal,
    enableWebSearch = false,
  } = options;

  // Append :online to enable real-time web search
  const resolvedModel = enableWebSearch ? `${model}:online` : model;

  const startTime = Date.now();

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Multi-Model AI Chat",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal,
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) throw new Error("No choices returned from OpenRouter");

    return {
      provider,
      model,
      output: choice.message?.content || "",
      latency,
      status: "success",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      provider,
      model,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      latency,
    };
  }
}

export async function callMultipleModels(
  models: Array<{ id: string; provider: string }>,
  messages: OpenRouterMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
    enableWebSearch?: boolean; // ← add this
  }
): Promise<ModelResponse[]> {
  const {
    maxTokens = 2048,
    temperature = 0.7,
    timeoutMs = 30_000,
    enableWebSearch = false,
  } = options || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const promises = models.map((model) =>
      callModel({
        model: model.id,
        provider: model.provider,
        messages,
        maxTokens,
        temperature,
        signal: controller.signal,
        enableWebSearch,
      })
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === "fulfilled") return result.value;
      return {
        provider: models[index].provider,
        model: models[index].id,
        status: "error" as const,
        error: result.reason?.message || "Promise rejected",
      };
    });
  } finally {
    clearTimeout(timeoutId);
  }
}