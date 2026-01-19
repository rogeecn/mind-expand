"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type CompactNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
  isLoading?: boolean;
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
        "group relative flex h-[50px] w-auto min-w-[180px] max-w-[300px] items-center justify-center rounded-full border bg-white px-5 text-center text-sm text-ink transition",
        selected
          ? "border-2 border-amber-500"
          : "border-gray-200 hover:border-gray-500",
        data.colorTag === "ink" && "bg-ink text-white",
        data.colorTag === "amber" && "bg-amber-100",
        data.colorTag === "sky" && "bg-sky-100",
        data.colorTag === "mint" && "bg-emerald-100",
        data.isLoading && "animate-pulse"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
      <div className="min-w-0">
        <div className="line-clamp-2 text-center font-serif text-sm font-semibold tracking-tight">
          {data.title}
        </div>
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
