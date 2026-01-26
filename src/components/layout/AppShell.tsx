"use client";

import { TopicForm, type TopicFormValues } from "@/components/layout/TopicForm";
import { TopicSidebar } from "@/components/layout/TopicSidebar";
import { TopicManagerModal } from "@/components/layout/TopicManagerModal";
import { MapCanvas } from "@/components/map/MapCanvas";
import { SettingsModal } from "@/components/map/SettingsModal";
import { SettingsExportPanel } from "@/components/map/SettingsExportPanel";
import { expandNodeAction } from "@/app/actions/expand-node";
import { useTopic } from "@/hooks/useTopic";
import { calculateChildPositions } from "@/lib/layout";
import type { EdgeRecord, NodeRecord, TopicRecord } from "@/lib/db";
import { db } from "@/lib/db";
import { createId } from "@/lib/uuid";
import { PanelLeftOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { topic } = useTopic(activeTopicId);

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

  const handleCreateSubmit = async ({
    rootKeyword,
    description,
    masterTitle,
    globalConstraints,
    suggestedFocus
  }: TopicFormValues) => {
    const trimmedDescription = description.trim();
    const now = Date.now();

    const rootTitle = (masterTitle || rootKeyword).trim();
    const newTopic: TopicRecord = {
      id: createId(),
      rootKeyword: rootTitle,
      description: trimmedDescription || "Root topic",
      globalConstraints,
      masterTitle,
      suggestedFocus,
      styleConfig: {
        edgeStyle: "bezier",
        nodeStyle: "nyt"
      },
      createdAt: now,
      updatedAt: now
    };

    const rootNode: NodeRecord = {
      id: createId(),
      topicId: newTopic.id,
      parentId: null,
      title: rootTitle,
      description: newTopic.description,
      x: 0,
      y: 0,
      nodeStyle: newTopic.styleConfig.nodeStyle,
      colorTag: null,
      createdAt: now
    };

    await db.topics.put(newTopic);
    await db.nodes.put(rootNode);

    try {
      const response = await expandNodeAction({
        rootTopic: newTopic.rootKeyword,
        topicDescription: newTopic.globalConstraints || newTopic.description,
        pathContext: [newTopic.rootKeyword],
        pathDetails: [{ title: newTopic.rootKeyword, description: newTopic.description || "" }],
        existingChildren: [],
        count: 6
      });

      const positions = calculateChildPositions(rootNode, [], response.nodes.length);
      const newNodes: NodeRecord[] = response.nodes.map((node, index: number) => ({
        id: createId(),
        topicId: newTopic.id,
        parentId: rootNode.id,
        title: node.title,
        description: [node.reason, node.depth_thought].filter(Boolean).join("\n\n"),
        x: positions[index]?.x ?? rootNode.x + 280,
        y: positions[index]?.y ?? rootNode.y,
        nodeStyle: newTopic.styleConfig.nodeStyle,
        colorTag: null,
        createdAt: Date.now()
      }));

      const newEdges: EdgeRecord[] = newNodes.map((child) => ({
        id: createId(),
        topicId: newTopic.id,
        source: rootNode.id,
        target: child.id,
        edgeStyle: newTopic.styleConfig.edgeStyle,
        createdAt: Date.now()
      }));

      await db.transaction("rw", db.nodes, db.edges, async () => {
        await db.nodes.bulkPut(newNodes);
        await db.edges.bulkPut(newEdges);
      });
    } catch (error) {
      console.error("[create-topic] failed to prefill nodes", error);
    }

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
          onOpenManager={() => setIsManagerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <TopicManagerModal isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          exportView={<SettingsExportPanel />}
        />
      <main className="relative flex-1 overflow-hidden">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-black hover:text-black"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <div className="h-full overflow-y-auto">
          {rightContent}
        </div>
      </main>
    </div>
  );
}
