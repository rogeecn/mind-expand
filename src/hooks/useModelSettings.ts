"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type SettingsRecord } from "@/lib/db";
import type { ModelCatalogItem, ModelConfigInput } from "@/lib/model-config";

const SETTINGS_ID = "user-settings";

export type ModelSettingsState = {
  modelCatalog: ModelCatalogItem[];
  modelDefaultId: string;
  baseURL: string;
  apiToken: string;
  modelId: string;
  modelCatalogOverride: ModelCatalogItem[];
  modelPresets: NonNullable<SettingsRecord["modelPresets"]>;
};

export const useModelSettings = () => {
  const settingsRecord = useLiveQuery(async () => {
    return db.settings.get(SETTINGS_ID);
  }, []);

  const modelCatalog = settingsRecord?.modelCatalog?.length
    ? settingsRecord.modelCatalog
    : [];
  const modelId = settingsRecord?.modelId ?? "";

  const state: ModelSettingsState = {
    modelCatalog,
    modelDefaultId: "",
    baseURL: settingsRecord?.baseURL ?? "",
    apiToken: settingsRecord?.apiToken ?? "",
    modelId,
    modelCatalogOverride: settingsRecord?.modelCatalog ?? [],
    modelPresets: settingsRecord?.modelPresets ?? []
  };

  const modelConfig = useMemo<ModelConfigInput>(() => ({
    apiToken: settingsRecord?.apiToken,
    modelId: settingsRecord?.modelId,
    baseURL: settingsRecord?.baseURL,
    modelCatalog: settingsRecord?.modelCatalog
  }), [
    settingsRecord?.apiToken,
    settingsRecord?.modelId,
    settingsRecord?.baseURL,
    settingsRecord?.modelCatalog
  ]);

  const saveSettings = useCallback(async (next: Partial<SettingsRecord>) => {
    await db.settings.put({
      ...(settingsRecord ?? { id: SETTINGS_ID }),
      ...next,
      id: SETTINGS_ID
    });
  }, [settingsRecord]);

  const resetSettings = useCallback(async () => {
    await db.settings.delete(SETTINGS_ID);
  }, []);

  return {
    state,
    modelConfig,
    saveSettings,
    resetSettings
  };
};
