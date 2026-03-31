"use client";

import React, { useRef, useEffect } from "react";
import { ModelConfig, ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ModelColumnProps {
  model: ModelConfig;
  messages: ChatMessage[];
  isLoading: boolean;
  lastUserMessage: string;
  onRetry: () => void;
  onContinue: (message: string) => void;
}

export function ModelColumn({
  model,
  messages,
  isLoading,
  lastUserMessage,
  onRetry,
  onContinue,
}: ModelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const lastAssistantMsg = messages
    .filter((m) => m.model === model.id)
    .at(-1);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card overflow-hidden",
        "transition-all duration-200 h-full",
        !model.enabled && "opacity-40 pointer-events-none"
      )}
      style={{ borderColor: `${model.color}33` }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: `${model.color}11` }}
      >
        <span className="text-xl">{model.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{model.name}</p>
          <p className="text-xs text-muted-foreground truncate">{model.id}</p>
        </div>
        {lastAssistantMsg?.latencyMs && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {lastAssistantMsg.latencyMs}ms
          </Badge>
        )}
        {lastAssistantMsg?.totalTokens && (
          <Badge variant="outline" className="text-xs shrink-0">
            {lastAssistantMsg.totalTokens} tok
          </Badge>
        )}
      </div>

      {/* ── Scrollable Messages Area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Send a message to start
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            modelColor={model.color}
            onRetry={
              msg.status === "error" && msg.role === "assistant"
                ? onRetry
                : undefined
            }
          />
        ))}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>

      {/* Per-model continue input */}
      {messages.length > 0 && !isLoading && (
        <div className="p-3 border-t bg-background/50 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Continue with ${model.name}…`}
              className="flex-1 text-sm bg-transparent border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputRef.current?.value) {
                  onContinue(inputRef.current.value);
                  inputRef.current.value = "";
                }
              }}
            />
            <button
              onClick={() => {
                if (inputRef.current?.value) {
                  onContinue(inputRef.current.value);
                  inputRef.current.value = "";
                }
              }}
              className="px-3 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: model.color }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}