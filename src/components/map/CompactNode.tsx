"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type CompactNodeData = {
  title: string;
  description: string;
  isLoading?: boolean;
};

export function CompactNode({ data, selected }: NodeProps<CompactNodeData>) {
  return (
    <div
      className={clsx(
        "w-48 rounded-sm border bg-white px-3 py-2 text-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500"
      )}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div className="font-serif text-sm font-semibold tracking-tight">
        {data.title}
      </div>
      <div
        className={clsx("mt-1 text-xs", selected ? "text-gray-200" : "text-gray-600")}
      >
        {data.description}
      </div>
      {data.isLoading && <div className="mt-2 h-1 w-16 bg-gray-300" />}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
