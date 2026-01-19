"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";
import { Plus, X } from "lucide-react";

export type NYTNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
  hasChildren?: boolean;
  onExpand?: () => void;
  onDelete?: () => void;
};

export function NYTNode({ data, selected }: NodeProps<NYTNodeData>) {
  return (
    <div
      className={clsx(
        "group relative w-auto min-w-[220px] max-w-[360px] rounded-sm border bg-white p-4 shadow-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500 hover:shadow-md"
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
          "absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full border text-[10px] transition group-hover:flex",
          selected
            ? "border-white text-white"
            : "border-gray-300 text-gray-500 hover:border-gray-700 hover:text-gray-900"
        )}
      >
        <X className="h-3 w-3" />
      </button>
      <div className="min-w-0 pr-8">
        <h3 className="font-serif text-lg font-semibold tracking-tight break-words">
          {data.title}
        </h3>
        <p
          className={clsx(
            "mt-2 text-sm leading-relaxed",
            selected ? "text-gray-200" : "text-gray-600"
          )}
        >
          {data.description}
        </p>
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
            "absolute -right-3 top-1/2 h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-xs transition",
            data.isLoading ? "flex" : "hidden group-hover:flex",
            selected
              ? "border-white bg-black text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          <Plus className={clsx("h-3.5 w-3.5", data.isLoading && "animate-spin")} />
        </button>
      )}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
