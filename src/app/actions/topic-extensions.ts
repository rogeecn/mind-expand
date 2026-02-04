"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

const TopicExtensionsInputSchema = z.object({
  role: z.string().optional(),
  role_description: z.string().optional(),
  goal: z.string().optional(),
  goal_description: z.string().optional(),
  keywords: z.array(z.string()).min(1),
  title: z.string(),
  description: z.string(),
  modelConfig: ModelConfigSchema.optional()
});

const ExtensionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  key_terms: z.array(z.string())
});

const TopicExtensionsOutputSchema = z.object({
  extensions: z.array(ExtensionItemSchema)
});

export type TopicExtensionsInput = z.infer<typeof TopicExtensionsInputSchema>;
export type TopicExtensionsOutput = z.infer<typeof TopicExtensionsOutputSchema>;
export type ExtensionItem = z.infer<typeof ExtensionItemSchema>;

export async function topicExtensionsAction(input: TopicExtensionsInput): Promise<TopicExtensionsOutput> {
  const parsed = TopicExtensionsInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);

  const prompt = ai.prompt("topic-extensions") as (
    payload: Omit<TopicExtensionsInput, "modelConfig">,
    options: { model: string; output: { schema: typeof TopicExtensionsOutputSchema } }
  ) => Promise<{ output: TopicExtensionsOutput }>;

  const payload = {
    role: parsed.role,
    role_description: parsed.role_description,
    goal: parsed.goal,
    goal_description: parsed.goal_description,
    keywords: parsed.keywords,
    title: parsed.title,
    description: parsed.description
  };

  console.info("[ai:topic-extensions] request", {
    model: modelRefName,
    prompt: "topic-extensions",
    input: payload
  });

  const response = await prompt(payload, {
    model: modelRefName,
    output: { schema: TopicExtensionsOutputSchema }
  });

  console.info("[ai:topic-extensions] response", response.output);

  return TopicExtensionsOutputSchema.parse(response.output);
}
