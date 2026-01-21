"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { ChevronUp, Copy, X } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import { db, type ChatMessageRecord, type NodeRecord } from "@/lib/db";
import { expandChatAction } from "@/app/actions/expand-chat";
import { createId } from "@/lib/uuid";

type PromptType = "direct" | "cause" | "counter" | "timeline" | "analogy";

type ChatDisplayMessage = ChatMessageRecord & {
  sourceLabel?: string;
};

const PROMPT_TABS: { type: PromptType; label: string }[] = [
  { type: "direct", label: "直接拆分" },
  { type: "cause", label: "因果链条" },
  { type: "counter", label: "反向视角" },
  { type: "timeline", label: "时间演化" },
  { type: "analogy", label: "类比联想" }
];

const PROMPT_LABELS: Record<PromptType, string> = {
  direct: "直接拆分",
  cause: "因果链条",
  counter: "反向视角",
  timeline: "时间演化",
  analogy: "类比联想"
};

const DEFAULT_SOURCE_LABEL = "自由提问";

const createChatMessage = (message: Omit<ChatMessageRecord, "id" | "createdAt">) => ({
  ...message,
  id: createId(),
  createdAt: Date.now()
});

type NodeDetailsPanelProps = {
  node: NodeRecord;
  rootTopic: string;
  topicConstraints: string;
  pathContext: string[];
  onClose: () => void;
};

export function NodeDetailsPanel({
  node,
  rootTopic,
  topicConstraints,
  pathContext,
  onClose
}: NodeDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const messages = useLiveQuery(async () => {
    return db.chatMessages
      .where("[topicId+nodeId]")
      .equals([node.topicId, node.id])
      .sortBy("createdAt");
  }, [node.id, node.topicId]);

  useEffect(() => {
    setDraft("");
    setIsLoading(false);
    setError(null);
    setActivePrompt(null);
  }, [node.id]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 22 * 5 + 16;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft]);

  const displayMessages = useMemo<ChatDisplayMessage[]>(() => {
    let currentSource = DEFAULT_SOURCE_LABEL;
    return (messages ?? []).map((message) => {
      if (message.role === "user") {
        currentSource = message.promptType ? PROMPT_LABELS[message.promptType] : DEFAULT_SOURCE_LABEL;
        return message;
      }
      return { ...message, sourceLabel: currentSource };
    });
  }, [messages]);

  const lastUserMessageId = useMemo(() => {
    const lastUser = [...(displayMessages ?? [])].reverse().find((message) => message.role === "user");
    return lastUser?.id ?? null;
  }, [displayMessages]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (copyError) {
      console.error("Failed to copy chat message", copyError);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await db.chatMessages.delete(messageId);
  };

  const sendAssistantReply = async (payload: { message?: string; promptType?: PromptType }) => {
    const response = await expandChatAction({
      rootTopic,
      topicDescription: topicConstraints,
      pathContext,
      nodeTitle: node.title,
      nodeDescription: node.description,
      message: payload.message,
      promptType: payload.promptType
    });
    const assistantMessage = createChatMessage({
      topicId: node.topicId,
      nodeId: node.id,
      role: "assistant",
      content: response.reply
    });
    await db.chatMessages.put(assistantMessage);
  };

  const handleSendPrompt = async (promptType: PromptType) => {
    if (isLoading) return;
    setActivePrompt(promptType);
    setIsLoading(true);
    setError(null);
    const userMessage = createChatMessage({
      topicId: node.topicId,
      nodeId: node.id,
      role: "user",
      content: PROMPT_LABELS[promptType],
      promptType
    });
    await db.chatMessages.put(userMessage);
    try {
      await sendAssistantReply({ promptType });
    } catch (requestError) {
      console.error("Failed to generate chat reply", requestError);
      setError("生成失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (isLoading) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setActivePrompt(null);
    setIsLoading(true);
    setError(null);
    setDraft("");
    const userMessage = createChatMessage({
      topicId: node.topicId,
      nodeId: node.id,
      role: "user",
      content: trimmed
    });
    await db.chatMessages.put(userMessage);
    try {
      await sendAssistantReply({ message: trimmed });
    } catch (requestError) {
      console.error("Failed to generate chat reply", requestError);
      setError("生成失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handleSendMessage();
  };

  const renderEmptyState = () => (
    <p className="text-sm text-gray-400">选择预设联想或输入问题开始对话。</p>
  );

  const renderLoadingIndicator = () => (
    <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
      <span>AI 正在生成...</span>
    </div>
  );

  return (
    <aside
      className={clsx(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-30 rounded-t-sm border-t border-gray-200 bg-white shadow-[0_-12px_30px_rgba(0,0,0,0.12)]",
        expanded ? "h-[75vh]" : "h-[33vh]"
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">{node.title}</h3>
          <p className="mt-2 text-sm text-gray-500">{node.description || "暂无描述"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <ChevronUp className={clsx("h-4 w-4 transition", expanded && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex h-[calc(100%-88px)] flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {displayMessages.length === 0
              ? renderEmptyState()
              : displayMessages.map((message) => {
                  const isUser = message.role === "user";
                  const actionClass = clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition",
                    isUser
                      ? "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                      : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                  );
                  const nameClass = isUser ? "text-amber-600" : "text-sky-700";
                  const contentClass = isUser ? "text-ink" : "text-gray-700";

                  return (
                    <div key={message.id} className="group w-full">
                        <div className="flex items-start justify-between gap-2">

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={clsx("text-[11px] uppercase tracking-[0.2em]", nameClass)}>
                            {isUser ? "用户" : "AI"}
                          </span>
                          {!isUser && message.sourceLabel && (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                              {message.sourceLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleCopy(message.content)}
                            className={actionClass}
                            title="复制"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(message.id)}
                            className={actionClass}
                            title="删除"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                      {isUser ? (
                        <p className={clsx("mt-2 whitespace-pre-line text-sm leading-relaxed", contentClass)}>
                          {message.content}
                        </p>
                      ) : (
                        <Markdown content={message.content} className={clsx("mt-2", contentClass)} />
                      )}
                      {isLoading && isUser && message.id === lastUserMessageId && renderLoadingIndicator()}
                    </div>
                  );
                })}
          </div>
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PROMPT_TABS.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => handleSendPrompt(tab.type)}
                  disabled={isLoading}
                  className={clsx(
                    "rounded-full border px-4 py-1 text-xs font-semibold transition",
                    activePrompt === tab.type
                      ? "border-amber-500 text-ink"
                      : "border-gray-200 text-gray-600 hover:border-black hover:text-ink",
                    isLoading && "cursor-not-allowed opacity-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题"
              rows={1}
              className="min-h-[40px] w-full resize-none rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-black"
            />
            {error && <p className="text-xs text-amber-600">{error}</p>}
          </div>
        </div>
      </div>
    </aside>
  );
}
