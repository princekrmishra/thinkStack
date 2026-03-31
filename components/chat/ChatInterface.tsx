"use client";

import React, { useEffect } from "react";
import { useChatContext } from "@/context/ChatContext";
import { ModelColumn } from "./ModelColumn";
import { PromptInput } from "./PromptInput";
import { ModelSelector } from "./ModelSelector";
import { ChatSidebar } from "./ChatSidebar";
import { UserButton } from "@clerk/nextjs";
import { Globe } from "lucide-react";
import { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  initialChatId?: string;
}

export function ChatInterface({ initialChatId }: ChatInterfaceProps) {
  const {
    state,
    dispatch,
    sendMessage,
    retryModel,
    loadChat,
    createNewChat,
    deleteChat,
    toggleModel,
  } = useChatContext();

  useEffect(() => {
    if (initialChatId) {
      loadChat(initialChatId);
    }
  }, [initialChatId, loadChat]);

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((chats) => {
        if (Array.isArray(chats)) {
          dispatch({ type: "SET_CHATS", chats });
        }
      })
      .catch(console.error);
  }, [dispatch]);

  const enabledModels = state.models.filter((m) => m.enabled);

  const lastUserMessage =
    [...state.messages].reverse().find((m) => m.role === "user")?.content || "";

  const handleContinueWithModel = async (modelId: string, message: string) => {
    const model = state.models.find((m) => m.id === modelId);
    if (!model) return;
    await sendMessage(message);
  };

  return (
    // ── h-screen + overflow-hidden on root keeps everything inside viewport
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Sidebar */}
      <ChatSidebar
        chats={state.chats}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />

      {/* ── Right panel: fixed height column layout ── */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">

        {/* Topbar — fixed height, never shrinks */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-bold text-lg tracking-tight">⚡ ThinkStack</h1>
            <ModelSelector models={state.models} onToggle={toggleModel} />
            <button
              onClick={() => dispatch({ type: "TOGGLE_WEB_SEARCH" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                state.webSearchEnabled
                  ? "bg-blue-500 text-white border-blue-500"
                  : "text-muted-foreground border-border hover:border-foreground/30"
              )}
              title="Enable real-time web search"
            >
              <Globe className="h-3.5 w-3.5" />
              Web Search
            </button>
          </div>
          <UserButton />
        </header>

        {/* Web Search Banner */}
        {state.webSearchEnabled && (
          <div className="mx-4 mt-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs rounded-lg flex items-center gap-2 shrink-0">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            Web search is enabled — models will fetch real-time information
          </div>
        )}

        {/* Error Banner */}
        {state.error && (
          <div className="mx-4 mt-2 px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg shrink-0">
            {state.error}
          </div>
        )}

        {/* ── Model Columns Grid ──
            flex-1     → takes all remaining vertical space
            min-h-0    → CRITICAL: allows flex child to shrink below content size
            overflow-x-auto → horizontal scroll when many models enabled        */}
        <div
          className="flex-1 min-h-0 overflow-x-auto p-4"
        >
          <div
            className="grid gap-3 h-full"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, enabledModels.length)}, minmax(300px, 1fr))`,
            }}
          >
            {enabledModels.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-full text-muted-foreground text-sm">
                Enable at least one model from the selector above to start chatting.
              </div>
            ) : (
              enabledModels.map((model) => {
                const modelMessages: ChatMessage[] = state.messages.filter(
                  (m) => m.role === "user" || m.model === model.id
                );
                return (
                  <ModelColumn
                    key={model.id}
                    model={model}
                    messages={modelMessages}
                    isLoading={state.loadingModels.has(model.id)}
                    lastUserMessage={lastUserMessage}
                    onRetry={() =>
                      retryModel(model.id, model.provider, lastUserMessage)
                    }
                    onContinue={(msg) =>
                      handleContinueWithModel(model.id, msg)
                    }
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Prompt Input — fixed height, never shrinks */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm shrink-0">
          <div className="max-w-4xl mx-auto">
            <PromptInput
              onSend={sendMessage}
              isLoading={state.isLoading}
              disabled={enabledModels.length === 0}
              placeholder={
                enabledModels.length === 0
                  ? "Enable at least one model to start…"
                  : state.webSearchEnabled
                  ? `Ask ${enabledModels.length} model${enabledModels.length > 1 ? "s" : ""} with web search…`
                  : `Ask ${enabledModels.length} model${enabledModels.length > 1 ? "s" : ""} simultaneously…`
              }
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for new line
              {state.webSearchEnabled && (
                <span className="text-blue-500 ml-2">· 🌐 Web search on</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}