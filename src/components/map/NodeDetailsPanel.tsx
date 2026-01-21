"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { ChevronUp, Copy, Maximize2, Minimize2, X } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import { db, type ChatMessageRecord, type NodeRecord } from "@/lib/db";
import { expandChatAction } from "@/app/actions/expand-chat";
import { createId } from "@/lib/uuid";

type StrategyType =
  | "structural"
  | "causal"
  | "inverse"
  | "evolutionary"
  | "analogical"
  | "first_principles"
  | "stakeholder"
  | "second_order"
  | "constraints"
  | "systems";

type ChatDisplayMessage = ChatMessageRecord & {
  sourceLabel?: string;
};

const PROMPT_TABS: { type: StrategyType; label: string }[] = [
  { type: "structural", label: "直接拆分" },
  { type: "causal", label: "因果链条" },
  { type: "inverse", label: "反向视角" },
  { type: "evolutionary", label: "时间演化" },
  { type: "analogical", label: "类比联想" },
  { type: "first_principles", label: "第一性原理" },
  { type: "stakeholder", label: "利益博弈" },
  { type: "second_order", label: "第二级效应" },
  { type: "constraints", label: "极限测试" },
  { type: "systems", label: "系统反馈" }
];

const PROMPT_LABELS: Record<StrategyType, string> = {
  structural: "直接拆分",
  causal: "因果链条",
  inverse: "反向视角",
  evolutionary: "时间演化",
  analogical: "类比联想",
  first_principles: "第一性原理",
  stakeholder: "利益博弈",
  second_order: "第二级效应",
  constraints: "极限测试",
  systems: "系统反馈"
};

const DEFAULT_SOURCE_LABEL = "自由提问";

const createChatMessage = (message: Omit<ChatMessageRecord, "id" | "createdAt">) => ({
  ...message,
  id: createId(),
  createdAt: Date.now()
});

const buildAssistantMarkdown = (response: {
  core_insight: string;
  analysis_blocks: { title: string; content: string }[];
  mental_model_tip: string;
  further_questions: string[];
}) => {
  const blocks = response.analysis_blocks.map((block) => `### ${block.title}\n${block.content}`);
  const questions = response.further_questions.map((item) => `- ${item}`).join("\n");
  return [
    `**${response.core_insight}**`,
    ...blocks,
    response.mental_model_tip ? `> ${response.mental_model_tip}` : null,
    response.further_questions.length > 0 ? `后续问题:\n${questions}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
};


type NodeDetailsPanelProps = {
  node: NodeRecord;
  pathContext: string[];
  onClose: () => void;
};

export function NodeDetailsPanel({
  node,
  pathContext,
  onClose
}: NodeDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePrompt, setActivePrompt] = useState<StrategyType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    setIsFullscreen(false);
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

  const selectedStrategy = activePrompt ?? "structural";

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

  const sendAssistantReply = async (payload: {
    strategy: StrategyType;
    intensity: number;
    question?: string;
  }) => {
    const fullPath =
      pathContext.length > 1 ? pathContext.slice(0, -1).join(" -> ") : pathContext[0] ?? node.title;
    
    // Fetch recent history from DB to ensure we have the latest user message
    const recentMessages = await db.chatMessages
      .where("[topicId+nodeId]")
      .equals([node.topicId, node.id])
      .sortBy("createdAt");
    
    // Take last 10 messages for context, format for API
    const history = recentMessages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // If we have a question/history, we don't need to append the question to the node title
    // The AI will see the user's last message in the history
    const currentNode = node.title;

    const response = await expandChatAction({
      full_path: fullPath,
      current_node: currentNode,
      strategy: payload.strategy,
      intensity: payload.intensity,
      history
    });
    const assistantMessage = createChatMessage({
      topicId: node.topicId,
      nodeId: node.id,
      role: "assistant",
      content: buildAssistantMarkdown(response)
    });
    await db.chatMessages.put(assistantMessage);
  };

  const handleSendPrompt = async (promptType: StrategyType) => {
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
      const depth = Math.min(pathContext.length + 1, 5);
      await sendAssistantReply({ strategy: promptType, intensity: depth });
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
      const depth = Math.min(pathContext.length + 1, 5);
      await sendAssistantReply({ strategy: selectedStrategy, intensity: depth, question: trimmed });
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
      <span className="flex items-center gap-2">
        <span>AI 正在生成</span>
        <span className="flex items-center gap-1">
          <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
          <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
          <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
        </span>
      </span>
    </div>
  );

  const renderErrorIndicator = (message: string) => (
    <p className="mt-3 text-xs text-amber-600">{message}</p>
  );

  return (
    <aside
      className={clsx(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-30 grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-sm border-t border-gray-200/80 bg-[#F9F9F7] shadow-[0_-18px_36px_rgba(0,0,0,0.12)]",
        isFullscreen ? "top-0 h-full rounded-none" : expanded ? "h-[75vh]" : "h-[33vh]"
      )}
    >
      <div className="flex items-start justify-between border-b border-gray-200/80 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="max-w-[70%]">
          <h3 className="line-clamp-1 font-serif text-2xl font-semibold text-ink" title={node.title}>
            {node.title}
          </h3>
          <p
            className="mt-2 line-clamp-2 text-sm text-gray-500"
            title={node.description || "暂无描述"}
          >
            {node.description || "暂无描述"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full border text-gray-500 transition hover:border-black hover:text-black",
              isFullscreen ? "cursor-not-allowed opacity-40" : "border-gray-200"
            )}
            disabled={isFullscreen}
            title="展开/收起"
          >
            <ChevronUp className={clsx("h-4 w-4 transition", expanded && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        <div className="space-y-6">
          {displayMessages.length === 0
            ? renderEmptyState()
            : displayMessages.map((message) => {
                const isUser = message.role === "user";
                const actionClass = clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition",
                  "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                );
                const nameClass = isUser ? "text-amber-700" : "text-sky-700";
                const contentClass = isUser ? "text-ink" : "text-gray-700";

                return (
                  <div key={message.id} className="group w-full border-b border-gray-200/70 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={clsx("text-[11px] uppercase tracking-[0.3em]", nameClass)}>
                          {isUser ? "读者" : "编辑部"}
                        </span>
                        {!isUser && message.sourceLabel && (
                          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                            {message.sourceLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {isUser ? (
                      <p className={clsx("mt-3 whitespace-pre-line text-sm leading-relaxed", contentClass)}>
                        {message.content}
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="border-l-2 border-ink/80 pl-4">
                          <Markdown content={message.content} className={clsx("space-y-4", contentClass)} />
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
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
                    {isLoading && isUser && message.id === lastUserMessageId && renderLoadingIndicator()}
                    {error && isUser && message.id === lastUserMessageId && renderErrorIndicator(error)}
                  </div>
                );
              })}
        </div>
      </div>
      <div className="border-t border-gray-200/80 bg-white/80 px-6 pt-6 pb-6 backdrop-blur">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROMPT_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => handleSendPrompt(tab.type)}
                disabled={isLoading}
                className={clsx(
                  "rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition",
                  activePrompt === tab.type
                    ? "border-black text-ink"
                    : "border-gray-200 text-gray-600 hover:border-black hover:text-ink",
                  isLoading && "cursor-not-allowed opacity-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="rounded-sm border border-gray-200 bg-[#FCFCFA] px-3 py-1.5 leading-none shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题"
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
