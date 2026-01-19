"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronUp, X } from "lucide-react";
import type { NodeRecord } from "@/lib/db";

type NodeDetailsPanelProps = {
  node: NodeRecord;
  onClose: () => void;
};

export function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={clsx(
        "pointer-events-auto absolute bottom-0 left-0 right-0 z-30 rounded-t-sm border-t border-gray-200 bg-white shadow-[0_-12px_30px_rgba(0,0,0,0.12)]",
        expanded ? "h-[75vh]" : "h-[33vh]"
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Details</p>
          <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{node.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <ChevronUp
              className={clsx("h-4 w-4 transition", expanded && "rotate-180")}
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex h-[calc(100%-88px)] flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {node.description}
          </p>
        </div>
        <div className="border-t border-gray-200 px-6 py-3 text-xs uppercase tracking-[0.3em] text-gray-400">
          AI expansion ready
        </div>
      </div>
    </aside>
  );
}
