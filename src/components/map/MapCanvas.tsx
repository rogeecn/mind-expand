"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlowInstance,
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
  isLoading: boolean,
  isSelected: boolean
) {
  return {
    id: node.id,
    type: node.nodeStyle,
    position: { x: node.x, y: node.y },
    selected: isSelected,
    data: {
      title: node.title,
      description: node.description,
      isRoot: node.parentId === null,
      colorTag: node.colorTag ?? null,
      collapsed: node.collapsed ?? false,
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [pendingNodeIds, setPendingNodeIds] = useState<Set<string>>(new Set());

  // Calculate visible nodes based on collapsed state
  const { visibleNodeIds, visibleNodes } = useMemo(() => {
    const visible = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const childrenMap = new Map<string, NodeRecord[]>();

    nodes.forEach(n => {
      if (n.parentId) {
        const children = childrenMap.get(n.parentId) || [];
        children.push(n);
        childrenMap.set(n.parentId, children);
      }
    });

    const queue = nodes.filter(n => n.parentId === null); // Roots
    const resultNodes: NodeRecord[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      visible.add(node.id);
      resultNodes.push(node);

      if (!node.collapsed) {
        const children = childrenMap.get(node.id);
        if (children) {
          queue.push(...children);
        }
      }
    }
    return { visibleNodeIds: visible, visibleNodes: resultNodes };
  }, [nodes]);

  const prevVisibleIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prevIds = prevVisibleIdsRef.current;

    // Check if the set of visible nodes has changed
    let hasChanged = prevIds.size !== visibleNodeIds.size;
    if (!hasChanged) {
      for (const id of visibleNodeIds) {
        if (!prevIds.has(id)) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      const layout = layoutWithD3Tree(visibleNodes);

      const meaningfulUpdates = layout.filter(p => {
        const node = visibleNodes.find(n => n.id === p.id);
        if (!node) return false;
        // Only update if position changed significantly (>1px) to avoid loops/noise
        return Math.abs(node.x - p.x) > 1 || Math.abs(node.y - p.y) > 1;
      });

      if (meaningfulUpdates.length > 0) {
        updateNodePositions(meaningfulUpdates);
      }

      prevVisibleIdsRef.current = visibleNodeIds;
    }
  }, [visibleNodeIds, visibleNodes, updateNodePositions]);

  const flowEdges = useMemo(() =>
    edges
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map(mapEdgeToFlow),
  [edges, visibleNodeIds]);

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
    const layout = layoutWithD3Tree(visibleNodes); // Only layout visible nodes!
    if (layout.length === 0) return;
    await updateNodePositions(layout);
  }, [visibleNodes, updateNodePositions]);

  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      if (pendingNodeIds.has(nodeId)) return;
      const parent = nodes.find((item) => item.id === nodeId);
      if (!parent || !topic) return;

      const existingChildren = nodes.filter((item) => item.parentId === parent.id);

      // If we already have children, this is just a UI expand (un-collapse)
      // BUT existing logic creates NEW nodes via AI.
      // The user distinction: Right Arrow = "Expand" (UI) or "Generate" (AI)?
      // If expanding a node that has existing children but is collapsed, we should just set collapsed=false.
      // If it is NOT collapsed and has NO children, maybe generate?

      if (parent.collapsed) {
        await db.nodes.update(parent.id, { collapsed: false });
        return;
      }

      // If already expanded and has children, do nothing (selection logic handles child selection separate)
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
          collapsed: false,
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
        // Only consider currently visible nodes plus the new ones for layout
        // Changing layout only for the expanded branch is tricky without disrupting others
        // But layoutWithD3Tree handles full tree. We should layout EVERYTHING or just subtree?
        // For now, let's keep existing behavior: re-layout everything that is relevant.
        // Actually, be careful not to layout hidden nodes into weird places.
        // We will layout visible nodes + new nodes.
        const allVisibleParams = [...visibleNodes, ...newNodes];
        const layoutPositions = layoutWithD3Tree(allVisibleParams);

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
    [nodes, topic, styleConfig.edgeStyle, styleConfig.nodeStyle, pendingNodeIds, visibleNodes]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId);
      if (!target || target.parentId === null) return;

      // Determine next node to select
      let nextSelectedId: string | null = null;
      if (target.parentId) {
        const siblings = nodes
          .filter((n) => n.parentId === target.parentId)
          .sort((a, b) => a.y - b.y);
        const index = siblings.findIndex((n) => n.id === nodeId);

        if (index !== -1) {
          if (index + 1 < siblings.length) {
            nextSelectedId = siblings[index + 1].id;
          } else if (index - 1 >= 0) {
            nextSelectedId = siblings[index - 1].id;
          } else {
            nextSelectedId = target.parentId;
          }
        }
      }

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

      if (nextSelectedId) {
        setSelectedNodeId(nextSelectedId);
      }
    },
    [nodes, edges]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastColor, setLastColor] = useState<NodeRecord["colorTag"]>(null);

  // Keyboard Navigation Handler
  useEffect(() => {
    if (!selectedNodeId) return;

    const handler = async (event: KeyboardEvent) => {
      // Allow normal typing if in input fields (though we don't have many here)
       if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      const currentNode = nodes.find(n => n.id === selectedNodeId);
      if (!currentNode) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();

        const hasChildren = nodes.some(n => n.parentId === currentNode.id);

        // Strategy:
        // 1. If has children AND is expanded (collapsed=false/undefined) -> Collapse
        // 2. If has children AND IS collapsed -> Go to parent
        // 3. If leaf (no children) -> Go to parent

        const isCollapsed = currentNode.collapsed;

        if (hasChildren && !isCollapsed) {
          // Collapse
          await db.nodes.update(currentNode.id, { collapsed: true });
        } else {
          // Select Parent
          if (currentNode.parentId) {
            setSelectedNodeId(currentNode.parentId);
          }
        }
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();

        const children = nodes.filter(n => n.parentId === currentNode.id);
        const hasChildren = children.length > 0;

        if (currentNode.collapsed) {
           // Expand
           await db.nodes.update(currentNode.id, { collapsed: false });
           // Re-layout? The useMapData hook might not trigger layout automatically on just 'collapsed' generic update if it doesn't change coordinates.
           // But changing 'collapsed' changes visibleNodes set, which might need layout adjustment if we were dynamically hiding.
           // However, if we just hide children, the parent stays put.
           // If we show children, they might need layout.
           // Let's trigger a layout after expand if needed.
           // For now, rely on render.
        } else if (hasChildren) {
          // Select first child (maybe middle child is better? or top most?)
          // Usually middle is best for tree navigation, or just first.
          // Let's sort by Y and pick middle or first.
          const sortedChildren = children.sort((a,b) => a.y - b.y);
          // Pick the middle one for intuitive navigation if tree is balanced, or first.
          // Standard tree behavior: First child or visually closest.
          const middleIndex = Math.floor(sortedChildren.length / 2);
          setSelectedNodeId(sortedChildren[middleIndex]?.id || sortedChildren[0].id);
        } else {
          // Generate? User did NOT explicitly ask for right arrow to generate.
          // They said "Right Arrow = Expand current node".
          // If no children, "Expand" usually does nothing or triggers generation.
          // Let's hook it to generate (handleExpandNode).
          handleExpandNode(currentNode.id);
        }
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();

        // Find siblings
        const parentId = currentNode.parentId;
        // Includes self
        const siblings = nodes
            .filter(n => n.parentId === parentId)
            .sort((a,b) => a.y - b.y);

        const currentIndex = siblings.findIndex(n => n.id === currentNode.id);

        if (event.key === "ArrowUp") {
          if (currentIndex > 0) {
            setSelectedNodeId(siblings[currentIndex - 1].id);
          }
        } else {
          if (currentIndex < siblings.length - 1) {
            setSelectedNodeId(siblings[currentIndex + 1].id);
          }
        }
      }

      if (event.key === "Enter") {
        // Maybe still useful for something? Or just map to Expand?
         handleExpandNode(selectedNodeId);
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        handleDeleteNode(selectedNodeId);
      }
      if (event.key === "Escape") {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [selectedNodeId, nodes, handleExpandNode, handleDeleteNode]);

  const lastCenteredRef = useRef<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!selectedNodeId || !reactFlowInstance) return;

    const node = visibleNodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    const flowNode = reactFlowInstance.getNode(node.id);
    const width = flowNode?.width ?? 200;
    const height = flowNode?.height ?? 50;

    const targetX = node.x + width / 2;
    const targetY = node.y + height / 2;

    const last = lastCenteredRef.current;
    const isNewSelection = last?.id !== node.id;
    const moved = !last || Math.abs(last.x - targetX) > 5 || Math.abs(last.y - targetY) > 5;

    if (isNewSelection || moved) {
      reactFlowInstance.setCenter(targetX, targetY, { duration: 400, zoom: reactFlowInstance.getZoom() });
      lastCenteredRef.current = { id: node.id, x: targetX, y: targetY };
    }
  }, [selectedNodeId, visibleNodes, reactFlowInstance]);

  const flowNodes = useMemo(
    () =>
      visibleNodes.map((node) =>
        mapNodeToFlow(
          node,
          setSelectedNodeId,
          pendingNodeIds.has(node.id),
          node.id === selectedNodeId
        )
      ),
    [visibleNodes, setSelectedNodeId, pendingNodeIds, selectedNodeId]
  );

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : null;

  const handleSetColor = async (color: NodeRecord["colorTag"]) => {
    if (!selectedNodeId) return;
    await db.nodes.update(selectedNodeId, { colorTag: color });
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
        nodesDraggable={false}
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
        isColorEnabled={Boolean(selectedNodeId)}
        lastColor={lastColor}
      />

      {selectedNode && (
        <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
      )}
    </div>
  );
}
