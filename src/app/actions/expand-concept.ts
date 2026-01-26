"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

const PromptTypeSchema = z.enum(["direct", "cause", "counter", "timeline", "analogy"]);

const ExpandConceptInputSchema = z.object({
  rootTopic: z.string(),
  topicDescription: z.string().optional(),
  pathContext: z.array(z.string()),
  nodeTitle: z.string(),
  nodeDescription: z.string(),
  promptType: PromptTypeSchema,
  modelConfig: ModelConfigSchema.optional()
});

const ExpandConceptOutputSchema = z.object({
  logic_angle: z.string(),
  idea: z.string(),
  insight: z.string()
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

export async function expandConceptAction(input: z.infer<typeof ExpandConceptInputSchema>) {
  const parsed = ExpandConceptInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);
  const prompt = ai.prompt("expand-concept") as (
    input: {
      rootTopic: string;
      topicConstraints: string;
      pathSummary: string;
      nodeTitle: string;
      nodeDescription: string;
      promptLabel: string;
      promptGuidance: string;
    },
    options: { model: string; output: { schema: typeof ExpandConceptOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandConceptOutputSchema> }>;
  const payload = {
    rootTopic: parsed.rootTopic,
    topicConstraints: parsed.topicDescription || parsed.rootTopic,
    pathSummary: parsed.pathContext.join(" -> "),
    nodeTitle: parsed.nodeTitle,
    nodeDescription: parsed.nodeDescription || parsed.topicDescription || "无",
    promptLabel: promptLabelMap[parsed.promptType],
    promptGuidance: promptGuidanceMap[parsed.promptType].join(" ")
  };
  console.info("[ai:expand-concept] request", {
    model: modelRefName,
    prompt: "expand-concept",
    input: payload
  });
  const response = await prompt(
    payload,
    {
      model: modelRefName,
      output: { schema: ExpandConceptOutputSchema }
    }
  );
  console.info("[ai:expand-concept] response", response.output);

  return ExpandConceptOutputSchema.parse(response.output);
}
