"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type NYTNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
  isLoading?: boolean;
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
        "group relative flex h-[50px] w-auto min-w-[220px] max-w-[360px] items-center justify-center rounded-full border bg-white px-6 text-center text-ink shadow-sm transition",
        selected
          ? "border-2 border-amber-500"
          : "border-gray-200 hover:border-gray-500 hover:shadow-md",
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
        <h3 className="line-clamp-2 break-words text-center font-serif text-lg font-semibold tracking-tight">
          {data.title}
        </h3>
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
