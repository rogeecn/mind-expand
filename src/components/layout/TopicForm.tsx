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

    const handleAnalyze = async () => {
    if (!rootKeyword.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTopicAction({ rootTopic: rootKeyword.trim() });
      setDescription(result.constraints);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRootChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRootKeyword(event.target.value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="w-full max-w-2xl space-y-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">New Topic</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-ink">
          Frame the question first.
        </h2>
        <p className="mt-4 text-sm text-gray-600">
          Provide a root subject and let AI propose scope constraints to keep the
          mind map consistent.
        </p>
      </div>
      <div className="space-y-3 text-left">
        <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Topic
        </label>
        <div className="relative">
          <input
            value={rootKeyword}
            onChange={handleRootChange}
            placeholder="Enter a root topic"
            className="w-full rounded-sm border border-gray-300 bg-white px-4 py-3 pr-16 text-lg text-ink focus:border-black focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-gray-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing" : "AI"}
          </button>
        </div>
      </div>
      <div className="space-y-3 text-left">
        <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Description / Constraints
        </label>
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Describe the scope, assumptions, or exclusions for this topic"
          className="min-h-[140px] w-full rounded-sm border border-gray-300 bg-white px-4 py-3 text-sm text-ink focus:border-black focus:outline-none"
        />
      </div>
      <div className="flex justify-center gap-3">
        <button
          className="rounded-sm border border-ink px-6 py-3 font-medium text-ink transition hover:bg-ink hover:text-white"
          onClick={() => onSubmit({ rootKeyword, description })}
          type="button"
        >
          Create Topic
        </button>
      </div>
    </div>
  );
}
