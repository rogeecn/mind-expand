"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const PromptTypeSchema = z.enum(["direct", "cause", "counter", "timeline", "analogy"]);

const ExpandChatInputSchema = z
  .object({
    rootTopic: z.string(),
    topicDescription: z.string().optional(),
    pathContext: z.array(z.string()),
    nodeTitle: z.string(),
    nodeDescription: z.string(),
    message: z.string().optional(),
    promptType: PromptTypeSchema.optional()
  })
  .refine((data) => Boolean(data.message?.trim() || data.promptType), {
    message: "message or promptType required"
  });

const ExpandChatOutputSchema = z.object({
  reply: z.string()
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

const promptLabelMap: Record<z.infer<typeof PromptTypeSchema>, string> = {
  direct: "直接拆分",
  cause: "因果链条",
  counter: "反向视角",
  timeline: "时间演化",
  analogy: "类比联想"
};

const promptGuidanceMap: Record<z.infer<typeof PromptTypeSchema>, string[]> = {
  direct: [
    "从组成、类型、核心属性等维度挑选最直接的下一层概念。",
    "必须保持与当前概念强关联且颗粒度一致。"
  ],
  cause: [
    "围绕因果链条，找出导致或被导致的直接因素。",
    "优先选择能解释核心机制的单一概念。"
  ],
  counter: ["从对立面、反向结果或矛盾视角切入。", "保持逻辑张力但避免无关话题。"],
  timeline: [
    "从时间序列、演化阶段或历史脉络挑选关键节点。",
    "突出阶段性的转折点或里程碑。"
  ],
  analogy: ["寻找结构相似或机制相同的类比概念。", "确保类比能启发新的理解。"]
};


export async function expandChatAction(input: z.infer<typeof ExpandChatInputSchema>) {
  const parsed = ExpandChatInputSchema.parse(input);
  const prompt = ai.prompt("expand-chat") as (
    input: {
      rootTopic: string;
      topicConstraints: string;
      pathSummary: string;
      nodeTitle: string;
      nodeDescription: string;
      promptLabel: string;
      promptGuidance: string;
      message: string;
    },
    options: { model: string; output: { schema: typeof ExpandChatOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandChatOutputSchema> }>;
  const promptLabel = parsed.promptType ? promptLabelMap[parsed.promptType] : "自由提问";
  const promptGuidance = parsed.promptType
    ? promptGuidanceMap[parsed.promptType].join(" ")
    : "直接回答用户问题。";
  const response = await prompt(
    {
      rootTopic: parsed.rootTopic,
      topicConstraints: parsed.topicDescription || parsed.rootTopic,
      pathSummary: parsed.pathContext.length > 0 ? parsed.pathContext.join(" -> ") : parsed.rootTopic,
      nodeTitle: parsed.nodeTitle,
      nodeDescription: parsed.nodeDescription || parsed.topicDescription || "无",
      promptLabel,
      promptGuidance,
      message: parsed.message?.trim() || "(由联想模式驱动)"
    },
    {
      model: modelRefName,
      output: { schema: ExpandChatOutputSchema }
    }
  );

  return ExpandChatOutputSchema.parse(response.output);
}
