"use client";

import { useEffect, useRef, useState } from "react";
import { Focus, MoreHorizontal, TreePine } from "lucide-react";

type ToolbarProps = {
  onFitView: () => void;
  onExport: () => void;
  onImport: () => void;
  onLayoutTree: () => void;
};

export function MapToolbar({ onFitView, onExport, onImport, onLayoutTree }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonBase =
    "inline-flex items-center gap-2 rounded-sm border border-gray-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-600 transition hover:border-black hover:text-black";

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleExport = () => {
    setMenuOpen(false);
    onExport();
  };

  const handleImport = () => {
    setMenuOpen(false);
    onImport();
  };

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
