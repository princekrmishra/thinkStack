"use client";

import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: ChatMessage;
  modelColor?: string;
  onRetry?: () => void;
}

export function MessageBubble({ message, modelColor, onRetry }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.status === "error";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("group flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[90%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : isError
            ? "bg-destructive/10 border border-destructive/30 text-destructive"
            : "bg-muted rounded-tl-sm"
        )}
        style={
          !isUser && !isError
            ? { borderLeft: `3px solid ${modelColor}` }
            : undefined
        }
      >
        {/* Error state */}
        {isError ? (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Request failed</p>
              {message.error && (
                <p className="text-xs mt-1 opacity-80">{message.error}</p>
              )}
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Content — preserve line breaks */}
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>

            {/* Timestamp + actions */}
            <div
              className={cn(
                "flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                isUser ? "justify-start" : "justify-end"
              )}
            >
              <span className="text-[10px] text-current/50">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              {!isUser && (
                <button
                  onClick={copyToClipboard}
                  className="text-current/50 hover:text-current transition-colors"
                  title="Copy response"
                >
                  {copied ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}