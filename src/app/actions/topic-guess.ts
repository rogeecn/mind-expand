"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

const TopicGuessInputSchema = z.object({
  role: z.string().optional(),
  role_description: z.string().optional(),
  goal: z.string().optional(),
  goal_description: z.string().optional(),
  keywords: z.array(z.string()).min(1),
  modelConfig: ModelConfigSchema.optional()
});

const TopicGuessOutputSchema = z.object({
  title: z.string(),
  description: z.string()
});

export type TopicGuessInput = z.infer<typeof TopicGuessInputSchema>;
export type TopicGuessOutput = z.infer<typeof TopicGuessOutputSchema>;

export async function topicGuessAction(input: TopicGuessInput): Promise<TopicGuessOutput> {
  const parsed = TopicGuessInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);

  const prompt = ai.prompt("topic-guess") as (
    payload: Omit<TopicGuessInput, "modelConfig">,
    options: { model: string; output: { schema: typeof TopicGuessOutputSchema } }
  ) => Promise<{ output: TopicGuessOutput }>;

  const payload = {
    role: parsed.role,
    role_description: parsed.role_description,
    goal: parsed.goal,
    goal_description: parsed.goal_description,
    keywords: parsed.keywords
  };

  console.info("[ai:topic-guess] request", {
    model: modelRefName,
    prompt: "topic-guess",
    input: payload
  });

  const response = await prompt(payload, {
    model: modelRefName,
    output: { schema: TopicGuessOutputSchema }
  });

  console.info("[ai:topic-guess] response", response.output);

  return TopicGuessOutputSchema.parse(response.output);
}
