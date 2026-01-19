"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

import { X } from "lucide-react";

export type CompactNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
  hasChildren?: boolean;
  onExpand?: () => void;
  onDelete?: () => void;
};

export function CompactNode({ data, selected }: NodeProps<CompactNodeData>) {
  return (
    <div
      className={clsx(
        "group relative w-auto min-w-[180px] max-w-[300px] rounded-sm border bg-white px-3 py-2 text-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500"
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          data.onDelete?.();
        }}
        className={clsx(
          "absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded-full border text-[10px] transition group-hover:flex",
          selected
            ? "border-white text-white"
            : "border-gray-300 text-gray-500 hover:border-gray-700 hover:text-gray-900"
        )}
      >
        <X className="h-3 w-3" />
      </button>
      <div className="min-w-0 pr-7">
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
      {(data.isLoading || !data.hasChildren) && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (data.isLoading) return;
            data.onExpand?.();
          }}
          className={clsx(
            "absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[10px] transition",
            data.isLoading ? "flex" : "hidden group-hover:flex",
            selected
              ? "border-white bg-black text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          <span className={clsx("text-xs", data.isLoading && "animate-spin")}>+</span>
        </button>
      )}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
