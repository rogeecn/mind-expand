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
  collapsed?: boolean;
  hasChildren?: boolean;
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
        "group relative flex h-[50px] w-auto min-w-[220px] max-w-[360px] items-center justify-center rounded-sm border px-6 text-center text-ink transition-all duration-300",
        selected
          ? "border-2 border-black"
          : "border-gray-300 hover:border-black hover:shadow-sm",
        data.collapsed && data.hasChildren && "shadow-[3px_3px_0_white,4px_4px_0_#000,7px_7px_0_white,8px_8px_0_#000]",
        !data.collapsed && !selected && "shadow-[1px_1px_0_rgba(0,0,0,0.05)]",
        !data.colorTag && "bg-white",
        data.colorTag === "ink" && "bg-ink text-white",
        data.colorTag === "amber" && "bg-amber-100",
        data.colorTag === "sky" && "bg-sky-100",
        data.colorTag === "mint" && "bg-emerald-100"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
      <div className="min-w-0 relative">
        <h3 className="line-clamp-2 break-words text-center font-serif text-lg font-semibold tracking-tight">
          {data.title}
        </h3>
        {data.isLoading && (
           <div className="absolute -right-6 -bottom-1 flex h-6 w-6 items-center justify-center">
             <span className="node-loading-asterisk font-serif text-2xl leading-none text-black/50">*</span>
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
