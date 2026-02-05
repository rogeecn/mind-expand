"use client";

import { useState } from "react";
import clsx from "clsx";
import { AutoTextarea } from "@/components/common/AutoTextarea";
import { useModelSettings } from "@/hooks/useModelSettings";
import { topicGuessAction } from "@/app/actions/topic-guess";
import { topicExtensionsAction, ExtensionItem } from "@/app/actions/topic-extensions";
import { topicRefineAction } from "@/app/actions/topic-refine";
import { ROLE_PRESETS, GOAL_PRESETS } from "@/lib/topic-presets";

export type TopicFormValues = {
  keywords: string[];
  role?: string;
  goal?: string;
  masterTitle?: string;
  description: string;
  globalConstraints?: string;
  suggestedFocus?: string[];
  selectedExtensions?: string[];
};

type TopicFormProps = {
  onSubmit: (values: TopicFormValues) => void;
  onRequireModelSettings: () => void;
  hasApiToken: boolean;
};

export function TopicForm({ onSubmit, onRequireModelSettings, hasApiToken }: TopicFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { modelConfig } = useModelSettings();

  const [roleId, setRoleId] = useState<string | undefined>();
  const [roleCustom, setRoleCustom] = useState("");
  const [goalId, setGoalId] = useState<string | undefined>();
  const [goalCustom, setGoalCustom] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const [masterTitle, setMasterTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [selectedExtensionIds, setSelectedExtensionIds] = useState<string[]>([]);

  const [refinedDescription, setRefinedDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [suggestedFocusText, setSuggestedFocusText] = useState("");

  const [isGuesserLoading, setIsGuesserLoading] = useState(false);
  const [isExtensionsLoading, setIsExtensionsLoading] = useState(false);
  const [isRefineLoading, setIsRefineLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const getKeywords = () => {
    return keywordsInput
      .split(/[,，\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
  };

  const getEffectiveRole = () => {
    if (roleId === "custom") return { role: roleCustom, description: undefined };
    const preset = ROLE_PRESETS.find((r) => r.id === roleId);
    return preset ? { role: preset.label, description: preset.description } : { role: undefined, description: undefined };
  };

  const getEffectiveGoal = () => {
    if (goalId === "custom") return { goal: goalCustom, description: undefined };
    const preset = GOAL_PRESETS.find((g) => g.id === goalId);
    return preset ? { goal: preset.label, description: preset.description } : { goal: undefined, description: undefined };
  };

  const handleStartExploration = async () => {
    if (!hasApiToken) {
      onRequireModelSettings();
      return;
    }
    const keywords = getKeywords();
    if (keywords.length === 0) return;

    setIsGuesserLoading(true);
    try {
      const { role, description: roleDesc } = getEffectiveRole();
      const { goal, description: goalDesc } = getEffectiveGoal();

      const guessResult = await topicGuessAction({
        keywords,
        role,
        role_description: roleDesc,
        goal,
        goal_description: goalDesc,
        modelConfig,
      });

      setMasterTitle(guessResult.title);
      setDescription(guessResult.description);
      setStep(2);

      fetchExtensions(guessResult.title, guessResult.description, keywords, role, roleDesc, goal, goalDesc);

    } catch (error) {
      console.error("Failed to guess topic:", error);
    } finally {
      setIsGuesserLoading(false);
    }
  };

  const fetchExtensions = async (
    title: string,
    desc: string,
    keywords: string[],
    role?: string,
    roleDesc?: string,
    goal?: string,
    goalDesc?: string
  ) => {
    if (!hasApiToken) {
      onRequireModelSettings();
      return;
    }
    setIsExtensionsLoading(true);
    setExtensions([]);
    try {
      const result = await topicExtensionsAction({
        title,
        description: desc,
        keywords,
        role,
        role_description: roleDesc,
        goal,
        goal_description: goalDesc,
        modelConfig,
      });
      setExtensions(result.extensions);
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    } finally {
      setIsExtensionsLoading(false);
    }
  };

  const handleGenerateConstraints = async () => {
    if (!hasApiToken) {
      onRequireModelSettings();
      return;
    }
    if (selectedExtensionIds.length === 0) return;

    setIsRefineLoading(true);
    try {
      const { role, description: roleDesc } = getEffectiveRole();
      const { goal, description: goalDesc } = getEffectiveGoal();
      const keywords = getKeywords();
      
      const selectedExtNames = extensions
        .filter(e => selectedExtensionIds.includes(e.id))
        .map(e => e.name);

      const result = await topicRefineAction({
        title: masterTitle,
        description,
        keywords,
        role,
        role_description: roleDesc,
        goal,
        goal_description: goalDesc,
        selected_extensions: selectedExtNames,
        modelConfig,
      });

      setRefinedDescription(result.refined_description);
      setConstraints(result.constraints);
      setSuggestedFocusText(result.suggested_focus.join("\n"));
      setStep(3);
    } catch (error) {
      console.error("Failed to refine topic:", error);
    } finally {
      setIsRefineLoading(false);
    }
  };

  const handleCreate = () => {
    if (!hasApiToken) {
      onRequireModelSettings();
      return;
    }
    setIsCreating(true);
    const focusPoints = suggestedFocusText.split("\n").map(s => s.trim()).filter(Boolean);
    const { role } = getEffectiveRole();
    const { goal } = getEffectiveGoal();

    const selectedExtNames = extensions
      .filter(e => selectedExtensionIds.includes(e.id))
      .map(e => e.name);

    onSubmit({
      keywords: getKeywords(),
      role: role,
      goal: goal,
      masterTitle,
      description: refinedDescription,
      globalConstraints: constraints,
      suggestedFocus: focusPoints,
      selectedExtensions: selectedExtNames,
    });
  };

  const renderRadioGroup = (
    label: string,
    options: typeof ROLE_PRESETS,
    selectedId: string | undefined,
    onSelect: (id: string) => void,
    customValue: string,
    onCustomChange: (val: string) => void
  ) => (
    <div className="mb-8">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={clsx(
                "px-4 py-2 rounded-sm text-sm font-medium transition-all border",
                isSelected
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              )}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          onClick={() => onSelect("custom")}
          className={clsx(
            "px-4 py-2 rounded-sm text-sm font-medium transition-all border",
            selectedId === "custom"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          )}
        >
          自定义
        </button>
      </div>
      {selectedId === "custom" && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="请输入自定义描述..."
            className="w-full border-b border-gray-300 py-2 font-serif text-lg text-ink focus:border-black focus:outline-none placeholder:text-gray-300"
            autoFocus
          />
        </div>
      )}
    </div>
  );

  if (step === 1) {
    const hasKeywords = keywordsInput.trim().length > 0;
    
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="font-serif text-5xl font-bold text-ink mb-12 text-center">
            Define your exploration
          </h1>

          {renderRadioGroup(
            "我是... (Role)",
            ROLE_PRESETS,
            roleId,
            setRoleId,
            roleCustom,
            setRoleCustom
          )}

          {renderRadioGroup(
            "我想要... (Goal)",
            GOAL_PRESETS,
            goalId,
            setGoalId,
            goalCustom,
            setGoalCustom
          )}

          <div className="mt-12">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              关于... (Keywords) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="输入关键词，用逗号分隔 (例如: AI, 机器学习)"
              rows={3}
              className="w-full border-b-2 border-gray-200 py-4 font-serif text-3xl text-ink placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="mt-16 flex justify-center">
            <button
              onClick={handleStartExploration}
              disabled={!hasKeywords || isGuesserLoading}
              className="bg-ink text-white px-10 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
            >
              {isGuesserLoading ? "Analyzing..." : "开始探索"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Step 2: Scope & Extensions</span>
          <button 
            onClick={() => setStep(1)}
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition"
          >
            Back
          </button>
        </div>

        <div className="mb-12 space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Title</label>
            <input
              value={masterTitle}
              onChange={(e) => setMasterTitle(e.target.value)}
              className="w-full font-serif text-4xl font-bold text-ink bg-transparent border-b border-transparent focus:border-gray-200 focus:outline-none placeholder-gray-300"
              placeholder="Topic Title"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Description</label>
            <AutoTextarea
              value={description}
              onValueChange={setDescription}
              className="w-full font-serif text-xl text-gray-700 bg-transparent border-l-2 border-transparent focus:border-gray-200 focus:outline-none pl-4 py-1"
              placeholder="Topic Description"
            />
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-2xl font-bold mb-6">Select Extensions <span className="text-sm font-sans font-normal text-gray-500 ml-2">(Choose at least 1)</span></h3>
          
          {isExtensionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extensions.map((ext) => {
                const isSelected = selectedExtensionIds.includes(ext.id);
                return (
                  <button
                    key={ext.id}
                    onClick={() => {
                      setSelectedExtensionIds(prev => 
                        isSelected ? prev.filter(id => id !== ext.id) : [...prev, ext.id]
                      );
                    }}
                    className={clsx(
                      "relative flex flex-col text-left p-6 rounded-sm border-2 transition-all duration-200 hover:shadow-lg h-full group",
                      isSelected
                        ? "border-black bg-ink text-white shadow-xl scale-[1.02]"
                        : "border-gray-100 bg-white text-ink hover:border-gray-300"
                    )}
                  >
                    <div className="mb-4">
                      <h4 className={clsx("font-serif text-xl font-bold mb-2", isSelected ? "text-white" : "text-ink")}>
                        {ext.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 opacity-80">
                        {ext.key_terms.slice(0, 3).map(term => (
                          <span key={term} className={clsx("text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border", isSelected ? "border-white/30 text-white" : "border-gray-200 text-gray-500")}>
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className={clsx("text-sm leading-relaxed mt-auto", isSelected ? "text-gray-300" : "text-gray-500")}>
                      {ext.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            onClick={handleGenerateConstraints}
            disabled={selectedExtensionIds.length === 0 || isRefineLoading}
            className="bg-ink text-white px-8 py-3 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isRefineLoading ? "Refining..." : "生成约束"}
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const { role } = getEffectiveRole();
    const { goal } = getEffectiveGoal();

    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Step 3: Refine & Launch</span>
          <button 
            onClick={() => setStep(2)}
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-sm mb-12 border border-gray-100">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">{masterTitle}</h2>
          <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            {role && <span>ROLE: <span className="text-ink">{role}</span></span>}
            {goal && <span>GOAL: <span className="text-ink">{goal}</span></span>}
            <span>KEYWORDS: <span className="text-ink">{getKeywords().join(", ")}</span></span>
          </div>
        </div>

        <div className="space-y-12">
          <section>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Core Description (Refined)
            </label>
            <AutoTextarea
              value={refinedDescription}
              onValueChange={setRefinedDescription}
              className="w-full font-serif text-lg leading-relaxed text-gray-800 bg-transparent border-l-2 border-gray-200 focus:border-black pl-4 py-2"
            />
          </section>

          <section>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Boundaries & Constraints
            </label>
            <AutoTextarea
              value={constraints}
              onValueChange={setConstraints}
              className="w-full font-sans text-base leading-relaxed text-gray-600 bg-transparent border-l-2 border-gray-200 focus:border-black pl-4 py-2"
            />
          </section>

          <section>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Suggested Focus (One per line)
            </label>
            <AutoTextarea
              value={suggestedFocusText}
              onValueChange={setSuggestedFocusText}
              className="w-full font-sans text-base leading-relaxed text-gray-600 bg-transparent border-l-2 border-gray-200 focus:border-black pl-4 py-2"
              placeholder="- Focus point 1..."
            />
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-ink text-white px-12 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black hover:scale-[1.02] transition-all shadow-xl disabled:opacity-70"
          >
            {isCreating ? "Creating..." : "创建思维导图"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
