export type ModelProvider = "openai" | "claude" | "google" | "meta";

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  name: string;
  enabled: boolean;
  color: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  provider?: string;
  status: "success" | "error" | "pending";
  error?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt: Date;
}

export interface ModelResponse {
  provider: string;
  model: string;
  output?: string;
  latency?: number;
  status: "success" | "error";
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface MultiModelRequest {
  message: string;
  models: Array<{ id: string; provider: string }>;
  chatId?: string;
}

export interface MultiModelResponse {
  chatId: string;
  userMessageId: string;
  results: ModelResponse[];
}

export interface ChatSession {
  id: string;
  title: string;
  models: ModelConfig[];
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
}

// Per-model conversation history for context
export type ConversationHistory = Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>;