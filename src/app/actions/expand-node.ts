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
  promptDir: "./prompts",
  plugins: [
    openAI({
      name: pluginName,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL
    })
  ]
});



export async function expandNodeAction(input: z.infer<typeof ExpandInputSchema>) {
  const parsed = ExpandInputSchema.parse(input);
  const currentNode = parsed.pathContext.at(-1) ?? parsed.rootTopic;
  const pathSummary = parsed.pathContext.length > 1
    ? parsed.pathContext.slice(0, -1).join(" -> ")
    : parsed.rootTopic;
  const existingChildrenSummary = parsed.existingChildren.length > 0
    ? parsed.existingChildren.join(", ")
    : "无";

  console.log("[expand-node] context", parsed);

  const prompt = ai.prompt("expand-node") as (
    input: {
      rootTopic: string;
      topicConstraints: string;
      pathSummary: string;
      currentNode: string;
      existingChildrenSummary: string;
      count: number;
    },
    options: { model: string; output: { schema: typeof ExpandOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandOutputSchema> }>;
  const response = await prompt(
    {
      rootTopic: parsed.rootTopic,
      topicConstraints: parsed.topicDescription || parsed.rootTopic,
      pathSummary,
      currentNode,
      existingChildrenSummary,
      count: parsed.count
    },
    {
      model: modelRefName,
      output: { schema: ExpandOutputSchema }
    }
  );

  console.log("[expand-node] output", response.output);

  return ExpandOutputSchema.parse(response.output);
}
