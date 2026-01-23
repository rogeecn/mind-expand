"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { ChevronUp, Copy, Maximize2, Minimize2, X, MessageSquare, ArrowRight, Trash2 } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import { db, type ChatMessageRecord, type NodeRecord } from "@/lib/db";
import { expandChatAction } from "@/app/actions/expand-chat";
import { createId } from "@/lib/uuid";

// ... StrategyType and PROMPT_TABS definitions remain the same ...
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
    response.further_questions.length > 0 ? `### 后续思考\n${questions}` : null
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
  // Mode: 'summary' (default, compact) | 'chat' (expanded, interactive)
  const [viewMode, setViewMode] = useState<"summary" | "chat">("summary");
  const [expanded, setExpanded] = useState(false); // Controls height in Chat mode
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

  // Reset state when node changes
  useEffect(() => {
    setDraft("");
    setIsLoading(false);
    setError(null);
    setActivePrompt(null);
    setIsFullscreen(false);
    // Reset to summary mode when switching nodes, unless we want to persist the "chatting" state?
    // Let's reset to summary for "Editorial" feel (clean slate).
    setViewMode("summary"); 
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

  // ... sendAssistantReply implementation ...
  const sendAssistantReply = async (payload: {
    strategy: StrategyType;
    intensity: number;
    question?: string;
    includeHistory?: boolean;
  }) => {
    const fullPath =
      pathContext.length > 1 ? pathContext.slice(0, -1).join(" -> ") : pathContext[0] ?? node.title;

    let history: { role: string; content: string }[] | undefined;
    if (payload.includeHistory !== false) {
      const recentMessages = await db.chatMessages
        .where("[topicId+nodeId]")
        .equals([node.topicId, node.id])
        .sortBy("createdAt");

      history = recentMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    const currentNode = node.title;

    const response = await expandChatAction({
      mode: payload.question ? "intent" : "strategy",
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
      await sendAssistantReply({ strategy: promptType, intensity: depth, includeHistory: false });
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
      await sendAssistantReply({ strategy: selectedStrategy, intensity: depth, question: trimmed, includeHistory: true });
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

  const handleDeleteNode = async () => {
     // Optional: Call a prop to delete node, but currently logic is in MapCanvas.
     // We can just close for now or implement delete context if passed.
     // For safety, let's just Close.
     onClose();
  };


  // --- Render Modes ---

  if (viewMode === "summary") {
    return (
      <aside className="pointer-events-auto absolute bottom-8 left-1/2 z-30 w-[500px] max-w-[90vw] -translate-x-1/2 rounded-sm border border-gray-200 bg-white/95 px-6 py-5 shadow-xl backdrop-blur transition-all duration-300">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
             <div className="font-sans text-xs leading-relaxed text-gray-600 whitespace-pre-line">
               {node.description || "无额外描述"}
             </div>
          </div>
          <div className="flex flex-col gap-3 shrink-0 pt-1 border-l border-gray-100 pl-4">
             <button
               onClick={() => setViewMode("chat")}
               className="flex items-center gap-2 text-ink hover:text-black transition group"
               title="进入研讨"
             >
               <MessageSquare className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest group-hover:underline">研讨</span>
             </button>
             <button
               onClick={onClose}
               className="flex items-center gap-2 text-gray-400 hover:text-red-600 transition group"
               title="关闭"
             >
               <X className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest group-hover:underline">关闭</span>
             </button>
          </div>
        </div>
      </aside>
    );
  }

  // Chat Mode
  return (
    <aside
      className={clsx(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-30 grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-t border-gray-900 bg-[#F9F9F7] transition-all duration-300 ease-in-out",
        isFullscreen ? "top-0 h-full" : expanded ? "h-[75vh]" : "h-[45vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-[#F9F9F7] px-6 py-3">
        <div className="flex items-center gap-4 max-w-[70%]">
          <h3 className="line-clamp-1 font-serif text-xl font-bold tracking-tight text-ink">
            {node.title}
          </h3>
          <span className="h-4 w-px bg-gray-300"></span>
          <span className="text-xs font-sans text-gray-500 uppercase tracking-wider">研讨模式</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode("summary")}
            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black hover:underline"
          >
            返回摘要
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-black transition"
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={clsx(
              "flex h-8 w-8 items-center justify-center text-gray-400 hover:text-black transition",
              isFullscreen ? "opacity-20 cursor-not-allowed" : ""
            )}
            disabled={isFullscreen}
            title="展开/收起"
          >
            <ChevronUp className={clsx("h-4 w-4 transition duration-300", expanded && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-red-600 transition"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="min-h-0 overflow-y-auto px-6 py-6 bg-white">
        <div className="space-y-8 max-w-4xl mx-auto">
          {displayMessages.length === 0 ? (
            <div className="text-center py-12">
               <p className="font-serif text-xl italic text-gray-400 mb-2">"思考是灵魂的自我对话"</p>
               <p className="text-sm text-gray-400 font-sans">选择下方策略，开始深入研讨。</p>
            </div>
          ) : (
            displayMessages.map((message) => {
                const isUser = message.role === "user";
                const actionClass = clsx(
                  "flex h-6 w-6 items-center justify-center border text-[10px] transition",
                  "border-gray-100 text-gray-400 hover:border-gray-900 hover:text-gray-900"
                );
                
                return (
                  <div key={message.id} className="group w-full pb-2">
                    <div className="flex items-baseline justify-between gap-4 mb-3 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-3">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-[0.2em]", isUser ? "text-amber-800" : "text-black")}>
                          {isUser ? "读者" : "编辑部"}
                        </span>
                        {!isUser && message.sourceLabel && (
                          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-sm">
                            {message.sourceLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleCopy(message.content)} className={actionClass} title="复制"><Copy className="h-3 w-3" /></button>
                         <button onClick={() => handleDeleteMessage(message.id)} className={actionClass} title="删除"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    
                    {isUser ? (
                      <p className="font-serif text-lg leading-relaxed text-ink pl-4 border-l-2 border-amber-200">
                        {message.content}
                      </p>
                    ) : (
                      <div className="pl-4">
                        <Markdown content={message.content} />
                      </div>
                    )}
                    
                    {isLoading && isUser && message.id === lastUserMessageId && (
                       <div className="mt-4 pl-4 text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
                         撰写中...
                       </div>
                    )}
                    {error && isUser && message.id === lastUserMessageId && (
                       <p className="mt-2 text-xs text-red-600">{error}</p>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="border-t border-gray-200 bg-[#F9F9F7] px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {PROMPT_TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => handleSendPrompt(tab.type)}
                disabled={isLoading}
                className={clsx(
                  "border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all",
                  activePrompt === tab.type
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-500 hover:border-black hover:text-black",
                  isLoading && "cursor-not-allowed opacity-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题..."
              rows={1}
              className="w-full resize-none bg-white border border-gray-300 p-4 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors"
            />
            <button
               onClick={handleSendMessage}
               disabled={!draft.trim() || isLoading}
               className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-black disabled:opacity-30 disabled:hover:text-gray-400 transition"
            >
               <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

