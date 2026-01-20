"use client";

import { analyzeTopicAction } from "@/app/actions/analyze-topic";
import { useState } from "react";

export type TopicFormValues = {
  rootKeyword: string;
  description: string;
};

type TopicFormProps = {
  onSubmit: (values: TopicFormValues) => void;
};

export function TopicForm({ onSubmit }: TopicFormProps) {

  const [rootKeyword, setRootKeyword] = useState("");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [senseOptions, setSenseOptions] = useState<string[]>([]);
  const [selectedSenses, setSelectedSenses] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!rootKeyword.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTopicAction({ rootTopic: rootKeyword.trim() });
      if (result.isAmbiguous) {
        setSenseOptions(result.senseOptions);
        setSelectedSenses([]);
        setDescription("");
      } else {
        setSenseOptions([]);
        setSelectedSenses([]);
        setDescription(result.constraints ?? "");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmScopes = async () => {
    if (!rootKeyword.trim() || selectedSenses.length === 0) return;
    setIsConfirming(true);
    try {
      const result = await analyzeTopicAction({
        rootTopic: rootKeyword.trim(),
        selectedSenses
      });
      setDescription(result.constraints ?? "");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRootChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRootKeyword(event.target.value);
    setSenseOptions([]);
    setSelectedSenses([]);
  };

  const handleCreateTopic = () => {
    if (isAnalyzing || isConfirming) return;
    setIsConfirming(true);
    Promise.resolve(onSubmit({ rootKeyword, description }))
      .finally(() => setIsConfirming(false));
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="w-full max-w-3xl py-24">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">New Topic</p>
        <div className="mx-auto mt-6 h-px w-24 bg-gray-200" />
        <h2 className="mt-6 font-serif text-4xl font-semibold text-ink">
          Frame the question first.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-gray-600">
          Provide a root subject and let AI propose scope constraints to keep the
          mind map consistent.
        </p>
      </div>

      <div className="mt-10 space-y-6 text-left">
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
              {isAnalyzing ? "Analyzing" : "AI Scope"}
            </button>
          </div>
        </div>

        {senseOptions.length > 0 && (
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
              Select Scopes
            </label>
            <div className="grid gap-2">
              {senseOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-black hover:text-ink"
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
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>{option}</span>
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
                {isConfirming ? "Confirming" : "Confirm Scopes"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label
            className="text-[11px] uppercase tracking-[0.3em] text-gray-500"
            htmlFor="topic-description"
          >
            Description / Constraints
          </label>
          <textarea
            id="topic-description"
            name="topic-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe the scope, assumptions, or exclusions for this topic"
            className="min-h-[160px] w-full rounded-sm border border-gray-300 bg-white px-4 py-3 text-sm text-ink focus:border-black focus:outline-none"
          />
          {(isAnalyzing || isConfirming) && (
            <p className="text-xs text-gray-400">AI 正在分析语义...</p>
          )}
        </div>

        <div className="pt-2">
          <button
            className="rounded-sm border border-ink px-8 py-3 font-medium text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCreateTopic}
            type="button"
            disabled={isAnalyzing || isConfirming || !rootKeyword.trim()}
          >
            Create Topic
          </button>
        </div>
      </div>
    </div>
  );
}
