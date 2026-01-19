"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { NodeDetailsPanel } from "@/components/map/NodeDetailsPanel";
import { useMapData } from "@/hooks/useMapData";
import { useTopic } from "@/hooks/useTopic";
import { db, type EdgeRecord, type NodeRecord, type TopicStyle } from "@/lib/db";
import { calculateChildPositions, layoutWithD3Tree } from "@/lib/layout";
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
  pendingIds: Set<string>,
  onExpand: (nodeId: string) => void,
  onDelete: (nodeId: string) => void,
  onSelect: (nodeId: string) => void,
  hasChildren: boolean
) {
  return {
    id: node.id,
    type: node.nodeStyle,
    position: { x: node.x, y: node.y },
    data: {
      title: node.title,
      description: node.description,
      isLoading: pendingIds.has(node.id),
      hasChildren,
      onExpand: () => onExpand(node.id),
      onDelete: () => onDelete(node.id),
      onSelect: () => onSelect(node.id)
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
    updateNodePositions,
    setNodeStyleForTopic,
    setEdgeStyleForTopic,
    addNodes,
    addEdges
  } = useMapData(topicId);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    fitView: (options?: { padding?: number; duration?: number }) => void;
  } | null>(null);
  const [pendingNodeIds, setPendingNodeIds] = useState<Set<string>>(new Set());

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

  const onLayoutTree = useCallback(async () => {
    const layout = layoutWithD3Tree(nodes);
    if (layout.length === 0) return;
    await updateNodePositions(layout);
  }, [nodes, updateNodePositions]);

  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      if (pendingNodeIds.has(nodeId)) return;
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

      const count = 6;
      setPendingNodeIds((prev) => {
        const next = new Set(prev);
        next.add(parent.id);
        return next;
      });
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
        setPendingNodeIds((prev) => {
          const next = new Set(prev);
          next.delete(parent.id);
          return next;
        });
      }
    },
    [nodes, topic, styleConfig.edgeStyle, styleConfig.nodeStyle, addNodes, addEdges, pendingNodeIds]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      const targets = new Set<string>();
      const queue = [nodeId];

      while (queue.length) {
        const current = queue.shift();
        if (!current || targets.has(current)) continue;
        targets.add(current);
        nodes
          .filter((item) => item.parentId === current)
          .forEach((child) => queue.push(child.id));
      }

      if (targets.size === 0) return;

      const edgeIds = edges
        .filter((edge) => targets.has(edge.source) || targets.has(edge.target))
        .map((edge) => edge.id);

      await db.transaction("rw", db.nodes, db.edges, async () => {
        await db.nodes.bulkDelete(Array.from(targets));
        if (edgeIds.length) {
          await db.edges.bulkDelete(edgeIds);
        }
      });
    },
    [nodes, edges]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => {
        const hasChildren = nodes.some((item) => item.parentId === node.id);
        return mapNodeToFlow(
          node,
          pendingNodeIds,
          handleExpandNode,
          handleDeleteNode,
          setSelectedNodeId,
          hasChildren
        );
      }),
    [nodes, pendingNodeIds, handleExpandNode, handleDeleteNode, setSelectedNodeId]
  );

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : null;

  useEffect(() => {
    if (!selectedNodeId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNodeId]);

  return (
    <div className="relative h-full w-full bg-paper">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        onNodeDragStop={(_, node) => updateNodePosition(node.id, node.position.x, node.position.y)}
        nodesConnectable={false}
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
        onLayoutTree={onLayoutTree}
        onExport={onExport}
        onImport={onImport}
      />
      {selectedNode && (
        <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
      )}
    </div>
  );
}
