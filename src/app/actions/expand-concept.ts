"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const PromptTypeSchema = z.enum(["direct", "cause", "counter", "timeline", "analogy"]);

const ExpandConceptInputSchema = z.object({
  rootTopic: z.string(),
  pathContext: z.array(z.string()),
  nodeTitle: z.string(),
  nodeDescription: z.string(),
  promptType: PromptTypeSchema
});

const ExpandConceptOutputSchema = z.object({
  logic_angle: z.string(),
  idea: z.string(),
  insight: z.string()
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
  counter: [
    "从对立面、反向结果或矛盾视角切入。",
    "保持逻辑张力但避免无关话题。"
  ],
  timeline: [
    "从时间序列、演化阶段或历史脉络挑选关键节点。",
    "突出阶段性的转折点或里程碑。"
  ],
  analogy: [
    "寻找结构相似或机制相同的类比概念。",
    "确保类比能启发新的理解。"
  ]
};

const buildPrompt = (input: z.infer<typeof ExpandConceptInputSchema>) => {
  const path = input.pathContext.join(" -> ");
  const guidance = promptGuidanceMap[input.promptType].join(" ");
  return [
    "你是一名思维导图扩展助手，必须使用中文回复。",
    `根主题: ${input.rootTopic}`,
    `路径: ${path}`,
    `当前节点: ${input.nodeTitle}`,
    `节点描述: ${input.nodeDescription || "无"}`,
    `联想模式: ${promptLabelMap[input.promptType]}`,
    `策略: ${guidance}`,
    "输出一个概念建议(idea)与一段中/长解释(insight)。",
    "idea 不超过 12 个字；insight 可以是完整段落。",
    "仅返回 JSON，字段: logic_angle, idea, insight。"
  ].join("\n");
};

export async function expandConceptAction(input: z.infer<typeof ExpandConceptInputSchema>) {
  const parsed = ExpandConceptInputSchema.parse(input);
  const prompt = buildPrompt(parsed);
  const response = await ai.generate({
    model: modelRefName,
    prompt,
    output: { schema: ExpandConceptOutputSchema },
    config: {
      model: defaultModelName
    }
  });

  return ExpandConceptOutputSchema.parse(response.output);
}
