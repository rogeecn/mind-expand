"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type CompactNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
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
        "group relative h-[96px] w-auto min-w-[180px] max-w-[300px] rounded-sm border px-3 py-2 text-left text-sm transition",
        selected
          ? "border-black bg-black text-white"
          : "border-gray-200 text-ink hover:border-gray-500",
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
      <div className="min-w-0 pr-7">
        <div className="line-clamp-2 font-serif text-sm font-semibold tracking-tight">
          {data.title}
        </div>
        {data.isRoot && (
          <div
            className={clsx(
              "line-clamp-2 mt-1 text-xs leading-relaxed",
              selected || data.colorTag === "ink" ? "text-gray-200" : "text-gray-600"
            )}
          >
            {data.description}
          </div>
        )}
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
