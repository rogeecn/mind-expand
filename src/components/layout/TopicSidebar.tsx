"use client";

import { db } from "@/lib/db";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { PanelLeftClose, Plus, Settings } from "lucide-react";

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

  return (
    <aside
      className={clsx(
        "flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out",
        isOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full overflow-hidden opacity-0"
      )}
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4 min-w-72">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Mind Expand</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-black hover:text-black"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 min-w-72">
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateTopic}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-black active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            <span>New Topic</span>
          </button>
          <button
            type="button"
            onClick={onOpenManager}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 transition-all hover:border-black hover:text-ink active:translate-y-px"
            aria-label="Backup manager"
            title="备份管理"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-5 h-px bg-gray-200" />
      <div className="flex-1 overflow-y-auto px-4 py-5 min-w-72">
        {topics?.length ? (
          <div className="space-y-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onSelectTopic(topic.id)}
                className={clsx(
                  "relative w-full border-b border-transparent px-3 py-4 text-left transition group",
                  topic.id === activeTopicId
                    ? "bg-gray-50 text-ink border-gray-200"
                    : "text-gray-600 hover:text-ink hover:bg-gray-50/50"
                )}
              >
                <div className={clsx("font-serif text-lg leading-tight transition-colors", topic.id === activeTopicId ? "font-bold text-black" : "font-medium")}>
                  {topic.masterTitle || topic.rootKeyword}
                </div>
                <div
                  className={clsx(
                    "mt-2 line-clamp-2 text-xs leading-relaxed",
                    topic.id === activeTopicId ? "text-gray-600" : "text-gray-400 group-hover:text-gray-500"
                  )}
                >
                  {topic.globalConstraints || topic.description || "No description"}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-2 py-6 text-sm text-gray-500">No topics yet.</div>
        )}
      </div>
    </aside>
  );
}
