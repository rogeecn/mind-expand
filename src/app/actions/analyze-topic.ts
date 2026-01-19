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
    "你是一名主题范围分析助手，必须使用中文回复。",
    `主题: ${rootTopic}`,
    "输出1-2句中文约束说明，用于限定主题范围，避免歧义。",
    "只返回 JSON，包含字段 constraints。"
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
