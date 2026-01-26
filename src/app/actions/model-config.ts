"use server";

import { resolveModelConfig } from "@/lib/model-config";

export async function getModelDefaultsAction() {
  const resolved = resolveModelConfig();
  return {
    modelCatalog: resolved.modelCatalog,
    modelDefaultId: resolved.modelId,
    baseURL: resolved.baseURL ?? ""
  };
}
