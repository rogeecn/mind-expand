"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Modal } from "@/components/common/Modal";
import { useModelSettings } from "@/hooks/useModelSettings";
import type { ModelCatalogItem } from "@/lib/model-config";
import { createId } from "@/lib/uuid";
import { X } from "lucide-react";

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
  const { state, saveSettings, resetSettings } = useModelSettings();
  const [activeTab, setActiveTab] = useState<TabId>("model");
  const [modelId, setModelId] = useState(state.modelId);
  const [apiToken, setApiToken] = useState(state.apiToken);
  const [baseURL, setBaseURL] = useState(state.baseURL);
  const [presetNote, setPresetNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const catalog = useMemo<ModelCatalogItem[]>(() => state.modelCatalog, [state.modelCatalog]);
  const presets = state.modelPresets;
  const hasCatalog = catalog.length > 0;

  useEffect(() => {
    setModelId(state.modelId);
    setApiToken(state.apiToken);
    setBaseURL(state.baseURL);
  }, [state.modelId, state.apiToken, state.baseURL]);

  const openAIDefaultBaseURL = "https://api.openai.com/v1";

  const handleSave = async () => {
    setIsSaving(true);
    await saveSettings({
      apiToken: apiToken.trim() || undefined,
      modelId: modelId.trim() || undefined,
      baseURL: baseURL.trim() || undefined
    });
    setIsSaving(false);
  };

  const handleSavePreset = async () => {
    const trimmedModelId = modelId.trim();
    if (!trimmedModelId) return;
    const presetId = createId();
    const nextPresets = [
      {
        id: presetId,
        modelId: trimmedModelId,
        note: presetNote.trim() || undefined,
        apiToken: apiToken.trim() || undefined,
        baseURL: baseURL.trim() || undefined
      },
      ...presets
    ];
    setPresetNote("");
    await saveSettings({ modelPresets: nextPresets });
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setModelId(preset.modelId ?? "");
    setApiToken(preset.apiToken ?? "");
    setBaseURL(preset.baseURL ?? "");
  };

  const handleRemovePreset = async (presetId: string) => {
    await saveSettings({
      modelPresets: presets.filter((item) => item.id !== presetId)
    });
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
            <input
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              placeholder="例如 gpt-4o / gpt-4o-mini"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">模型 ID 为空会导致请求失败。</p>
            {hasCatalog && (
              <p className="text-xs text-gray-400">
                环境变量提供 {catalog.length} 个模型定义（仅供参考）。
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
              placeholder={openAIDefaultBaseURL}
              className={inputClass}
            />
            <p className="text-xs text-gray-400">
              默认 {openAIDefaultBaseURL}，留空则由后端使用 OPENAI_BASE_URL。
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">历史配置</h3>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">点击标签快速切换</span>
            </div>
            {presets.length === 0 ? (
              <p className="text-xs text-gray-400">暂无保存的模型配置。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                    <button type="button" onClick={() => handleApplyPreset(preset.id)} className="text-ink hover:underline">
                      {preset.modelId}
                      {preset.note ? ` · ${preset.note}` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePreset(preset.id)}
                      className="text-gray-400 hover:text-black"
                      aria-label="Remove preset"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={presetNote}
                onChange={(event) => setPresetNote(event.target.value)}
                placeholder="备注（可选）"
                className={clsx(inputClass, "max-w-[240px]")}
              />
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={!modelId.trim()}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-sm border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 transition",
                  modelId.trim() ? "hover:border-black hover:text-black" : "cursor-not-allowed opacity-50"
                )}
              >
                保存为标签
              </button>
            </div>
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
              disabled={isSaving}
              className={clsx(
                "inline-flex items-center gap-2 rounded-sm border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition",
                isSaving ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"
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
