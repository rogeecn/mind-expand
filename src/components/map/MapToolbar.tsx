"use client";

import { Waves, LayoutGrid, Focus } from "lucide-react";

type ToolbarProps = {
  edgeStyle: "bezier" | "step";
  nodeStyle: "nyt" | "compact";
  onToggleEdgeStyle: () => void;
  onToggleNodeStyle: () => void;
  onFitView: () => void;
  onExport: () => void;
  onImport: () => void;
};

export function MapToolbar({
  edgeStyle,
  nodeStyle,
  onToggleEdgeStyle,
  onToggleNodeStyle,
  onFitView,
  onExport,
  onImport
}: ToolbarProps) {
  const buttonBase =
    "inline-flex items-center gap-2 rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-600 transition hover:border-black hover:text-black";

  return (
    <div className="pointer-events-auto fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <button className={buttonBase} type="button" onClick={onFitView}>
        <Focus className="h-3.5 w-3.5" />
        Fit
      </button>
      <button className={buttonBase} type="button" onClick={onToggleEdgeStyle}>
        <Waves className="h-3.5 w-3.5" />
        {edgeStyle === "bezier" ? "Curve" : "Step"}
      </button>
      <button className={buttonBase} type="button" onClick={onToggleNodeStyle}>
        <LayoutGrid className="h-3.5 w-3.5" />
        {nodeStyle === "nyt" ? "Card" : "Compact"}
      </button>
      <button className={buttonBase} type="button" onClick={onExport}>
        Export
      </button>
      <button className={buttonBase} type="button" onClick={onImport}>
        Import
      </button>
    </div>
  );
}
