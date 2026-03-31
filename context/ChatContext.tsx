"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { ModelConfig, ChatMessage, ChatSession, ModelResponse } from "@/types";

// ─── Available Models ─────────────────────────────────────────────────────────

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "openai/gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    enabled: true,
    color: "#10a37f",
    icon: "🤖",
  },
  {
    id: "anthropic/claude-3-haiku",
    provider: "claude",
    name: "Claude 3 Haiku",
    enabled: true,
    color: "#d97706",
    icon: "🔶",
  },
  {
    id: "google/gemini-2.0-flash-001",
    provider: "google",
    name: "Gemini 2.0 Flash",
    enabled: true,
    color: "#4285f4",
    icon: "💎",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    provider: "meta",
    name: "Llama 3.1 70B",
    enabled: false,
    color: "#7c3aed",
    icon: "🦙",
  },
];

// ─── State ────────────────────────────────────────────────────────────────────

interface ChatState {
  currentChatId: string | null;
  chats: ChatSession[];
  messages: ChatMessage[];
  models: ModelConfig[];
  conversationHistory: Record< // ← FIXED: missing 
    string,
    Array<{ role: "user" | "assistant"; content: string }>
  >;
  isLoading: boolean;
  loadingModels: Set<string>;
  error: string | null;
  webSearchEnabled: boolean;
}

