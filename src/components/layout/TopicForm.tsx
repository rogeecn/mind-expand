"use client";

import { useState } from "react";
import { analyzeTopicAction } from "@/app/actions/analyze-topic";

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
  const [senseOptions, setSenseOptions] = useState<string[]>([]);
  const [selectedSense, setSelectedSense] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!rootKeyword.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTopicAction({ rootTopic: rootKeyword.trim() });
      if (result.isAmbiguous) {
        setSenseOptions(result.senseOptions);
        setSelectedSense(null);
        setDescription("");
      } else {
        setSenseOptions([]);
        setSelectedSense(null);
        setDescription(result.constraints ?? "");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRootChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRootKeyword(event.target.value);
    setSenseOptions([]);
    setSelectedSense(null);
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
              disabled={isAnalyzing || !rootKeyword.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-gray-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing" : "AI Scope"}
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
                  className="flex cursor-pointer items-center gap-3 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-black hover:text-ink"
                >
                  <input
                    type="radio"
                    name="sense"
                    value={option}
                    checked={selectedSense === option}
                    onChange={async () => {
                      setSelectedSense(option);
                      setDescription("");
                      setIsAnalyzing(true);
                      try {
                        const result = await analyzeTopicAction({
                          rootTopic: rootKeyword.trim(),
                          selectedSense: option
                        });
                        setDescription(result.constraints ?? "");
                        setSenseOptions([]);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    className="h-4 w-4 border-gray-300 text-black"
                  />
                  <span>{option}</span>
                </label>
              ))}
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
          {isAnalyzing && (
            <p className="text-xs text-gray-400">AI 正在分析语义...</p>
          )}
        </div>

        <div className="pt-2">
          <button
            className="rounded-sm border border-ink px-8 py-3 font-medium text-ink transition hover:bg-ink hover:text-white"
            onClick={() => onSubmit({ rootKeyword, description })}
            type="button"
          >
            Create Topic
          </button>
        </div>
      </div>
    </div>
  );
}
