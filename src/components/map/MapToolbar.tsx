"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Focus, Download, TreePine, HelpCircle, X } from "lucide-react";

type ToolbarProps = {
  onFitView: () => void;
  onExport: () => void;
  onLayoutTree: () => void;
  onSetColor: (color: "ink" | "amber" | "sky" | "mint" | null) => void;
  isColorEnabled: boolean;
  lastColor: "ink" | "amber" | "sky" | "mint" | null;
};

const colorOptions: Array<{
  label: string;
  value: "ink" | "amber" | "sky" | "mint" | null;
  className: string;
}> = [
  { label: "None", value: null, className: "bg-white border-gray-300" },
  { label: "Ink", value: "ink", className: "bg-ink" },
  { label: "Amber", value: "amber", className: "bg-amber-100" },
  { label: "Sky", value: "sky", className: "bg-sky-100" },
  { label: "Mint", value: "mint", className: "bg-emerald-100" }
];

export function MapToolbar({
  onFitView,
  onExport,
  onLayoutTree,
  onSetColor,
  isColorEnabled,
  lastColor
}: ToolbarProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement | null>(null);
  const buttonBase =
    "inline-flex items-center gap-2 rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-600 transition hover:border-black hover:text-black";
  const colorButtonBase = "inline-flex items-center justify-center text-xs font-medium uppercase tracking-wide";

  const handleExport = () => {
    onExport();
  };


  const lastSwatchClass = (() => {
    switch (lastColor) {
      case "ink":
        return "bg-ink border-ink";
      case "amber":
        return "bg-amber-100 border-amber-200";
      case "sky":
        return "bg-sky-100 border-sky-200";
      case "mint":
        return "bg-emerald-100 border-emerald-200";
      default:
        return "bg-white border-gray-300";
    }
  })();


  return (
    <>
      <div className="pointer-events-auto fixed top-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-6 py-3 shadow-lg backdrop-blur">
        <button className={buttonBase} type="button" onClick={onFitView}>
          <Focus className="h-3.5 w-3.5" />
          Fit
        </button>
        <button className={buttonBase} type="button" onClick={onLayoutTree}>
          <TreePine className="h-3.5 w-3.5" />
          美化
        </button>
        <div className="relative flex items-center" ref={colorRef}>
          <div
            className={clsx(
              "flex items-center overflow-hidden rounded-sm border border-gray-200",
              isColorEnabled ? "hover:border-black" : "opacity-40"
            )}
          >
            <button
              type="button"
              aria-label="Use last color"
              disabled={!isColorEnabled}
              onClick={() => onSetColor(lastColor)}
              className={clsx(colorButtonBase, "px-3 py-2")}
            >
              <span className={`h-3 w-3 rounded-full border ${lastSwatchClass}`} />
            </button>
            <button
              type="button"
              aria-label="Select color"
              disabled={!isColorEnabled}
              onClick={() => setColorOpen((open) => !open)}
              className={clsx(colorButtonBase, "border-l border-gray-200 px-2.5 py-2")}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          {colorOpen && (
            <div className="absolute left-1/2 top-12 -translate-x-1/2 rounded-sm border border-gray-200 bg-white p-3 shadow-lg">
              <div className="flex items-center gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-label={`Set ${option.label}`}
                    onClick={() => {
                      setColorOpen(false);
                      onSetColor(option.value);
                    }}
                    className={`h-5 w-5 rounded-full border ${option.className} hover:border-black`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <button className={buttonBase} type="button" onClick={handleExport} aria-label="Export">
          <Download className="h-3.5 w-3.5" />
          导出
        </button>
        <button className={buttonBase} type="button" onClick={() => setIsHelpOpen(true)} aria-label="Usage">
          <HelpCircle className="h-3.5 w-3.5" />
          说明
        </button>
      </div>

      {isHelpOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-6">
          <div className="relative w-full max-w-2xl rounded-sm border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink">思维导图使用说明</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-400">Mind Map Guide</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 text-sm text-gray-700">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">快速开始</h3>
                <ul className="list-disc space-y-2 pl-4">
                  <li>点击节点，查看摘要；选择“研讨”进入深度分析。</li>
                  <li>点击“美化”可重新布局当前视图。</li>
                  <li>使用“导出”保存你的主题数据。</li>
                </ul>
              </section>

              <section className="mt-8 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">键盘操作</h3>
                <ul className="space-y-2 text-sm text-gray-800">
                  <li>- ↑ ↓ ← → 导航节点（上下为兄弟，左右为父子）</li>
                  <li>- Enter 展开当前节点 / 生成子节点</li>
                  <li>- Delete/Backspace 删除当前节点</li>
                  <li>- Esc 取消选中节点</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