type ChatAction =
  | { type: "SET_CHAT_ID"; chatId: string }
  | { type: "SET_CHATS"; chats: ChatSession[] }
  | { type: "ADD_CHAT"; chat: ChatSession }
  | { type: "REMOVE_CHAT"; chatId: string }
  | { type: "SET_MESSAGES"; messages: ChatMessage[] }
  | { type: "ADD_USER_MESSAGE"; message: ChatMessage }
  | { type: "ADD_MODEL_RESPONSES"; responses: ChatMessage[] }
  | { type: "TOGGLE_MODEL"; modelId: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_LOADING_MODEL"; modelId: string; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | {
      type: "UPDATE_CONVERSATION_HISTORY";
      modelId: string;
      userMsg: string;
      assistantMsg: string;
    }
  | { type: "RESET_CHAT" }
  | { type: "TOGGLE_WEB_SEARCH" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CHAT_ID":
      return { ...state, currentChatId: action.chatId };

    case "SET_CHATS":
      return { ...state, chats: action.chats };

    case "ADD_CHAT":
      return { ...state, chats: [action.chat, ...state.chats] };

    case "REMOVE_CHAT":
      return {
        ...state,
        chats: state.chats.filter((c) => c.id !== action.chatId),
        currentChatId:
          state.currentChatId === action.chatId ? null : state.currentChatId,
      };

    case "SET_MESSAGES":
      return { ...state, messages: action.messages };

    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };

    case "ADD_MODEL_RESPONSES":
      return {
        ...state,
        messages: [...state.messages, ...action.responses],
        isLoading: false,
      };

    case "TOGGLE_MODEL":
      return {
        ...state,
        models: state.models.map((m) =>
          m.id === action.modelId ? { ...m, enabled: !m.enabled } : m
        ),
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.loading };

    case "SET_LOADING_MODEL": {
      const next = new Set<string>(state.loadingModels);
      action.loading ? next.add(action.modelId) : next.delete(action.modelId);
      return { ...state, loadingModels: next };
    }

    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };

    case "UPDATE_CONVERSATION_HISTORY": {
      const existing = state.conversationHistory[action.modelId] || [];
      return {
        ...state,
        conversationHistory: {
          ...state.conversationHistory,
          [action.modelId]: [
            ...existing,
            { role: "user", content: action.userMsg },
            { role: "assistant", content: action.assistantMsg },
          ],
        },
      };
    }

    case "RESET_CHAT":
      return {
        ...state,
        currentChatId: null,
        messages: [],
        conversationHistory: {},
        isLoading: false,
        error: null,
      };

    case "TOGGLE_WEB_SEARCH":
      return { ...state, webSearchEnabled: !state.webSearchEnabled };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (message: string) => Promise<void>;
  retryModel: (
    modelId: string,
    provider: string,
    lastUserMessage: string
  ) => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  createNewChat: () => void;
  deleteChat: (chatId: string) => Promise<void>;
  toggleModel: (modelId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    currentChatId: null,
    chats: [],
    messages: [],
    models: AVAILABLE_MODELS,
    conversationHistory: {},
    isLoading: false,
    loadingModels: new Set<string>(),
    error: null,
    webSearchEnabled: false,
  });

  // ── Send a new message to all enabled models ──────────────────────────────

  const sendMessage = useCallback(
    async (message: string) => {
      const enabledModels = state.models.filter((m) => m.enabled);
      if (!enabledModels.length) {
        dispatch({
          type: "SET_ERROR",
          error: "Please enable at least one model.",
        });
        return;
      }

      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatId: state.currentChatId || "pending",
        role: "user",
        content: message,
        status: "success",
        createdAt: new Date(),
      };
      dispatch({ type: "ADD_USER_MESSAGE", message: tempUserMsg });

      enabledModels.forEach((m) =>
        dispatch({ type: "SET_LOADING_MODEL", modelId: m.id, loading: true })
      );

      try {
        const res = await fetch("/api/multi-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            models: enabledModels.map((m) => ({
              id: m.id,
              provider: m.provider,
            })),
            chatId: state.currentChatId || undefined,
            conversationHistory: state.conversationHistory,
            enableWebSearch: state.webSearchEnabled,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const data = await res.json();

        if (!state.currentChatId && data.chatId) {
          dispatch({ type: "SET_CHAT_ID", chatId: data.chatId });
          window.history.pushState({}, "", `/chat/${data.chatId}`);
        }

        const responseMessages: ChatMessage[] = (
          data.results as ModelResponse[]
        ).map((r) => ({
          id: `msg-${r.model}-${Date.now()}`,
          chatId: data.chatId,
          role: "assistant" as const,
          content: r.output || "",
          model: r.model,
          provider: r.provider,
          status: r.status,
          error: r.error,
          latencyMs: r.latency,
          promptTokens: r.usage?.promptTokens,
          completionTokens: r.usage?.completionTokens,
          totalTokens: r.usage?.totalTokens,
          createdAt: new Date(),
        }));

        dispatch({ type: "ADD_MODEL_RESPONSES", responses: responseMessages });

        (data.results as ModelResponse[]).forEach((r) => {
          if (r.status === "success" && r.output) {
            dispatch({
              type: "UPDATE_CONVERSATION_HISTORY",
              modelId: r.model,
              userMsg: message,
              assistantMsg: r.output,
            });
          }
        });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          error:
            error instanceof Error ? error.message : "Something went wrong",
        });
      } finally {
        enabledModels.forEach((m) =>
          dispatch({ type: "SET_LOADING_MODEL", modelId: m.id, loading: false })
        );
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state]
  );

  // ── Retry a specific failed model ─────────────────────────────────────────

  const retryModel = useCallback(
    async (modelId: string, provider: string, lastUserMessage: string) => {
      dispatch({ type: "SET_LOADING_MODEL", modelId, loading: true });

      try {
        const res = await fetch("/api/multi-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: lastUserMessage,
            models: [{ id: modelId, provider }],
            chatId: state.currentChatId || undefined,
            conversationHistory: state.conversationHistory,
            enableWebSearch: state.webSearchEnabled,
          }),
        });

        if (!res.ok) throw new Error("Retry failed");

        const data = await res.json();
        const result: ModelResponse = data.results[0];

        const responseMessage: ChatMessage = {
          id: `retry-${modelId}-${Date.now()}`,
          chatId: data.chatId,
          role: "assistant",
          content: result.output || "",
          model: result.model,
          provider: result.provider,
          status: result.status,
          error: result.error,
          latencyMs: result.latency,
          createdAt: new Date(),
        };

        dispatch({
          type: "ADD_MODEL_RESPONSES",
          responses: [responseMessage],
        });
      } catch (error) {
        console.error("Retry failed:", error);
      } finally {
        dispatch({ type: "SET_LOADING_MODEL", modelId, loading: false });
      }
    },
    [state]
  );

  // ── Load an existing chat ─────────────────────────────────────────────────

  const loadChat = useCallback(async (chatId: string) => {
    dispatch({ type: "SET_CHAT_ID", chatId });

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");

      const msgs = await res.json();
      dispatch({ type: "SET_MESSAGES", messages: msgs });

      const historyByModel: Record< // ← FIXED: missing 
        string,
        Array<{ role: "user" | "assistant"; content: string }>
      > = {};

      const userMessages = msgs.filter(
        (m: ChatMessage) => m.role === "user"
      );
      const assistantMessages = msgs.filter(
        (m: ChatMessage) => m.role === "assistant"
      );

      assistantMessages.forEach((am: ChatMessage) => {
        if (!am.model) return;
        if (!historyByModel[am.model]) historyByModel[am.model] = [];
        const userMsg = userMessages.find(
          (u: ChatMessage) =>
            new Date(u.createdAt) <= new Date(am.createdAt)
        );
        if (userMsg) {
          historyByModel[am.model].push({
            role: "user",
            content: userMsg.content,
          });
          historyByModel[am.model].push({
            role: "assistant",
            content: am.content,
          });
        }
      });

      Object.entries(historyByModel).forEach(([modelId, history]) => {
        history.forEach((_, i) => {
          if (i % 2 === 0 && history[i + 1]) {
            dispatch({
              type: "UPDATE_CONVERSATION_HISTORY",
              modelId,
              userMsg: history[i].content,
              assistantMsg: history[i + 1].content,
            });
          }
        });
      });
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }, []);

  const createNewChat = useCallback(() => {
    dispatch({ type: "RESET_CHAT" });
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    dispatch({ type: "REMOVE_CHAT", chatId });
  }, []);

  const toggleModel = useCallback((modelId: string) => {
    dispatch({ type: "TOGGLE_MODEL", modelId });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        retryModel,
        loadChat,
        createNewChat,
        deleteChat,
        toggleModel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx)
    throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}