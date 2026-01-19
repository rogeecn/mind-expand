"use server";

import { z } from "zod";
import { genkit } from "genkit";
import openAI from "@genkit-ai/compat-oai";

const ExpansionSchema = z.object({
  title: z.string(),
  description: z.string()
});

const ExpandInputSchema = z.object({
  rootTopic: z.string(),
  topicDescription: z.string(),
  pathContext: z.array(z.string()),
  count: z.number().min(1).max(10)
});

const ExpandOutputSchema = z.object({
  expansions: z.array(ExpansionSchema)
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
  count
}: z.infer<typeof ExpandInputSchema>) => {
  const path = pathContext.join(" > ");
  return [
    "你是一名思维导图扩展助手，必须使用中文回复。",
    `根主题: ${rootTopic}`,
    `主题约束: ${topicDescription || "无"}`,
    `路径: ${path}`,
    `生成不少于3个且不超过${count}个相关子主题，相关性强的可以多给。`,
    "只返回 JSON，包含字段 expansions，每项包含 title 和 description（中文）。"
  ].join("\n");
};


export async function expandNodeAction(input: z.infer<typeof ExpandInputSchema>) {
  const parsed = ExpandInputSchema.parse(input);
  const prompt = expandNodePrompt(parsed);
  const response = await ai.generate({
    model: modelRefName,
    prompt,
    output: { schema: ExpandOutputSchema },
    config: {
      model: defaultModelName
    }
  });

  return ExpandOutputSchema.parse(response.output);
}
