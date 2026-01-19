"use server";

import { z } from "zod";
import { genkit, GenerationCommonConfigSchema } from "genkit";
import openAI from "@genkit-ai/compat-oai";

const ExpansionSchema = z.object({
  title: z.string(),
  description: z.string()
});

const ExpandInputSchema = z.object({
  rootTopic: z.string(),
  pathContext: z.array(z.string()),
  count: z.number().min(1).max(6)
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


const expandNodePrompt = ({ rootTopic, pathContext, count }: z.infer<typeof ExpandInputSchema>) => {
  const path = pathContext.join(" > ");
  return [
    "You are a recursive mind map generator.",
    `Root topic: ${rootTopic}`,
    `Path: ${path}`,
    `Generate ${count} distinct, concise subtopics for the last path item.`,
    "Return JSON with array 'expansions', each with title and description."
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
