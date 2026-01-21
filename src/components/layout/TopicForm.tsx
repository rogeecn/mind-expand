"use client";

import {
  rootConsolidationAction,
  rootDisambiguationAction
} from "@/app/actions/analyze-topic";
import { useEffect, useRef, useState } from "react";

export type TopicFormValues = {
  rootKeyword: string;
  description: string;
  masterTitle?: string;
  globalConstraints?: string;
  suggestedFocus?: string[];
};

type TopicFormProps = {
  onSubmit: (values: TopicFormValues) => void;
};

export function TopicForm({ onSubmit }: TopicFormProps) {

  const [rootKeyword, setRootKeyword] = useState("");
  const [description, setDescription] = useState("");
  const [masterTitle, setMasterTitle] = useState<string | undefined>();
  const [globalConstraints, setGlobalConstraints] = useState<string | undefined>();
  const [suggestedFocusText, setSuggestedFocusText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [senseOptions, setSenseOptions] = useState<string[]>([]);
  const [senseDescriptions, setSenseDescriptions] = useState<Record<string, string>>({});
  const [senseKeyTerms, setSenseKeyTerms] = useState<Record<string, string[]>>({});
  const [selectedSenses, setSelectedSenses] = useState<string[]>([]);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const constraintsRef = useRef<HTMLTextAreaElement | null>(null);
  const focusRef = useRef<HTMLTextAreaElement | null>(null);

  const handleAnalyze = async () => {
    if (!rootKeyword.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await rootDisambiguationAction({ root_keyword: rootKeyword.trim() });
      const options = result.potential_contexts.map((item) => item.context_name);
      const descriptionMap = result.potential_contexts.reduce<Record<string, string>>((acc, item) => {
        acc[item.context_name] = item.description;
        return acc;
      }, {});
      const keyTermsMap = result.potential_contexts.reduce<Record<string, string[]>>((acc, item) => {
        acc[item.context_name] = item.key_terms;
        return acc;
      }, {});
      setSenseOptions(options);
      setSenseDescriptions(descriptionMap);
      setSenseKeyTerms(keyTermsMap);
      setSelectedSenses([]);
      setDescription("");
      setMasterTitle(undefined);
      setGlobalConstraints(undefined);
      setSuggestedFocusText("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmScopes = async () => {
    if (!rootKeyword.trim() || selectedSenses.length === 0) return;
    setIsConfirming(true);
    try {
      const result = await rootConsolidationAction({
        root_keyword: rootKeyword.trim(),
        selected_contexts: selectedSenses
      });
      setDescription(result.master_description ?? "");
      setMasterTitle(result.master_title);
      setGlobalConstraints(result.global_constraints);
      setSuggestedFocusText((result.suggested_focus ?? []).join("\n"));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRootChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRootKeyword(event.target.value);
    setSenseOptions([]);
    setSenseDescriptions({});
    setSenseKeyTerms({});
    setSelectedSenses([]);
    setMasterTitle(undefined);
    setGlobalConstraints(undefined);
    setSuggestedFocusText("");
  };

  const handleCreateTopic = () => {
    if (isAnalyzing || isConfirming || isCreating) return;
    const parsedSuggestedFocus = suggestedFocusText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const combinedDescription = [
      description.trim(),
      globalConstraints ? `\n\n约束范围：\n${globalConstraints}` : "",
      parsedSuggestedFocus.length > 0 ? `\n\n建议方向：\n- ${parsedSuggestedFocus.join("\n- ")}` : ""
    ]
      .join("")
      .trim();

    setIsCreating(true);
    Promise.resolve(
      onSubmit({
        rootKeyword,
        description: combinedDescription,
        masterTitle,
        globalConstraints,
        suggestedFocus: parsedSuggestedFocus
      })
    ).finally(() => setIsCreating(false));
  };

  const resizeTextarea = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    element.style.overflowY = "hidden";
  };

  useEffect(() => {
    resizeTextarea(descriptionRef.current);
  }, [description]);

  useEffect(() => {
    resizeTextarea(constraintsRef.current);
  }, [globalConstraints]);

  useEffect(() => {
    resizeTextarea(focusRef.current);
  }, [suggestedFocusText]);

  const hasAnalyzed = senseOptions.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="text-left">
          {hasAnalyzed ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setRootKeyword("");
                  setSenseOptions([]);
                  setSenseDescriptions({});
                  setSenseKeyTerms({});
                  setSelectedSenses([]);
                  setDescription("");
                  setMasterTitle(undefined);
                  setGlobalConstraints(undefined);
                  setSuggestedFocusText("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
                title="重新开始"
              >
                <span className="text-xs">↩</span>
              </button>
              <h2 className="font-serif text-3xl font-semibold text-ink">{rootKeyword}</h2>
            </div>
          ) : (
            <h2 className="font-serif text-4xl font-semibold text-ink">
              输入主题并开始分析
            </h2>
          )}
          <div className="mt-6 h-px w-24 bg-gray-200" />
        </div>

      <div className="mt-12 space-y-10 text-left">
        {!hasAnalyzed && (
          <section className="space-y-4">
            <div>
              <input
                id="topic-root"
                name="topic-root"
                value={rootKeyword}
                onChange={handleRootChange}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (!rootKeyword.trim() || isAnalyzing || isConfirming) return;
                  void handleAnalyze();
                }}
                placeholder="输入主题关键词并回车分析"
                className="w-full rounded-sm border border-gray-300 bg-white px-4 py-3 text-lg text-ink focus:border-black focus:outline-none"
              />
              {(isAnalyzing || isConfirming) && (
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">
                  AI 正在分析语义...
                </p>
              )}
            </div>
          </section>
        )}

        {hasAnalyzed && !globalConstraints && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-serif text-xl text-ink">选择语义并生成约束</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                {senseOptions.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-start gap-3 border-b border-gray-200/80 py-3 text-sm text-gray-600 transition hover:text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSenses.includes(option)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        let newSenses: string[];

                        if (isChecked) {
                          newSenses = [...selectedSenses, option];
                        } else {
                          newSenses = selectedSenses.filter((sense) => sense !== option);
                        }

                        setSelectedSenses(newSenses);
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-ink">{option}</p>
                      {senseDescriptions[option] && (
                        <p className="text-xs text-gray-500">{senseDescriptions[option]}</p>
                      )}
                      {senseKeyTerms[option]?.length ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          关键词: {senseKeyTerms[option].join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmScopes}
                disabled={isConfirming || selectedSenses.length === 0}
                className="rounded-sm border border-gray-300 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConfirming ? "生成中" : "生成约束"}
              </button>
            </div>
          </section>
        )}

        {(globalConstraints || description || masterTitle || suggestedFocusText.length > 0) && (
          <section className="space-y-8">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">主标题</p>
              <input
                value={masterTitle ?? ""}
                onChange={(event) => setMasterTitle(event.target.value)}
                placeholder="输入主标题"
                className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-base text-ink focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">主旨描述</p>
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="补充主旨描述"
                rows={1}
                className="w-full resize-none rounded-sm border border-gray-300 bg-white px-3 py-2 text-base text-gray-800 focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">方向性约束</p>
              <textarea
                ref={constraintsRef}
                value={globalConstraints ?? ""}
                onChange={(event) => setGlobalConstraints(event.target.value)}
                placeholder="补充约束或范围"
                rows={1}
                className="w-full resize-none rounded-sm border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">建议方向</p>
              <textarea
                ref={focusRef}
                value={suggestedFocusText}
                onChange={(event) => setSuggestedFocusText(event.target.value)}
                placeholder="每行一条建议方向"
                rows={1}
                className="w-full resize-none rounded-sm border border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              {isCreating && (
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
                  <span>正在创建主题...</span>
                </div>
              )}
              <button
                className="rounded-sm border border-ink px-8 py-3 font-medium text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCreateTopic}
                type="button"
                disabled={
                  isAnalyzing ||
                  isConfirming ||
                  isCreating ||
                  !rootKeyword.trim() ||
                  !description ||
                  !globalConstraints
                }
              >
                {isCreating ? "创建中" : "创建主题"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
