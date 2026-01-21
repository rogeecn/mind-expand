"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const StrategySchema = z.enum([
  "structural",
  "causal",
  "inverse",
  "evolutionary",
  "analogical",
  "first_principles",
  "stakeholder",
  "second_order",
  "constraints",
  "systems"
]);

const ExpandChatInputSchema = z.object({
  full_path: z.string(),
  current_node: z.string(),
  strategy: StrategySchema,
  intensity: z.number().min(1).max(5)
});

const ExpandChatOutputSchema = z.object({
  strategy_name: z.string(),
  core_insight: z.string(),
  analysis_blocks: z.array(z.object({ title: z.string(), content: z.string() })),
  mental_model_tip: z.string(),
  further_questions: z.array(z.string()),
  context_note: z.string().optional()
});

const defaultModelName = process.env.MODEL_DEFAULT_ID ?? "gpt-4o-mini";
const pluginName = "mind-expand";
const modelRefName = `${pluginName}/${defaultModelName}`;

const ai = genkit({
  promptDir: "./prompts",
  plugins: [
    openAI({
      name: pluginName,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL
    })
  ]
});

const strategyNameMap: Record<z.infer<typeof StrategySchema>, string> = {
  structural: "直接拆分",
  causal: "因果链条",
  inverse: "反向视角",
  evolutionary: "时间演化",
  analogical: "类比联想",
  first_principles: "第一性原理",
  stakeholder: "利益博弈",
  second_order: "第二级效应",
  constraints: "极限测试",
  systems: "系统反馈"
};

export async function expandChatAction(input: z.infer<typeof ExpandChatInputSchema>) {
  const parsed = ExpandChatInputSchema.parse(input);
  const prompt = ai.prompt("deep-analysis") as (
    payload: {
      full_path: string;
      current_node: string;
      strategy: z.infer<typeof StrategySchema>;
      intensity: number;
    },
    options: { model: string; output: { schema: typeof ExpandChatOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandChatOutputSchema> }>;
  const payload = {
    full_path: parsed.full_path,
    current_node: parsed.current_node,
    strategy: parsed.strategy,
    intensity: parsed.intensity
  };
  console.info("[ai:deep-analysis] request", {
    model: modelRefName,
    prompt: "deep-analysis",
    input: payload
  });
  const response = await prompt(
    payload,
    {
      model: modelRefName,
      output: { schema: ExpandChatOutputSchema }
    }
  );
  console.info("[ai:deep-analysis] response", response.output);

  return {
    ...ExpandChatOutputSchema.parse(response.output),
    strategy_name: response.output?.strategy_name || strategyNameMap[parsed.strategy]
  };
}
