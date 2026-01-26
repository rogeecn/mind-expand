import openAI from "@genkit-ai/compat-oai";
import { genkit } from "genkit";
import { z } from "zod";

const pluginName = "mind-expand";

const ModelCatalogItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.string(),
  model: z.string()
});

export const ModelConfigSchema = z.object({
  apiToken: z.string().optional(),
  modelId: z.string().optional(),
  baseURL: z.string().optional(),
  modelCatalog: z.array(ModelCatalogItemSchema).optional()
});

export type ModelConfigInput = z.infer<typeof ModelConfigSchema>;
export type ModelCatalogItem = z.infer<typeof ModelCatalogItemSchema>;

const parseModelCatalog = (raw?: string) => {
  if (!raw) return [] as ModelCatalogItem[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ModelCatalogItemSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
};


export const resolveModelConfig = (config?: ModelConfigInput) => {
  const envCatalog = parseModelCatalog(process.env.MODEL_CATALOG);
  const modelId = config?.modelId?.trim() || "";
  const modelCatalog = config?.modelCatalog?.length
    ? config.modelCatalog
    : envCatalog.length
      ? envCatalog
      : [];
  const matched = modelCatalog.find((item: ModelCatalogItem) => item.id === modelId);
  const modelName = matched?.model ?? modelId;
  const apiKey = config?.apiToken ?? process.env.OPENAI_API_KEY;
  const baseURL = config?.baseURL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  return {
    modelCatalog,
    modelId,
    modelName,
    apiKey,
    baseURL,
    modelRefName: `${pluginName}/${modelName}`
  };
};

export const createAI = (config?: ModelConfigInput) => {
  const resolved = resolveModelConfig(config);
  const ai = genkit({
    promptDir: "./prompts",
    plugins: [
      openAI({
        name: pluginName,
        apiKey: resolved.apiKey,
        baseURL: resolved.baseURL
      })
    ]
  });
  return {
    ai,
    modelRefName: resolved.modelRefName
  };
};
