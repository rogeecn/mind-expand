"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";
import { ChevronDown, ChevronRight, Loader2, Plus, X } from "lucide-react";

export type NYTNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
  onExpand?: () => void;
  onToggleCollapse?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
};

export function NYTNode({ data, selected }: NodeProps<NYTNodeData>) {
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
         "group relative h-[160px] w-auto min-w-[220px] max-w-[360px] rounded-sm border p-4 text-left shadow-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500 hover:shadow-md",
        !selected && data.colorTag === "ink" && "bg-ink text-white",
        !selected && data.colorTag === "amber" && "bg-amber-100",
        !selected && data.colorTag === "sky" && "bg-sky-100",
        !selected && data.colorTag === "mint" && "bg-emerald-100"

       )}

    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
      {!data.isRoot && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            data.onDelete?.();
          }}
          className={clsx(
            "absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full border text-[10px] transition group-hover:flex",
            selected
              ? "border-white text-white"
              : "border-gray-300 text-gray-500 hover:border-gray-700 hover:text-gray-900"
          )}
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="min-w-0 pr-8">
        <h3 className="line-clamp-2 break-words font-serif text-lg font-semibold tracking-tight">
          {data.title}
        </h3>
        <p
          className={clsx(
            "line-clamp-3 mt-2 text-sm leading-relaxed",
            selected || data.colorTag === "ink" ? "text-gray-200" : "text-gray-600"
          )}
        >
          {data.description}
        </p>
      </div>
      <div className="absolute -right-4 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {!data.isRoot && data.hasChildren && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              data.onToggleCollapse?.();
            }}
            className={clsx(
              "hidden h-7 w-7 items-center justify-center rounded-full border bg-white text-xs transition group-hover:flex",
              selected
                ? "border-white bg-black text-white"
                : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
            )}
          >
            {data.isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (data.isLoading) return;
            data.onExpand?.();
          }}
          className={clsx(
            "h-9 w-9 items-center justify-center rounded-full border bg-white text-xs transition",
            data.isLoading ? "flex" : "hidden group-hover:flex",
            selected
              ? "border-white bg-black text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          {data.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
    </div>
  );
}
