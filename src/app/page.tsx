"use client";

import { useEffect, useState } from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { useTopic } from "@/hooks/useTopic";
import type { NodeRecord } from "@/lib/db";
import { db } from "@/lib/db";
import { createId } from "@/lib/uuid";

export default function HomePage() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [rootKeyword, setRootKeyword] = useState("");
  const { createTopic, topic } = useTopic(topicId);
  const [topicReady, setTopicReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("activeTopicId");
    if (stored) {
      setTopicId(stored);
      setTopicReady(true);
    }
  }, []);

  useEffect(() => {
    if (topicId && topic) {
      setTopicReady(true);
    }
  }, [topicId, topic]);

  const handleCreate = async () => {
    if (!rootKeyword.trim()) return;
    const newTopic = await createTopic(rootKeyword.trim());
    setTopicId(newTopic.id);
    localStorage.setItem("activeTopicId", newTopic.id);

    const rootNode: NodeRecord = {
      id: createId(),
      topicId: newTopic.id,
      parentId: null,
      title: newTopic.rootKeyword,
      description: "Root topic",
      x: 0,
      y: 0,
      nodeStyle: newTopic.styleConfig.nodeStyle,
      createdAt: Date.now()
    };

    await db.nodes.put(rootNode);
    setTopicReady(true);
  };

  if (topicId && topic && topicReady) {
    return <MapCanvas topicId={topicId} />;
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <h1 className="font-serif text-5xl font-bold tracking-tight text-ink">
          Mind Expand
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-700">
          A local-first, recursive mind map studio. Start with a topic, expand
          with AI, and explore without leaving the canvas.
        </p>
        <div className="mt-10 flex max-w-xl flex-col gap-4">
          <label className="text-sm uppercase tracking-widest text-gray-500">
            Root Topic
          </label>
          <input
            value={rootKeyword}
            onChange={(event) => setRootKeyword(event.target.value)}
            placeholder="Enter a topic"
            className="rounded-sm border border-gray-300 bg-white px-4 py-3 text-lg text-ink focus:border-black focus:outline-none"
          />
          <button
            className="rounded-sm border border-ink px-6 py-3 font-medium text-ink transition hover:bg-ink hover:text-white"
            onClick={handleCreate}
          >
            Create Map
          </button>
          <button
            className="rounded-sm border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:border-ink hover:text-ink"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/json";
              input.onchange = async () => {
                if (!input.files?.[0]) return;
                const { importExportFile } = await import("@/components/map/ImportExport");
                const { importPayload, validatePayload } = await import("@/hooks/useImportExport");
                const payload = await importExportFile(input.files[0]);
                if (!validatePayload(payload)) return;
                await importPayload(payload);
                localStorage.setItem("activeTopicId", payload.topic.id);
                window.location.reload();
              };
              input.click();
            }}
          >
            Import JSON
          </button>
        </div>
      </div>
    </main>
  );
}
