"use client";

import React from "react";
import { ModelConfig } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  models: ModelConfig[];
  onToggle: (modelId: string) => void;
}

export function ModelSelector({ models, onToggle }: ModelSelectorProps) {
  const enabledCount = models.filter((m) => m.enabled).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">
        Models ({enabledCount}/{models.length}):
      </span>
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => onToggle(model.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            "border transition-all duration-150",
            model.enabled
              ? "text-white border-transparent"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
          )}
          style={
            model.enabled
              ? { backgroundColor: model.color, borderColor: model.color }
              : {}
          }
        >
          <span>{model.icon}</span>
          {model.name}
        </button>
      ))}
    </div>
  );
}