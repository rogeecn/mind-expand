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
    <aside className="flex h-screen w-72 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Topics</p>
          <h1 className="font-serif text-2xl font-semibold text-ink">Mind Expand</h1>
        </div>
        <button
          type="button"
          onClick={onCreateTopic}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-black hover:text-black"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {topics?.length ? (
          <div className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onSelectTopic(topic.id)}
                className={clsx(
                  "w-full rounded-sm border px-4 py-3 text-left transition",
                  topic.id === activeTopicId
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-ink hover:border-gray-500"
                )}
              >
                <div className="font-serif text-base font-semibold">
                  {topic.rootKeyword}
                </div>
                <div
                  className={clsx(
                    "mt-1 line-clamp-2 text-xs",
                    topic.id === activeTopicId ? "text-gray-200" : "text-gray-500"
                  )}
                >
                  {topic.description || "No description"}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-gray-500">No topics yet.</div>
        )}
      </div>
    </aside>
  );
}
