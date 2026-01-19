"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopicSidebar } from "@/components/layout/TopicSidebar";
import { TopicForm, type TopicFormValues } from "@/components/layout/TopicForm";
import { MapCanvas } from "@/components/map/MapCanvas";
import { useTopic } from "@/hooks/useTopic";
import { db } from "@/lib/db";
import type { NodeRecord } from "@/lib/db";
import { createId } from "@/lib/uuid";

export type AppShellMode = "create" | "view";

type AppShellProps = {
  mode: AppShellMode;
  topicId?: string | null;
};

export function AppShell({ mode, topicId = null }: AppShellProps) {
  const router = useRouter();
  const [activeTopicId, setActiveTopicId] = useState<string | null>(topicId);
  const [isCreating, setIsCreating] = useState(mode === "create");
  const [isReady, setIsReady] = useState(false);
  const { createTopic, topic } = useTopic(activeTopicId);

  useEffect(() => {
    setActiveTopicId(topicId ?? null);
  }, [topicId]);

  useEffect(() => {
    setIsCreating(mode === "create");
  }, [mode]);

  useEffect(() => {
    if (activeTopicId && topic) {
      setIsReady(true);
    }
  }, [activeTopicId, topic]);

  const handleSelectTopic = (id: string) => {
    localStorage.setItem("activeTopicId", id);
    setActiveTopicId(id);
    setIsCreating(false);
    router.push(`/topic/${id}`);
  };

  const handleCreateTopic = () => {
    setIsCreating(true);
    router.push("/topic/new");
  };

  const handleCreateSubmit = async ({ rootKeyword, description }: TopicFormValues) => {
    if (!rootKeyword.trim()) return;
    const trimmedDescription = description.trim();
    const newTopic = await createTopic(rootKeyword.trim(), trimmedDescription);
    const rootNode: NodeRecord = {
      id: createId(),
      topicId: newTopic.id,
      parentId: null,
      title: newTopic.rootKeyword,
      description: trimmedDescription || "Root topic",
      x: 0,
      y: 0,
      nodeStyle: newTopic.styleConfig.nodeStyle,
      createdAt: Date.now()
    };

    await db.nodes.put(rootNode);
    localStorage.setItem("activeTopicId", newTopic.id);
    setActiveTopicId(newTopic.id);
    setIsCreating(false);
    setIsReady(true);
    router.push(`/topic/${newTopic.id}`);
  };

  const rightContent = useMemo(() => {
    if (isCreating) {
      return <TopicForm onSubmit={handleCreateSubmit} />;
    }

    if (activeTopicId && topic && isReady) {
      return <MapCanvas topicId={activeTopicId} />;
    }

      return (
        <div className="flex h-full items-center justify-center px-10">
          <div className="max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Mind Expand</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-ink">
              Select a topic or create a new one.
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              Your mind maps live locally in this browser. Choose a topic on the left to continue.
            </p>
          </div>
        </div>
      );

  }, [activeTopicId, isCreating, isReady, topic]);

  return (
    <div className="flex h-screen bg-paper text-ink">
      <TopicSidebar
        activeTopicId={activeTopicId}
        onSelectTopic={handleSelectTopic}
        onCreateTopic={handleCreateTopic}
      />
      <main className="relative flex-1 overflow-hidden">
        {rightContent}
      </main>
    </div>
  );
}
