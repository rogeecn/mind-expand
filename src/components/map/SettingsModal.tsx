"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Modal } from "@/components/common/Modal";
import { useModelSettings } from "@/hooks/useModelSettings";
import type { ModelCatalogItem } from "@/lib/model-config";

const tabs = [
  { id: "model", label: "模型设置" },
  { id: "export", label: "导出" }
] as const;

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exportView: React.ReactNode;
};

type TabId = (typeof tabs)[number]["id"];

const inputClass =
  "w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-ink focus:border-black focus:outline-none";

export function SettingsModal({ isOpen, onClose, exportView }: SettingsModalProps) {
  const { state, defaults, isLoading, saveSettings, resetSettings } = useModelSettings();
  const [activeTab, setActiveTab] = useState<TabId>("model");
  const [modelId, setModelId] = useState(state.modelId);
  const [apiToken, setApiToken] = useState(state.apiToken);
  const [baseURL, setBaseURL] = useState(state.baseURL);
  const [isSaving, setIsSaving] = useState(false);

  const catalog = useMemo<ModelCatalogItem[]>(() => state.modelCatalog, [state.modelCatalog]);
  const hasCatalog = catalog.length > 0;

  useEffect(() => {
    setModelId(state.modelId);
    setApiToken(state.apiToken);
    setBaseURL(state.baseURL);
  }, [state.modelId, state.apiToken, state.baseURL]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettings({
      apiToken: apiToken.trim() || undefined,
      modelId: modelId || undefined,
      baseURL: baseURL.trim() || undefined
    });
    setIsSaving(false);
  };

  const handleReset = async () => {
    setIsSaving(true);
    await resetSettings();
    setIsSaving(false);
  };

  const helperText = "你的 Token 仅保存在本地浏览器，不会上传到服务器。";

  return (
    <Modal title="应用设置" isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-3 py-1 transition",
              activeTab === tab.id ? "text-ink" : "text-gray-400 hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "model" && (
        <div className="space-y-6 pt-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">模型</h3>
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              className={inputClass}
            >
              {hasCatalog ? (
                catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))
              ) : (
                <option value="">未发现模型</option>
              )}
            </select>
            {defaults && (
              <p className="text-xs text-gray-400">
                默认模型：{defaults.modelDefaultId}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">API Token</h3>
            <input
              type="password"
              value={apiToken}
              onChange={(event) => setApiToken(event.target.value)}
              placeholder="输入你的 API Token"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">{helperText}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Base URL</h3>
            <input
              value={baseURL}
              onChange={(event) => setBaseURL(event.target.value)}
              placeholder="https://your-openai-endpoint/v1"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">留空则使用环境变量中的 OPENAI_BASE_URL。</p>
          </section>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-black"
            >
              恢复默认
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={clsx(
                "inline-flex items-center gap-2 rounded-sm border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition",
                isSaving || isLoading ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"
              )}
            >
              保存设置
            </button>
          </div>
        </div>
      )}

      {activeTab === "export" && <div className="pt-6">{exportView}</div>}
    </Modal>
  );
}
