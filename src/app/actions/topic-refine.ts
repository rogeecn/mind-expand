"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

const TopicRefineInputSchema = z.object({
  role: z.string().optional(),
  role_description: z.string().optional(),
  goal: z.string().optional(),
  goal_description: z.string().optional(),
  keywords: z.array(z.string()).min(1),
  title: z.string(),
  description: z.string(),
  selected_extensions: z.array(z.string()).min(1),
  modelConfig: ModelConfigSchema.optional()
});

const TopicRefineOutputSchema = z.object({
  refined_description: z.string(),
  constraints: z.string(),
  suggested_focus: z.array(z.string())
});

export type TopicRefineInput = z.infer<typeof TopicRefineInputSchema>;
export type TopicRefineOutput = z.infer<typeof TopicRefineOutputSchema>;

export async function topicRefineAction(input: TopicRefineInput): Promise<TopicRefineOutput> {
  const parsed = TopicRefineInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);

  const prompt = ai.prompt("topic-refine") as (
    payload: Omit<TopicRefineInput, "modelConfig">,
    options: { model: string; output: { schema: typeof TopicRefineOutputSchema } }
  ) => Promise<{ output: TopicRefineOutput }>;

  const payload = {
    role: parsed.role,
    role_description: parsed.role_description,
    goal: parsed.goal,
    goal_description: parsed.goal_description,
    keywords: parsed.keywords,
    title: parsed.title,
    description: parsed.description,
    selected_extensions: parsed.selected_extensions
  };

  console.info("[ai:topic-refine] request", {
    model: modelRefName,
    prompt: "topic-refine",
    input: payload
  });

  const response = await prompt(payload, {
    model: modelRefName,
    output: { schema: TopicRefineOutputSchema }
  });

  console.info("[ai:topic-refine] response", response.output);

  return TopicRefineOutputSchema.parse(response.output);
}
