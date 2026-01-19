"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type CompactNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
  onExpand?: () => void;
};

export function CompactNode({ data, selected }: NodeProps<CompactNodeData>) {
  return (
    <div
      className={clsx(
        "w-auto min-w-[180px] max-w-[300px] rounded-sm border bg-white px-3 py-2 text-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500"
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-serif text-sm font-semibold tracking-tight break-words">
            {data.title}
          </div>
          <div
            className={clsx(
              "mt-1 text-xs leading-relaxed",
              selected ? "text-gray-200" : "text-gray-600"
            )}
          >
            {data.description}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            data.onExpand?.();
          }}
          className={clsx(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition",
            selected
              ? "border-white text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          <span className={clsx("text-xs", data.isLoading && "animate-spin")}>+</span>
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
