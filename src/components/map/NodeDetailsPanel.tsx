"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronUp, Copy, X } from "lucide-react";
import type { NodeRecord } from "@/lib/db";
import { expandConceptAction } from "@/app/actions/expand-concept";
import { createId } from "@/lib/uuid";

type PromptType = "direct" | "cause" | "counter" | "timeline" | "analogy";

const PROMPT_TABS: { type: PromptType; label: string }[] = [
  { type: "direct", label: "直接拆分" },
  { type: "cause", label: "因果链条" },
  { type: "counter", label: "反向视角" },
  { type: "timeline", label: "时间演化" },
  { type: "analogy", label: "类比联想" }
];

type PromptResult = {
  id: string;
  promptType: PromptType;
  idea: string;
  insight: string;
  createdAt: number;
};

type NodeDetailsPanelProps = {
  node: NodeRecord;
  rootTopic: string;
  pathContext: string[];
  onClose: () => void;
};

export function NodeDetailsPanel({
  node,
  rootTopic,
  pathContext,
  onClose
}: NodeDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptType>("direct");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PromptResult[]>([]);

  useEffect(() => {
    setResults([]);
    setActivePrompt("direct");
  }, [node.id]);

  const handleGenerate = async (promptType: PromptType) => {
    if (isLoading) return;
    setActivePrompt(promptType);
    setIsLoading(true);
    try {
      const response = await expandConceptAction({
        rootTopic,
        pathContext,
        nodeTitle: node.title,
        nodeDescription: node.description,
        promptType
      });
      setResults((prev) => [
        ...prev,
        {
          id: createId(),
          promptType,
          idea: response.idea,
          insight: response.insight,
          createdAt: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (idea: string, insight: string) => {
    try {
      await navigator.clipboard.writeText(`${idea}\n${insight}`);
    } catch (error) {
      console.error("Failed to copy prompt result", error);
    }
  };

  const handleDeleteResult = (resultId: string) => {
    setResults((prev) => prev.filter((item) => item.id !== resultId));
  };

  return (
    <aside
      className={clsx(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-30 rounded-t-sm border-t border-gray-200 bg-white shadow-[0_-12px_30px_rgba(0,0,0,0.12)]",
        expanded ? "h-[75vh]" : "h-[33vh]"
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Details</p>
          <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{node.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <ChevronUp
              className={clsx("h-4 w-4 transition", expanded && "rotate-180")}
            />
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
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Context</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {node.description || "暂无描述"}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">Prompts</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_TABS.map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => handleGenerate(tab.type)}
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
          </div>

          <div className="mt-6 space-y-4">
            {results.length === 0 && (
              <p className="text-sm text-gray-400">点击上方按钮生成联想内容。</p>
            )}
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-sm border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
                      {PROMPT_TABS.find((tab) => tab.type === result.promptType)?.label}
                    </p>
                    <h4 className="mt-2 font-serif text-lg font-semibold text-ink">
                      {result.idea}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(result.idea, result.insight)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
                      title="复制"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResult(result.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
                      title="删除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {result.insight}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200 px-6 py-3 text-xs uppercase tracking-[0.3em] text-gray-400">
          {isLoading ? "AI 正在生成..." : "AI expansion ready"}
        </div>
      </div>
    </aside>
  );
}
