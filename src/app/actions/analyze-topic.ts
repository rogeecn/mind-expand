"use server";

import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const DisambiguationInputSchema = z.object({
  rootKeyword: z.string()
});

const DisambiguationOutputSchema = z.object({
  potentialContexts: z.array(
    z.object({
      contextName: z.string(),
      description: z.string(),
      keyTerms: z.array(z.string())
    })
  )
});

const ConsolidationInputSchema = z.object({
  rootKeyword: z.string(),
  selectedContexts: z.array(z.string())
});

const ConsolidationOutputSchema = z.object({
  masterTitle: z.string(),
  masterDescription: z.string(),
  globalConstraints: z.string(),
  suggestedFocus: z.array(z.string())
});

const pluginName = "mind-expand";
const defaultModelName = process.env.MODEL_DEFAULT_ID ?? "gpt-4o-mini";
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

type RootDisambiguationResult = z.infer<typeof DisambiguationOutputSchema>;

type RootConsolidationResult = z.infer<typeof ConsolidationOutputSchema>;

export async function rootDisambiguationAction(input: z.infer<typeof DisambiguationInputSchema>) {
  const parsed = DisambiguationInputSchema.parse(input);
  const prompt = ai.prompt("root-disambiguation") as (
    payload: { rootKeyword: string },
    options: { model: string; output: { schema: typeof DisambiguationOutputSchema } }
  ) => Promise<{ output: RootDisambiguationResult }>;
  const response = await prompt(
    { rootKeyword: parsed.rootKeyword },
    {
      model: modelRefName,
      output: { schema: DisambiguationOutputSchema }
    }
  );

  return DisambiguationOutputSchema.parse(response.output);
}

export async function rootConsolidationAction(input: z.infer<typeof ConsolidationInputSchema>) {
  const parsed = ConsolidationInputSchema.parse(input);
  const prompt = ai.prompt("root-consolidation") as (
    payload: { rootKeyword: string; selectedContexts: string },
    options: { model: string; output: { schema: typeof ConsolidationOutputSchema } }
  ) => Promise<{ output: RootConsolidationResult }>;
  const response = await prompt(
    {
      rootKeyword: parsed.rootKeyword,
      selectedContexts: parsed.selectedContexts.join("\n")
    },
    {
      model: modelRefName,
      output: { schema: ConsolidationOutputSchema }
    }
  );

  return ConsolidationOutputSchema.parse(response.output);
}
