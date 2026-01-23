"use client";

import {
  rootConsolidationAction,
  rootDisambiguationAction
} from "@/app/actions/analyze-topic";
import clsx from "clsx";
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

  const [step, setStep] = useState<1 | 2 | 3>(1);

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
      setStep(2); // Go to Step 2
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
      setStep(3); // Go to Step 3
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSenseOptions([]);
    setSelectedSenses([]);
  };

  const handleBackToStep2 = () => {
    setStep(2);
    // Keep selections
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

  // --- RENDER STEPS ---

  // STEP 1: THE PITCH
  if (step === 1) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          <h1 className="font-serif text-5xl font-bold text-ink mb-2">What is on your mind?</h1>
          <p className="font-sans text-gray-500 mb-12 uppercase tracking-widest text-xs">Start your exploration</p>
          
          <div className="relative group">
            <input
              id="topic-root"
              name="topic-root"
              value={rootKeyword}
              onChange={(e) => setRootKeyword(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                   event.preventDefault();
                   void handleAnalyze();
                }
              }}
              placeholder="Type a concept..."
              className="w-full border-b-2 border-gray-200 bg-transparent py-4 text-center font-serif text-4xl text-ink placeholder-gray-300 focus:border-black focus:outline-none transition-all"
              autoFocus
            />
            {isAnalyzing && (
              <div className="absolute left-0 right-0 -bottom-8 text-center">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400 animate-pulse">Analyzing Semantics...</span>
              </div>
            )}
          </div>
          
          <div className="mt-12 transition-opacity duration-500 delay-200" style={{ opacity: rootKeyword ? 1 : 0 }}>
             <button
               onClick={handleAnalyze}
               disabled={isAnalyzing || !rootKeyword.trim()}
               className="bg-ink text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Begin
             </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: THE SCOPE (Context Selection)
  if (step === 2) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Define Context</h2>
            <p className="text-gray-500 font-sans text-sm">Which aspects of <strong className="text-ink">"{rootKeyword}"</strong> are relevant?</p>
          </div>
          <button onClick={handleBackToStep1} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition">
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {senseOptions.map((option) => {
             const isSelected = selectedSenses.includes(option);
             return (
              <button
                key={option}
                onClick={() => {
                  const newSenses = isSelected
                    ? selectedSenses.filter(s => s !== option)
                    : [...selectedSenses, option];
                  setSelectedSenses(newSenses);
                }}
                className={clsx(
                  "relative flex flex-col text-left p-6 rounded-sm border-2 transition-all duration-200 hover:shadow-lg h-full group",
                  isSelected
                    ? "border-black bg-ink text-white shadow-xl scale-[1.02]"
                    : "border-gray-100 bg-white text-ink hover:border-gray-300"
                )}
              >
                <div className="mb-4">
                  <h3 className={clsx("font-serif text-xl font-bold mb-2 group-hover:underline", isSelected ? "text-white" : "text-ink")}>
                    {option}
                  </h3>
                  {senseKeyTerms[option]?.length ? (
                    <div className="flex flex-wrap gap-1.5 opacity-80">
                      {senseKeyTerms[option].slice(0, 3).map(term => (
                        <span key={term} className={clsx("text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border", isSelected ? "border-white/30 text-white" : "border-gray-200 text-gray-500")}>
                          {term}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                
                <p className={clsx("text-sm leading-relaxed mt-auto", isSelected ? "text-gray-300" : "text-gray-500")}>
                  {senseDescriptions[option]}
                </p>

                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
             );
          })}
        </div>

        <div className="mt-12 flex justify-end">
           <button
             onClick={handleConfirmScopes}
             disabled={isConfirming || selectedSenses.length === 0}
             className="flex items-center gap-3 bg-ink text-white px-10 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
           >
             {isConfirming ? (
               <>
                 <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                 Synthesizing...
               </>
             ) : (
               "Generate Scope"
             )}
           </button>
        </div>
      </div>
    );
  }

  // STEP 3: THE DEFINITION (Review & Create)
  if (step === 3) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
         <div className="flex items-center justify-between mb-12 border-b border-gray-200 pb-6">
           <div>
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2 block">Project Definition</span>
             <h1 className="font-serif text-4xl font-black text-ink">
               {masterTitle || rootKeyword}
             </h1>
           </div>
           <button onClick={handleBackToStep2} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition">
             Back
           </button>
         </div>

         <div className="space-y-12">
             <section>
               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                 Core Thesis
               </label>
               <textarea
                 ref={descriptionRef}
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 className="w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-gray-800 focus:outline-none border-l-2 border-transparent focus:border-gray-200 pl-0 focus:pl-4 transition-all"
                 placeholder="Enter description..."
                 rows={3}
               />
             </section>

             <section>
               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                  Boundaries & Constraints
               </label>
               <textarea
                 ref={constraintsRef}
                 value={globalConstraints ?? ""}
                 onChange={(e) => setGlobalConstraints(e.target.value)}
                 className="w-full resize-none bg-transparent font-sans text-base leading-relaxed text-gray-600 focus:outline-none border-l-2 border-transparent focus:border-gray-200 pl-0 focus:pl-4 transition-all"
                 placeholder="Enter constraints..."
                 rows={3}
               />
             </section>

             <section>
               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                 Suggested Focus
               </label>
               <textarea
                  ref={focusRef}
                  value={suggestedFocusText}
                  onChange={(e) => setSuggestedFocusText(e.target.value)}
                  className="w-full resize-none bg-transparent font-sans text-base leading-relaxed text-gray-600 focus:outline-none border-l-2 border-transparent focus:border-gray-200 pl-0 focus:pl-4 transition-all"
                  placeholder="Enter focus points..."
                  rows={4}
               />
             </section>
         </div>

         <div className="mt-16 pt-8 border-t border-gray-200 flex justify-end">
            <button
               onClick={handleCreateTopic}
               disabled={isCreating}
               className="bg-ink text-white px-12 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black hover:scale-[1.02] transition-all shadow-xl disabled:opacity-70 disabled:scale-100"
            >
              {isCreating ? "Initializing..." : "Initialize Mind Map"}
            </button>
         </div>
      </div>
    );
  }

  return null; // Should not happen
}
