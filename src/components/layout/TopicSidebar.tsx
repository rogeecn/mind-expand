"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type TopicRecord } from "@/lib/db";
import clsx from "clsx";
import { Plus } from "lucide-react";

type SidebarProps = {
  activeTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic: () => void;
};

export function TopicSidebar({ activeTopicId, onSelectTopic, onCreateTopic }: SidebarProps) {
  const topics = useLiveQuery(async () => {
    return db.topics.orderBy("updatedAt").reverse().toArray();
  }, []);

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-gray-100 bg-white">
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">Topics</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">Mind Expand</h1>
        </div>
        <button
          type="button"
          onClick={onCreateTopic}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-black hover:text-black"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mx-5 h-px bg-gray-200" />
      <div className="flex-1 overflow-y-auto px-4 py-5">
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
                  {topic.rootKeyword}
                </div>
                <div
                  className={clsx(
                    "mt-1 line-clamp-2 text-xs",
                    topic.id === activeTopicId ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {topic.description || "No description"}
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
