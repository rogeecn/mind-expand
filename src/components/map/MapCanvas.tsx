"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes,
  ConnectionLineType
} from "reactflow";
import "reactflow/dist/style.css";

import { NYTNode } from "@/components/map/NYTNode";
import { CompactNode } from "@/components/map/CompactNode";
import { MapToolbar } from "@/components/map/MapToolbar";
import { useMapData } from "@/hooks/useMapData";
import { useTopic } from "@/hooks/useTopic";
import type { EdgeRecord, NodeRecord, TopicStyle } from "@/lib/db";
import { calculateChildPositions } from "@/lib/layout";
import { downloadExport, importExportFile } from "@/components/map/ImportExport";
import { importPayload, validatePayload } from "@/hooks/useImportExport";
import { expandNodeAction } from "@/app/actions/expand-node";
import { createId } from "@/lib/uuid";

const nodeTypes: NodeTypes = {
  nyt: NYTNode,
  compact: CompactNode
};

const defaultStyle: TopicStyle = {
  edgeStyle: "bezier",
  nodeStyle: "nyt"
};

function mapNodeToFlow(
  node: NodeRecord,
  pendingId: string | null,
  onExpand: (nodeId: string) => void
) {
  return {
    id: node.id,
    type: node.nodeStyle,
    position: { x: node.x, y: node.y },
    data: {
      title: node.title,
      description: node.description,
      isLoading: node.id === pendingId,
      onExpand: () => onExpand(node.id)
    }
  } satisfies Node;
}

function mapEdgeToFlow(edge: EdgeRecord) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.edgeStyle === "step" ? "step" : "default"
  } satisfies Edge;
}

export function MapCanvas({ topicId }: { topicId: string }) {
  const { topic, updateStyle } = useTopic(topicId);
  const {
    nodes,
    edges,
    updateNodePosition,
    setNodeStyleForTopic,
    setEdgeStyleForTopic,
    addNodes,
    addEdges
  } = useMapData(topicId);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    fitView: (options?: { padding?: number; duration?: number }) => void;
  } | null>(null);
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);

  const flowEdges = useMemo(() => edges.map(mapEdgeToFlow), [edges]);

  const styleConfig = topic?.styleConfig ?? defaultStyle;

  const onToggleEdgeStyle = async () => {
    const next = styleConfig.edgeStyle === "bezier" ? "step" : "bezier";
    await updateStyle({ edgeStyle: next });
    await setEdgeStyleForTopic(next);
  };

  const onToggleNodeStyle = async () => {
    const next = styleConfig.nodeStyle === "nyt" ? "compact" : "nyt";
    await updateStyle({ nodeStyle: next });
    await setNodeStyleForTopic(next);
  };

  const onFitView = () => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 500 });
  };

  const onExport = () => {
    if (!topic) return;
    downloadExport({ topic, nodes, edges });
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      const payload = await importExportFile(input.files[0]);
      if (!validatePayload(payload)) return;
      await importPayload(payload);
      localStorage.setItem("activeTopicId", payload.topic.id);
      window.location.reload();
    };
    input.click();
  };

  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      const parent = nodes.find((item) => item.id === nodeId);
      if (!parent || !topic) return;

      const existingChildren = nodes.filter((item) => item.parentId === parent.id);
      if (existingChildren.length > 0) return;

      const lineage: NodeRecord[] = [];
      let currentParent: NodeRecord | undefined = parent;
      while (currentParent) {
        lineage.push(currentParent);
        if (!currentParent.parentId) break;
        currentParent = nodes.find((item) => item.id === currentParent?.parentId);
      }
      const pathContext = lineage
        .reverse()
        .map((item) => item.title)
        .filter((value) => value.length > 0);

      const count = 3;
      setPendingNodeId(parent.id);
      try {
        const response = await expandNodeAction({
          rootTopic: topic.rootKeyword,
          topicDescription: topic.description,
          pathContext,
          count
        });

        const positions = calculateChildPositions(parent, existingChildren, response.expansions.length);
        const newNodes: NodeRecord[] = response.expansions.map((expansion, index) => ({
          id: createId(),
          topicId: topic.id,
          parentId: parent.id,
          title: expansion.title,
          description: expansion.description,
          x: positions[index]?.x ?? parent.x + 280,
          y: positions[index]?.y ?? parent.y,
          nodeStyle: styleConfig.nodeStyle,
          createdAt: Date.now()
        }));

        const newEdges: EdgeRecord[] = newNodes.map((child) => ({
          id: createId(),
          topicId: topic.id,
          source: parent.id,
          target: child.id,
          edgeStyle: styleConfig.edgeStyle,
          createdAt: Date.now()
        }));

        await addNodes(newNodes);
        await addEdges(newEdges);
      } finally {
        setPendingNodeId(null);
      }
    },
    [nodes, topic, styleConfig.edgeStyle, styleConfig.nodeStyle, addNodes, addEdges]
  );

  const flowNodes = useMemo(
    () => nodes.map((node) => mapNodeToFlow(node, pendingNodeId, handleExpandNode)),
    [nodes, pendingNodeId, handleExpandNode]
  );

  return (
    <div className="relative h-full w-full bg-paper">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        onNodeDragStop={(_, node) => updateNodePosition(node.id, node.position.x, node.position.y)}
        fitView
        connectionLineType={
          styleConfig.edgeStyle === "step" ? ConnectionLineType.Step : ConnectionLineType.Bezier
        }
      >
        <Background gap={20} size={1} color="#e5e5e5" />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <MapToolbar
        edgeStyle={styleConfig.edgeStyle}
        nodeStyle={styleConfig.nodeStyle}
        onToggleEdgeStyle={onToggleEdgeStyle}
        onToggleNodeStyle={onToggleNodeStyle}
        onFitView={onFitView}
        onExport={onExport}
        onImport={onImport}
      />
    </div>
  );
}
