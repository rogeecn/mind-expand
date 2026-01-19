"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";
import { Plus } from "lucide-react";

export type NYTNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
};

export function NYTNode({ data, selected }: NodeProps<NYTNodeData>) {
  return (
    <div
      className={clsx(
        "group w-64 rounded-sm border bg-white p-4 shadow-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500 hover:shadow-md"
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-semibold tracking-tight">
            {data.title}
          </h3>
          <p
            className={clsx(
              "mt-2 text-sm",
              selected ? "text-gray-200" : "text-gray-600"
            )}
          >
            {data.description}
          </p>
        </div>
        <span
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition",
            selected
              ? "border-white text-white"
              : "border-gray-300 text-gray-500 group-hover:border-gray-700 group-hover:text-gray-900"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </div>
      {data.isLoading && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-gray-200">
          <div className="h-full w-2/3 animate-pulse bg-gray-500" />
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="opacity-0"
      />
    </div>
  );
}
