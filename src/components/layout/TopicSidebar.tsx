"use client";

import { db } from "@/lib/db";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { PanelLeftClose, Plus } from "lucide-react";

type SidebarProps = {
  activeTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic: () => void;
  isOpen: boolean;
  onToggle: () => void;
};

export function TopicSidebar({
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
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
        <button
          onClick={onCreateTopic}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Topic</span>
        </button>
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
                  "relative w-full rounded-sm px-3 py-3 text-left transition",
                  topic.id === activeTopicId
                    ? "bg-gray-50 text-ink"
                    : "text-gray-600 hover:bg-gray-50 hover:text-ink"
                )}
              >
                <span
                  className={clsx(
                    "absolute left-0 top-3 h-6 w-0.5 rounded",
                    topic.id === activeTopicId ? "bg-black" : "bg-transparent"
                  )}
                />
                <div className="font-serif text-base font-semibold">
                  {topic.masterTitle || topic.rootKeyword}
                </div>
                <div
                  className={clsx(
                    "mt-1 line-clamp-2 text-xs",
                    topic.id === activeTopicId ? "text-gray-500" : "text-gray-400"
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
