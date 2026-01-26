"use client";

import clsx from "clsx";
import { MessageSquare } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";

export type CompactNodeData = {
  title: string;
  description: string;
  isRoot?: boolean;
  colorTag?: "ink" | "amber" | "sky" | "mint" | null;
  isLoading?: boolean;
  onSelect?: () => void;
  collapsed?: boolean;
  hasChatHistory?: boolean;
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
        "group relative flex h-[50px] w-auto min-w-[180px] max-w-[300px] items-center justify-center rounded-full border px-5 text-center text-sm text-ink transition-all duration-300",
        selected
          ? "border-2 border-amber-500"
          : "border-gray-200 hover:border-gray-500",
        data.collapsed && "shadow-[3px_3px_0_white,4px_4px_0_#000,7px_7px_0_white,8px_8px_0_#000]",
        !data.colorTag && "bg-white",
        data.colorTag === "ink" && "bg-ink text-white",
        data.colorTag === "amber" && "bg-amber-100",
        data.colorTag === "sky" && "bg-sky-100",
        data.colorTag === "mint" && "bg-emerald-100",
        data.isLoading && "node-loading"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0 pointer-events-none cursor-default"
      />
      <div className="min-w-0 flex items-center justify-center gap-2">
        <div className="line-clamp-2 text-center font-serif text-sm font-semibold tracking-tight">
          {data.title}
        </div>
        {data.hasChatHistory && !data.isLoading && (
          <MessageSquare className="h-3 w-3 text-gray-500" aria-label="已有研讨记录" />
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
