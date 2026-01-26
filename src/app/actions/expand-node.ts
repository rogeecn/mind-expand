"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";
const ExpandInputSchema = z.object({
  rootTopic: z.string(),
  topicDescription: z.string(),
  pathContext: z.array(z.string()),
  pathDetails: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  ),
  existingChildren: z.array(z.string()),
  modelConfig: ModelConfigSchema.optional()
});

const ExpandOutputSchema = z.object({
  logic_angle: z.string().describe("本次联想选取的逻辑维度（隐藏字段）"),
  nodes: z
    .array(
      z.object({
        title: z.string().max(12),
        reason: z.string(),
        depth_thought: z.string()
      })
    )
    .min(1)
    .describe("子节点 + 推荐理由 + 深度思考"),
  insight: z.string().describe("一句话推荐理由")
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

  const payload = {
    root_topic: parsed.rootTopic,
    topic_constraints: parsed.topicDescription || parsed.rootTopic,
    path_summary: pathSummary,
    path_details: parsed.pathDetails,
    current_node: currentNode,
    existing_children_summary: existingChildrenSummary
  };
  const { ai, modelRefName } = createAI(parsed.modelConfig);
  console.info("[ai:expand-node] request", {
    model: modelRefName,
    prompt: "expand-node",
    input: payload
  });

  const prompt = ai.prompt("expand-node") as (
    input: {
      root_topic: string;
      topic_constraints: string;
      path_summary: string;
      path_details: { title: string; description: string }[];
      current_node: string;
      existing_children_summary: string;
    },
    options: { model: string; output: { schema: typeof ExpandOutputSchema } }
  ) => Promise<{ output: z.infer<typeof ExpandOutputSchema> }>;
  const response = await prompt(
    payload,
    {
      model: modelRefName,
      output: { schema: ExpandOutputSchema }
    }
  );

  console.info("[ai:expand-node] response", response.output);

  return ExpandOutputSchema.parse(response.output);
}
