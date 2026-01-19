"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";

export type NYTNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
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
      <div className="min-w-0 pr-8">
        <h3 className="line-clamp-2 break-words font-serif text-lg font-semibold tracking-tight">
          {data.title}
        </h3>
        {data.isRoot && (
          <p
            className={clsx(
              "line-clamp-3 mt-2 text-sm leading-relaxed",
              selected || data.colorTag === "ink" ? "text-gray-200" : "text-gray-600"
            )}
          >
            {data.description}
          </p>
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
