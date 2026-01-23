"use client";

import { db } from "@/lib/db";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { PanelLeftClose, Plus, Settings, Search } from "lucide-react";

type SidebarProps = {
  activeTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic: () => void;
  onOpenManager: () => void;
  isOpen: boolean;
  onToggle: () => void;
};

export function TopicSidebar({
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
  onOpenManager,
  isOpen,
  onToggle
}: SidebarProps) {
  const topics = useLiveQuery(async () => {
    return db.topics.orderBy("updatedAt").reverse().toArray();
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <aside
      className={clsx(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out",
        isOpen ? "w-[320px] translate-x-0" : "w-0 -translate-x-full overflow-hidden opacity-0"
      )}
    >
      {/* Masthead Header */}
      <div className="flex flex-col px-6 pt-8 pb-6 min-w-[320px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-black tracking-tight text-ink">
              MIND EXPAND
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
              Personal Knowledge Index
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="group -mr-2 flex h-8 w-8 items-center justify-center text-gray-400 hover:text-ink"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="px-6 pb-6 min-w-[320px]">
        <div className="flex items-stretch gap-3">
          <button
            onClick={onCreateTopic}
            className="flex flex-1 items-center justify-center gap-2 bg-ink text-white px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-black hover:shadow-md active:translate-y-px"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Topic</span>
          </button>
          <button
            type="button"
            onClick={onOpenManager}
            className="flex w-12 items-center justify-center border border-gray-200 text-gray-500 transition-all hover:border-ink hover:text-ink active:translate-y-px"
            aria-label="Backup manager"
            title="Manage Data"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-6 border-b border-gray-100" />

      {/* Topic Index List */}
      <div className="flex-1 overflow-y-auto min-w-[320px]">
        {topics?.length ? (
          <div className="flex flex-col">
            {topics.map((topic, index) => {
              const isActive = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onSelectTopic(topic.id)}
                  className={clsx(
                    "group relative w-full border-b border-gray-100 py-5 pl-6 pr-6 text-left transition-colors duration-200",
                    isActive ? "bg-white" : "hover:bg-gray-50/50"
                  )}
                >
                  {/* Active Indicator Line */}
                  <span
                    className={clsx(
                      "absolute left-0 top-0 bottom-0 w-[4px] transition-colors",
                      isActive ? "bg-ink" : "bg-transparent group-hover:bg-gray-200"
                    )}
                  />

                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-serif text-lg font-bold leading-none text-ink truncate pr-4">
                       {topic.masterTitle || topic.rootKeyword}
                    </span>
                    <span className={clsx("text-[10px] font-mono tracking-tighter shrink-0", isActive ? "text-ink" : "text-gray-300")}>
                      #{String(topics.length - index).padStart(2, '0')}
                    </span>
                  </div>

                  <p
                    className={clsx(
                      "line-clamp-2 text-xs leading-relaxed font-sans mb-2.5",
                      isActive ? "text-gray-600" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  >
                    {topic.globalConstraints || topic.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
                       {formatDate(topic.updatedAt)}
                     </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-serif text-lg italic text-gray-300">No topics found.</p>
            <p className="mt-2 text-xs text-gray-400">Start your first exploration above.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

