"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatSession } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  chats: ChatSession[];
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatSidebar({ chats, onNewChat, onDeleteChat }: ChatSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 border-r bg-sidebar h-full">
      {/* New Chat button */}
      <div className="p-3 border-b">
        <Button
          onClick={onNewChat}
          className="w-full gap-2"
          variant="outline"
          asChild
        >
          <Link href="/chat">
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Link>
        </Button>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No chats yet. Start a conversation!
            </p>
          )}
          {chats.map((chat) => {
            const isActive = pathname === `/chat/${chat.id}`;
            return (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer",
                  "hover:bg-accent transition-colors",
                  isActive && "bg-accent"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Link
                  href={`/chat/${chat.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}