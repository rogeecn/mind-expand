"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

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

const ChatHistorySchema = z.array(
  z.object({
    role: z.string(),
    content: z.string()
  })
);

const ExpandChatInputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("strategy"),
    full_path: z.string(),
    current_node: z.string(),
    strategy: StrategySchema,
    intensity: z.number().min(1).max(5),
    history: ChatHistorySchema.optional(),
    modelConfig: ModelConfigSchema.optional()
  }),
  z.object({
    mode: z.literal("intent"),
    full_path: z.string(),
    current_node: z.string(),
    intensity: z.number().min(1).max(5),
    history: ChatHistorySchema.optional(),
    modelConfig: ModelConfigSchema.optional()
  })
]);


const ExpandChatOutputSchema = z.object({
  strategy_name: z.string(),
  core_insight: z.string(),
  analysis_blocks: z.array(z.object({ title: z.string(), content: z.string() })),
  mental_model_tip: z.string(),
  further_questions: z.array(z.string()),
  context_note: z.string().optional()
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
  const { ai, modelRefName } = createAI(parsed.modelConfig);
  if (parsed.mode === "strategy") {
    const prompt = ai.prompt("deep-analysis") as (
      payload: {
        full_path: string;
        current_node: string;
        strategy: z.infer<typeof StrategySchema>;
        intensity: number;
        history?: { role: string; content: string }[];
      },
      options: { model: string; output: { schema: typeof ExpandChatOutputSchema } }
    ) => Promise<{ output: z.infer<typeof ExpandChatOutputSchema> }>;
    const payload = {
      full_path: parsed.full_path,
      current_node: parsed.current_node,
      strategy: parsed.strategy,
      intensity: parsed.intensity,
      history: parsed.history
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

  const intentPrompt = ai.prompt("chat-intent") as (
    payload: {
      full_path: string;
      current_node: string;
      intensity: number;
      history?: { role: string; content: string }[];
    },
    options: { model: string; output: { schema: typeof ExpandChatOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandChatOutputSchema> }>;
  const intentPayload = {
    full_path: parsed.full_path,
    current_node: parsed.current_node,
    intensity: parsed.intensity,
    history: parsed.history
  };
  console.info("[ai:chat-intent] request", {
    model: modelRefName,
    prompt: "chat-intent",
    input: intentPayload
  });
  const intentResponse = await intentPrompt(
    intentPayload,
    {
      model: modelRefName,
      output: { schema: ExpandChatOutputSchema }
    }
  );
  console.info("[ai:chat-intent] response", intentResponse.output);

  return {
    ...ExpandChatOutputSchema.parse(intentResponse.output),
    strategy_name: intentResponse.output?.strategy_name || "意图推演"
  };
}
