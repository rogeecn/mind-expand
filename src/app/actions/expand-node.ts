"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";


const ExpandInputSchema = z.object({
  rootTopic: z.string(),
  topicDescription: z.string(),
  pathContext: z.array(z.string()),
  existingChildren: z.array(z.string())
});

const ExpandOutputSchema = z.object({
  logic_angle: z.string().describe("本次联想选取的逻辑维度（隐藏字段）"),
  nodes: z.array(z.string()).min(3).max(10).describe("结果数组 (3-10个)"),
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
    "你是一位拥有“上帝视角”的思维拓扑专家。你不仅精通各领域的百科知识（纵向深度），更擅长运用水平思考（横向广度）挖掘概念之间隐藏的逻辑链条。",
    "",
    "# Philosophy (思维定势破除)",
    "在思维导图中，一个优秀的节点不应只是父节点的简单缩影，而应是：",
    "1. **维度的切换**：如果已有节点是“物理属性”，请尝试从“时间维度”、“社会影响”或“潜在风险”进行切分。",
    "2. **第一性原理**：回归本质。若主题是“汽车”，不要只想到“轮子”，要想到“位移解决方案”。",
    "3. **强相关发散**：如同涟漪，离中心越远，越需要跳出平庸，但必须保持“逻辑张力”，严禁断层。",
    "",
    "# Context Control",
    `- 主题约束: ${topicDescription || "无"}`,
    `- **绝对坐标**：${fullPath} -> ${currentNode}`,
    `- **防御性排他**：${existingText}（生成的词汇必须与这些词在语义空间上保持 180 度反向或完全正交，绝无交集）。`,
    "",
    "# Execution Guidelines (强力约束)",
    "1. **语义密度**：每个关键词必须是“高浓缩语义载体”，拒绝废话（如“相关的策略” -> “博弈策略”）。",
    "2. **逻辑强相关**：发散必须遵循“逻辑母体”。例如：主题是[咖啡]，联想[历史]是强相关，联想[咖啡店装修]是强相关，但联想[室内装修设计]则是越界。",
    "3. **3-10 动态平衡**：",
    "   - 如果 `existing_children` 较少，优先提供 3-5 个“百科基石”节点。",
    "   - 如果 `existing_children` 已覆盖常规维度，则触发“疯狂发散”模式，寻找冷门但精妙的 5-10 个切入点。",

    "",
    "# Step-by-Step Internal Reasoning (CoT)",
    "在构造输出前，请在内存中执行：",
    `1. **扫描路径**：分析 ${fullPath} 的语境权重，锁定当前节点的语义边界。`,
    `2. **检测空隙**：扫描 ${existingText}，在语义地图中找到尚未被覆盖的“空白扇区”。`,
    "3. **多维建模**：尝试从【属性、功能、成因、影响、矛盾点、演化、替代品】中挑选最合适的维度。",
    "4. **冲突审查**：剔除任何与已有节点意义相近的词，哪怕是近义词也不行。",
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
