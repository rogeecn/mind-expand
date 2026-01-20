"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";


const ExpandInputSchema = z.object({
  rootTopic: z.string(),
  topicDescription: z.string(),
  pathContext: z.array(z.string()),
  existingChildren: z.array(z.string()),
  count: z.number().min(1).max(10)
});

const ExpandOutputSchema = z.object({
  logic_angle: z.string().describe("本次联想选取的逻辑维度（隐藏字段）"),
  nodes: z.array(z.string().max(12)).min(3).max(10).describe("结果数组 (3-10个)"),
  insight: z.string().describe("一句话推荐理由")
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


const expandNodePrompt = ({
  rootTopic,
  topicDescription,
  pathContext,
  existingChildren
}: z.infer<typeof ExpandInputSchema>) => {
  const currentNode = pathContext.at(-1) ?? rootTopic;
  const fullPath = pathContext.length > 1 ? pathContext.slice(0, -1).join(" -> ") : rootTopic;
  const existingText = existingChildren.length > 0 ? existingChildren.join(", ") : "无";
  return [
    "# Role",
    "你是一位兼具严谨逻辑与广博知识的**思维导图构建专家**。你的任务是为给定节点拆解出最自然、最核心、最直接的下一级子节点。",
    "",
    "# Philosophy (核心原则)",
    "1. **直接层级 (Direct Connection)**：",
    "   - 生成的节点必须是当前节点的**直接**下级（Is-a, Has-a, Part-of）。",
    "   - 🚫 **严禁跨层级**：例如主题是[咖啡]，[拿铁]是直接子级；[拉花技法]是[拿铁]的子级（孙子级），❌不应直接出现在[咖啡]下。",
    "2. **维度完备 (Dimensions)**：",
    "   - 优先覆盖：组成部分（Components）、分类（Types）、核心属性（Attributes）、直接行为（Actions）。",
    "3. **逻辑张力**：",
    "   - 在保持“直接相关”的前提下，寻找视角独特的切入点，但绝不能为了追求独特而牺牲逻辑的紧密性。",
    "",
    "# Context Control",
    `- 主题约束: ${topicDescription || "无"}`,
    `- **绝对坐标**：${fullPath} -> ${currentNode}`,
    `- **防御性排他**：${existingText}（请寻找与这些词不同维度的**平级**概念）。`,
    "",
    "# Execution Guidelines (强力约束)",
    "1. **层级测试**：对每个候选词 X，必需满足逻辑：`X 属于 ${currentNode} 的一种` 或 `${currentNode} 包含 X` 或 `X 是 ${currentNode} 的直接属性`。如果不满足，丢弃。",
    "2. **颗粒度统一**：确保生成的节点与 ${existingText} 处于同一颗粒度级别。",
    "3. **语义密度**：每个关键词必须是“高浓缩语义载体”，拒绝废话。",
    "4. **长度限制**：严格控制每个节点字数不超过 12 个字，简练精准。",
    "",
    "# Step-by-Step Internal Reasoning (CoT)",
    "在构造输出前，请在内存中执行：",
    `1. **语境锁定**：分析 ${fullPath}，确定当前节点在整体结构中的确切层级。`,
    `2. **维度扫描**：检查 ${existingText} 已占用的维度，寻找未覆盖的**直接**维度（如材质、功能、人群等）。`,
    "3. **层级校验**：(关键步骤) 检查每个候选词是否包含了隐含的中间节点？如果是“孙子节点”，请向上追溯找到它的直接父级替代之。",
    "4. **冲突审查**：剔除近义词。",
    "",
    "# Output",
    "仅输出符合 Schema 的 JSON 对象，确保语种为：纯中文。"
  ].join("\n");
};


export async function expandNodeAction(input: z.infer<typeof ExpandInputSchema>) {
  const parsed = ExpandInputSchema.parse(input);
  const prompt = expandNodePrompt(parsed);

  console.log("[expand-node] context", parsed);
  console.log("[expand-node] prompt", prompt);

  const response = await ai.generate({
    model: modelRefName,
    prompt,
    output: { schema: ExpandOutputSchema },
    config: {
      model: defaultModelName
    }
  });

  console.log("[expand-node] output", response.output);

  return ExpandOutputSchema.parse(response.output);
}
