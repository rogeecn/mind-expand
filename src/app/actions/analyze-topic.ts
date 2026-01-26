"use server";

import { z } from "zod";
import { createAI, ModelConfigSchema } from "@/lib/model-config";

const DisambiguationInputSchema = z.object({
  root_keyword: z.string(),
  modelConfig: ModelConfigSchema.optional()
});

const DisambiguationOutputSchema = z.object({
  potential_contexts: z.array(
    z.object({
      context_name: z.string(),
      description: z.string(),
      key_terms: z.array(z.string())
    })
  )
});

const ConsolidationInputSchema = z.object({
  root_keyword: z.string(),
  selected_contexts: z.array(z.string()),
  modelConfig: ModelConfigSchema.optional()
});

const ConsolidationOutputSchema = z.object({
  master_title: z.string(),
  master_description: z.string().max(260),
  global_constraints: z.string(),
  suggested_focus: z.array(z.string())
});


type RootDisambiguationResult = z.infer<typeof DisambiguationOutputSchema>;

type RootConsolidationResult = z.infer<typeof ConsolidationOutputSchema>;

export async function rootDisambiguationAction(input: z.infer<typeof DisambiguationInputSchema>) {
  const parsed = DisambiguationInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);
  const prompt = ai.prompt("root-disambiguation") as (
    payload: { root_keyword: string },
    options: { model: string; output: { schema: typeof DisambiguationOutputSchema } }
  ) => Promise<{ output: RootDisambiguationResult }>;
  const payload = { root_keyword: parsed.root_keyword };
  console.info("[ai:root-disambiguation] request", {
    model: modelRefName,
    prompt: "root-disambiguation",
    input: payload
  });
  const response = await prompt(
    payload,
    {
      model: modelRefName,
      output: { schema: DisambiguationOutputSchema }
    }
  );
  console.info("[ai:root-disambiguation] response", response.output);

  return DisambiguationOutputSchema.parse(response.output);
}

export async function rootConsolidationAction(input: z.infer<typeof ConsolidationInputSchema>) {
  const parsed = ConsolidationInputSchema.parse(input);
  const { ai, modelRefName } = createAI(parsed.modelConfig);
  const prompt = ai.prompt("root-consolidation") as (
    payload: { root_keyword: string; selected_contexts: string[] },
    options: { model: string; output: { schema: typeof ConsolidationOutputSchema } }
  ) => Promise<{ output: RootConsolidationResult }>;
  const payload = {
    root_keyword: parsed.root_keyword,
    selected_contexts: parsed.selected_contexts
  };
  console.info("[ai:root-consolidation] request", {
    model: modelRefName,
    prompt: "root-consolidation",
    input: payload
  });
  const response = await prompt(
    payload,
    {
      model: modelRefName,
      output: { schema: ConsolidationOutputSchema }
    }
  );
  console.info("[ai:root-consolidation] response", response.output);

  return ConsolidationOutputSchema.parse(response.output);
}
