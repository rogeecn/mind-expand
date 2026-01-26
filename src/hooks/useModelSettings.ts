"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type SettingsRecord } from "@/lib/db";
import { getModelDefaultsAction } from "@/app/actions/model-config";
import type { ModelCatalogItem, ModelConfigInput } from "@/lib/model-config";

const SETTINGS_ID = "user-settings";

export type ModelSettingsState = {
  modelCatalog: ModelCatalogItem[];
  modelDefaultId: string;
  baseURL: string;
  apiToken: string;
  modelId: string;
  modelCatalogOverride: ModelCatalogItem[];
};

export const useModelSettings = () => {
  const settingsRecord = useLiveQuery(async () => {
    return db.settings.get(SETTINGS_ID);
  }, []);

  const [defaults, setDefaults] = useState<{
    modelCatalog: ModelCatalogItem[];
    modelDefaultId: string;
    baseURL: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getModelDefaultsAction()
      .then((response) => {
        if (isMounted) {
          setDefaults(response);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const modelCatalog = settingsRecord?.modelCatalog?.length
    ? settingsRecord.modelCatalog
    : defaults?.modelCatalog ?? [];
  const modelId = settingsRecord?.modelId ?? defaults?.modelDefaultId ?? "";

  const state: ModelSettingsState = {
    modelCatalog,
    modelDefaultId: defaults?.modelDefaultId ?? "",
    baseURL: settingsRecord?.baseURL ?? defaults?.baseURL ?? "",
    apiToken: settingsRecord?.apiToken ?? "",
    modelId,
    modelCatalogOverride: settingsRecord?.modelCatalog ?? []
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
      id: SETTINGS_ID,
      ...next
    });
  }, []);

  const resetSettings = useCallback(async () => {
    await db.settings.delete(SETTINGS_ID);
  }, []);

  return {
    state,
    defaults,
    isLoading,
    modelConfig,
    saveSettings,
    resetSettings
  };
};
