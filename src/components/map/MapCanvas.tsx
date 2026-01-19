"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes
} from "reactflow";
import "reactflow/dist/style.css";

import { CompactNode } from "@/components/map/CompactNode";
import { MapToolbar } from "@/components/map/MapToolbar";
import { NodeDetailsPanel } from "@/components/map/NodeDetailsPanel";
import { NYTNode } from "@/components/map/NYTNode";
import { useMapData } from "@/hooks/useMapData";
import { useTopic } from "@/hooks/useTopic";
import { db, type EdgeRecord, type NodeRecord, type TopicStyle } from "@/lib/db";
import { layoutWithD3Tree } from "@/lib/layout";

import { expandNodeAction } from "@/app/actions/expand-node";
import { downloadExport, importExportFile } from "@/components/map/ImportExport";
import { importPayload, validatePayload } from "@/hooks/useImportExport";
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
  onSelect: (nodeId: string) => void,
  isLoading: boolean
) {
  return {
    id: node.id,
    type: node.nodeStyle,
    position: { x: node.x, y: node.y },
    data: {
      title: node.title,
      description: node.description,
      isRoot: node.parentId === null,
      colorTag: node.colorTag ?? null,
      isLoading,
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
  const { topic } = useTopic(topicId);
  const { nodes, edges, updateNodePosition, updateNodePositions } = useMapData(topicId);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    fitView: (options?: { padding?: number; duration?: number }) => void;
  } | null>(null);
  const [pendingNodeIds, setPendingNodeIds] = useState<Set<string>>(new Set());

  const flowEdges = useMemo(() => edges.map(mapEdgeToFlow), [edges]);

  const styleConfig = topic?.styleConfig ?? defaultStyle;

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


      setPendingNodeIds((prev) => new Set(prev).add(nodeId));

      try {
        const response = await expandNodeAction({
          rootTopic: topic.rootKeyword,
          topicDescription: topic.description,
          pathContext,
          existingChildren: existingChildren.map((child) => child.title),

        });

        // 1. Create new nodes with temporary positions
        const newNodes: NodeRecord[] = response.nodes.map((nodeTitle) => ({
          id: createId(),
          topicId: topic.id,
          parentId: parent.id,
          title: nodeTitle,
          description: response.insight ?? "",
          x: 0,
          y: 0,
          nodeStyle: styleConfig.nodeStyle,
          colorTag: null,
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

        // 2. Calculate global layout immediately with merged data
        const allNodes = [...nodes, ...newNodes];
        const layoutPositions = layoutWithD3Tree(allNodes);

        // 3. Apply positions to new nodes
        const positionMap = new Map(layoutPositions.map((p) => [p.id, p]));
        newNodes.forEach((node) => {
          const pos = positionMap.get(node.id);
          if (pos) {
            node.x = pos.x;
            node.y = pos.y;
          }
        });

        // 4. Identify existing nodes that moved
        const existingNodesToUpdate = nodes
          .filter((n) => positionMap.has(n.id))
          .map((n) => {
            const pos = positionMap.get(n.id)!;
            if (Math.abs(n.x - pos.x) > 0.1 || Math.abs(n.y - pos.y) > 0.1) {
              return { ...n, x: pos.x, y: pos.y };
            }
            return null;
          })
          .filter((n): n is NodeRecord => n !== null);

        // 5. Commit all changes in one transaction
        await db.transaction("rw", db.nodes, db.edges, async () => {
          await db.nodes.bulkPut([...newNodes, ...existingNodesToUpdate]);
          await db.edges.bulkPut(newEdges);
        });


      } finally {
        setPendingNodeIds((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [nodes, topic, styleConfig.edgeStyle, styleConfig.nodeStyle, pendingNodeIds]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId);
      if (!target || target.parentId === null) return;

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
  const [activeColorTarget, setActiveColorTarget] = useState<string | null>(null);
  const [lastColor, setLastColor] = useState<NodeRecord["colorTag"]>(null);

  useEffect(() => {
    if (!selectedNodeId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleExpandNode(selectedNodeId);
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        handleDeleteNode(selectedNodeId);
      }
      if (event.key === "Escape") {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNodeId, handleExpandNode, handleDeleteNode]);

  const flowNodes = useMemo(
    () =>
      nodes.map((node) =>
        mapNodeToFlow(node, setSelectedNodeId, pendingNodeIds.has(node.id))
      ),
    [nodes, setSelectedNodeId, pendingNodeIds]
  );

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : null;

  useEffect(() => {
    setActiveColorTarget(selectedNodeId);
  }, [selectedNodeId]);

  const handleSetColor = async (color: NodeRecord["colorTag"]) => {
    if (!activeColorTarget) return;
    await db.nodes.update(activeColorTarget, { colorTag: color });
    setLastColor(color ?? null);
  };

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
        onFitView={onFitView}
        onLayoutTree={onLayoutTree}
        onExport={onExport}
        onImport={onImport}
        onSetColor={handleSetColor}
        isColorEnabled={Boolean(activeColorTarget)}
        lastColor={lastColor}
      />

      {selectedNode && (
        <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
      )}
    </div>
  );
}
