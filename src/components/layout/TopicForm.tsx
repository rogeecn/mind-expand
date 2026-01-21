"use client";

import {
  rootConsolidationAction,
  rootDisambiguationAction
} from "@/app/actions/analyze-topic";
import { useState } from "react";

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
  const [suggestedFocus, setSuggestedFocus] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [senseOptions, setSenseOptions] = useState<string[]>([]);
  const [senseDescriptions, setSenseDescriptions] = useState<Record<string, string>>({});
  const [senseKeyTerms, setSenseKeyTerms] = useState<Record<string, string[]>>({});
  const [selectedSenses, setSelectedSenses] = useState<string[]>([]);

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
      setSuggestedFocus([]);
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
      setSuggestedFocus(result.suggested_focus ?? []);
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
    setSuggestedFocus([]);
  };

  const handleCreateTopic = () => {
    if (isAnalyzing || isConfirming) return;
    const combinedDescription = [
      description.trim(),
      globalConstraints ? `\n\n约束范围：\n${globalConstraints}` : "",
      suggestedFocus.length > 0 ? `\n\n建议方向：\n- ${suggestedFocus.join("\n- ")}` : ""
    ]
      .join("")
      .trim();

    setIsConfirming(true);
    Promise.resolve(
      onSubmit({
        rootKeyword,
        description: combinedDescription,
        masterTitle,
        globalConstraints,
        suggestedFocus
      })
    ).finally(() => setIsConfirming(false));
  };


  return (
    <div className="w-full max-w-3xl py-24">
       <div className="text-center">
         <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">新建主题</p>
         <div className="mx-auto mt-6 h-px w-24 bg-gray-200" />
         <h2 className="mt-6 font-serif text-4xl font-semibold text-ink">
           两步生成你的主题约束
         </h2>
         <p className="mx-auto mt-4 max-w-xl text-sm text-gray-600">
           先提取二义性信息，再基于选择生成方向性描述与约束。
         </p>
       </div>


       <div className="mt-10 space-y-6 text-left overflow-y-auto max-h-[70vh] pr-1">
         {(isAnalyzing || isConfirming) && (
           <p className="text-xs text-gray-400">AI 正在分析语义...</p>
         )}

        <div className="space-y-3">
          <label
            className="text-[11px] uppercase tracking-[0.3em] text-gray-500"
            htmlFor="topic-root"
          >
            Topic
          </label>
          <div className="relative">
            <input
              id="topic-root"
              name="topic-root"
              value={rootKeyword}
              onChange={handleRootChange}
              placeholder="Enter a root topic"
              className="w-full rounded-sm border border-gray-300 bg-white px-4 py-3 pr-24 text-lg text-ink focus:border-black focus:outline-none"
            />
             <button
               type="button"
               onClick={handleAnalyze}
               disabled={isAnalyzing || isConfirming || !rootKeyword.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-gray-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
             >
               {isAnalyzing ? "提取中" : "提取二义性"}
             </button>

          </div>
        </div>

        {senseOptions.length > 0 && (
          <div className="space-y-3">
             <label className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
               选择语义
             </label>

            <div className="grid gap-2">
                {senseOptions.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-start gap-3 rounded-sm border border-gray-200 px-3 py-3 text-sm text-gray-600 transition hover:border-black hover:text-ink"
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
             <div className="pt-1">
               <button
                 type="button"
                 onClick={handleConfirmScopes}
                 disabled={isConfirming || selectedSenses.length === 0}
                 className="rounded-sm border border-gray-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
               >
                 {isConfirming ? "生成中" : "生成约束"}
               </button>
             </div>

          </div>
        )}

          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
              主旨描述
            </label>
            <div className="rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
              {description || "等待生成主旨描述。"}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
              方向性约束
            </label>
            <div className="rounded-sm border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {globalConstraints || "等待生成方向性约束。"}
            </div>
          </div>
          {suggestedFocus.length > 0 && (
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
                建议方向
              </label>
              <div className="rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                <ul className="space-y-2">
                  {suggestedFocus.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}



        <div className="pt-2">
           <button
             className="rounded-sm border border-ink px-8 py-3 font-medium text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
             onClick={handleCreateTopic}
             type="button"
             disabled={
               isAnalyzing ||
               isConfirming ||
               !rootKeyword.trim() ||
               !description ||
               !globalConstraints
             }
           >
             创建主题
           </button>

        </div>
      </div>
    </div>
  );
}
