"use server";

import { z } from "zod";
import { genkit } from "genkit";
import openAI from "@genkit-ai/compat-oai";

const AnalyzeInputSchema = z.object({
  rootTopic: z.string()
});

const AnalyzeOutputSchema = z.object({
  constraints: z.string()
});

const pluginName = "mind-expand";
const defaultModelName = process.env.MODEL_DEFAULT_ID ?? "gpt-4o-mini";
const modelRefName = `${pluginName}/${defaultModelName}`;

const ai = genkit({
  plugins: [
    openAI({
      name: pluginName,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL
    })
  ]
});

const analyzePrompt = ({ rootTopic }: z.infer<typeof AnalyzeInputSchema>) => {
  return [
    "You are an assistant that scopes and constrains a mind map topic.",
    `Topic: ${rootTopic}`,
    "Return a concise constraint statement (1-2 sentences) that narrows the domain and avoids ambiguity.",
    "Output JSON with field 'constraints'."
  ].join("\n");
};

export async function analyzeTopicAction(input: z.infer<typeof AnalyzeInputSchema>) {
  const parsed = AnalyzeInputSchema.parse(input);
  const response = await ai.generate({
    model: modelRefName,
    prompt: analyzePrompt(parsed),
    output: { schema: AnalyzeOutputSchema }
  });

  return AnalyzeOutputSchema.parse(response.output);
}
