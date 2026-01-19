"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

import { Loader2, Plus, X } from "lucide-react";

export type CompactNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
  hasChildren?: boolean;
  onExpand?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
};

export function CompactNode({ data, selected }: NodeProps<CompactNodeData>) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onSelect?.();
        }
      }}
      onClick={() => data.onSelect?.()}
      className={clsx(
        "group relative h-[96px] w-auto min-w-[180px] max-w-[300px] rounded-sm border bg-white px-3 py-2 text-left text-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
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
        <div className="line-clamp-2 font-serif text-sm font-semibold tracking-tight">
          {data.title}
        </div>
        <div
          className={clsx(
            "line-clamp-2 mt-1 text-xs leading-relaxed",
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
            "absolute -right-4 top-1/2 h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[10px] transition",
            data.isLoading ? "flex" : "hidden group-hover:flex",
            selected
              ? "border-white bg-black text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          {data.isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      )}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
    </div>
  );
}
