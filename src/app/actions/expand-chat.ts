"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const PromptTypeSchema = z.enum(["direct", "cause", "counter", "timeline", "analogy"]);

const ExpandChatInputSchema = z
  .object({
    rootTopic: z.string(),
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

const buildPrompt = (input: z.infer<typeof ExpandChatInputSchema>) => {
  const path = input.pathContext.length > 0 ? input.pathContext.join(" -> ") : input.rootTopic;
  const promptLabel = input.promptType ? promptLabelMap[input.promptType] : "自由提问";
  const guidance = input.promptType ? promptGuidanceMap[input.promptType].join(" ") : "直接回答用户问题。";
  const userMessage = input.message ? `用户提问: ${input.message}` : "用户提问: (由联想模式驱动)";
  return [
    "你是一名思维导图节点对话助手，必须使用中文回复。",
    `根主题: ${input.rootTopic}`,
    `路径: ${path}`,
    `当前节点: ${input.nodeTitle}`,
    `节点描述: ${input.nodeDescription || "无"}`,
    `联想模式: ${promptLabel}`,
    `策略: ${guidance}`,
    userMessage,
    "请用 Markdown 格式回答，允许加粗、引用或列表，保持简洁，避免代码块。",
    "仅返回 JSON，字段: reply。"
  ].join("\n");
};

export async function expandChatAction(input: z.infer<typeof ExpandChatInputSchema>) {
  const parsed = ExpandChatInputSchema.parse(input);
  const prompt = buildPrompt(parsed);
  const response = await ai.generate({
    model: modelRefName,
    prompt,
    output: { schema: ExpandChatOutputSchema },
    config: {
      model: defaultModelName
    }
  });

  return ExpandChatOutputSchema.parse(response.output);
}
