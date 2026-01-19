"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Focus, MoreHorizontal, TreePine } from "lucide-react";

type ToolbarProps = {
  onFitView: () => void;
  onExport: () => void;
  onImport: () => void;
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
  onImport,
  onLayoutTree,
  onSetColor,
  isColorEnabled,
  lastColor
}: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const colorRef = useRef<HTMLDivElement | null>(null);
  const buttonBase =
    "inline-flex items-center gap-2 rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-600 transition hover:border-black hover:text-black";
  const colorButtonBase = "inline-flex items-center justify-center text-xs font-medium uppercase tracking-wide";

  const handleExport = () => {
    setMenuOpen(false);
    onExport();
  };

  const handleImport = () => {
    setMenuOpen(false);
    onImport();
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
      <div className="relative" ref={menuRef}>
        <button
          className={buttonBase}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 min-w-[140px] rounded-sm border border-gray-200 bg-white py-2 text-xs uppercase tracking-[0.2em] text-gray-500 shadow-lg">
            <button
              className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100"
              type="button"
              onClick={handleExport}
            >
              Export
            </button>
            <button
              className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100"
              type="button"
              onClick={handleImport}
            >
              Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
