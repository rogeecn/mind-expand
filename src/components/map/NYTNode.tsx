"use client";

import clsx from "clsx";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export type NYTNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
  isLoading?: boolean;
  onSelect?: () => void;
  collapsed?: boolean;
  hasChildren?: boolean;
};

export const NYTNode = memo(function NYTNode({ data, selected }: NodeProps<NYTNodeData>) {
  return (
    <div
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        data.onSelect?.();
      }}
      className={clsx(
        "group relative flex h-[50px] w-auto min-w-[220px] max-w-[360px] cursor-pointer items-center justify-center rounded-sm border px-6 text-center text-ink transition-all duration-200 focus:outline-none",
        selected
          ? "border-2 border-black shadow-md bg-white z-10"
          : "border-gray-300 hover:border-gray-500 hover:shadow-sm bg-white",
        data.collapsed && data.hasChildren && "shadow-[3px_3px_0_white,4px_4px_0_#000,7px_7px_0_white,8px_8px_0_#000]",
        !data.collapsed && !selected && "shadow-[1px_1px_0_rgba(0,0,0,0.05)]",
        // Color tags override background
        data.colorTag === "ink" && "bg-ink text-white border-ink",
        data.colorTag === "amber" && "bg-amber-100 border-amber-200",
        data.colorTag === "sky" && "bg-sky-100 border-sky-200",
        data.colorTag === "mint" && "bg-emerald-100 border-emerald-200"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
      <div className="min-w-0 relative flex items-center justify-center gap-2">
        <h3 className="line-clamp-2 break-words text-center font-serif text-lg font-semibold tracking-tight">
          {data.title}
        </h3>
        {data.isLoading && (
           <div className="flex items-center gap-[4px] shrink-0" title="AI 思考中">
             <div className="loading-dot" />
             <div className="loading-dot" />
             <div className="loading-dot" />
           </div>
        )}
        {!data.isLoading && !data.hasChildren && !data.isRoot && (
           <div className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
             <span className="text-xs text-gray-400 font-serif italic">+</span>
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
});
