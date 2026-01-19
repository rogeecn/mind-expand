"use server";

import { z } from "zod";
import { genkit } from "genkit";
import openAI from "@genkit-ai/compat-oai";

const AnalyzeInputSchema = z.object({
  rootTopic: z.string(),
  selectedSense: z.string().optional()
});

const AnalyzeOutputSchema = z.object({
  senseOptions: z.array(z.string()),
  constraints: z.string().nullable().optional(),
  isAmbiguous: z.boolean()
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

const analyzePrompt = ({
  rootTopic,
  selectedSense
}: z.infer<typeof AnalyzeInputSchema>) => {
  if (selectedSense) {
    return [
      "你是一名主题范围分析助手，必须使用中文回复。",
      `主题: ${rootTopic}`,
      `已选择语义: ${selectedSense}`,
      "输出1-2句中文约束说明，用于限定主题范围，避免歧义。",
      "仅返回 JSON，字段: senseOptions(数组), constraints(字符串), isAmbiguous(布尔false)。"
    ].join("\n");
  }

  return [
    "你是一名主题范围分析助手，必须使用中文回复。",
    `主题: ${rootTopic}`,
    "如果存在语义歧义，请输出3-6个语义选项（中文短语），不要生成约束。",
    "如果没有明显歧义，则输出1-2句中文约束说明。",
    "仅返回 JSON，字段: senseOptions(数组), constraints(字符串, 可空), isAmbiguous(布尔)。"
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
