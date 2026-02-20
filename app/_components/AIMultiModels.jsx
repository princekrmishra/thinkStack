"use client";
import AIModelList from "@/shared/AIModelList";
import Image from "next/image";
import React, { useContext, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISelectedModelContext } from "@/context/AISelectedModelContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AIMultiModels() {
  console.log("AIModelList import:", AIModelList);
  console.log("Is array:", Array.isArray(AIModelList));
  const [aiModelList, setAiModelList] = useState(AIModelList);
  const { aISelectedModels, setAISelectedModels, messages, setMessages } =
    useContext(AISelectedModelContext);

  const onToggleChange = (model, value) => {
  setAiModelList((prev) =>
    prev.map((m) =>
      m.model === model ? { ...m, enable: value } : m
    )
  );
};

  console.log("Messages state:", messages);

  const onSelectValue = async (parentModel, value) => {
    const updated = {
      ...aISelectedModels,
      [parentModel]: {
        modelId: value,
      },
    };

    setAISelectedModels(updated);

  
  };

  return (
    <div className="flex flex-1 h-[75vh] border-b">
      {aiModelList.map((model, index) => (
        <div
          key={model.model} // ✅ FIXED: key moved here
          className={`flex flex-col border-r h-full${
            model.enable ? "flex-1 min-w-[400px]" : "w-[100px] flex-none"
          }`}
        >
          <div className="flex w-full h-[70px] items-center justify-between border-b p-4 ">
            <div className="flex items-center gap-4">
              <Image
                src={model.icon}
                alt={model.model}
                width={24}
                height={24}
              />
              {model.enable && (
                <Select
                  value={aISelectedModels?.[model.model]?.modelId ?? ""}
                  onValueChange={(value) => onSelectValue(model.model, value)}
                  disabled={model.premium}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        aISelectedModels?.[model.model]?.modelId ||
                        "Select Model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="px-3">
                      <SelectLabel className={"text-sm text-gray-400"}>
                        Free
                      </SelectLabel>
                      {model.subModel.map(
                        (subModel, index) =>
                          subModel.premium == false && (
                            <SelectItem key={index} value={subModel.id}>
                              {subModel.name}
                            </SelectItem>
                          ),
                      )}
                    </SelectGroup>
                    <SelectGroup className="px-3">
                      <SelectLabel className={"text-sm text-gray-400"}>
                        Premium
                      </SelectLabel>
                      {model.subModel.map(
                        (subModel, index) =>
                          subModel.premium == true && (
                            <SelectItem
                              key={index}
                              value={subModel.id}
                              disabled={subModel.premium}
                            >
                              {subModel.name}{" "}
                              {subModel.premium && <Lock className="h-4 w-4" />}
                            </SelectItem>
                          ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              {model.enable ? (
                <Switch
                  checked={model.enable}
                  onCheckedChange={(v) => onToggleChange(model.model, v)}
                />
              ) : (
                <MessageSquare
                  onClick={() => onToggleChange(model.model, true)}
                />
              )}
            </div>
          </div>
          {model.premium && model.enable && (
            <div className="flex items-center justify-center h-full">
              <Button>
                <Lock />
                Upgrade to Unlock
              </Button>
            </div>
          )}
          {model.enable && (
            <div className="flex-1 p-4">
              <div className="flex-1 p-4 space-y-2">
                {messages[model.model]?.map((m, i) => (
                  <div
                    className={`p-2 rounded-md ${m.role == "user" ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-900"}`}
                    key={`${m.role}-${i}`}
                  >
                    {m.role == "assistant" && (
                      <span className="text-sm text-gray-400">
                        {m.model ?? model.model}
                      </span>
                    )}
                    <div className="flex gap-3 items-center">
                      {m.content == "loading" && (
                        <>
                          <Loader className="animate-spin" />
                          <span>Loading...</span>
                        </>
                      )}
                    </div>
                    {m.content != "loading" && (
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </Markdown>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AIMultiModels;
