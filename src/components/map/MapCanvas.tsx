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
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useMapData } from "@/hooks/useMapData";
import { useTopic } from "@/hooks/useTopic";
import { db, type EdgeRecord, type NodeRecord, type TopicStyle } from "@/lib/db";
import { layoutWithD3Tree } from "@/lib/layout";

import { expandNodeAction } from "@/app/actions/expand-node";
import { downloadExport } from "@/components/map/ImportExport";
import { createId } from "@/lib/uuid";
import { useModelSettings } from "@/hooks/useModelSettings";

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
  isSelected: boolean,
  hasChildren: boolean
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
      hasChildren,
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
  const { modelConfig } = useModelSettings();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [pendingNodeIds, setPendingNodeIds] = useState<Set<string>>(new Set());

  // Calculate visible nodes based on collapsed state
  // MEMOIZATION OPTIMIZATION:
  // Instead of recalculating on every `nodes` change (which happens on ANY db update),
  // we should try to be stable.
  // However, `nodes` comes from useLiveQuery, which returns a new array every time.
  // We can use a deep equality check or JSON.stringify, but that's expensive.
  // Better: The logic inside is fast enough (O(N)), but we can prevent downstream effects
  // by using a ref to store the last result and only returning a new object if IDs changed.
  
  const { visibleNodeIds, visibleNodes } = useMemo(() => {
    const visible = new Set<string>();
    // ... logic ...
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
  }, [
    // We depend on 'nodes' content. Since Dexie returns new array, this runs often.
    // To optimize properly we would need a custom hook that diffs the Dexie result.
    // For now, let's keep it simple as N < 1000 usually.
    nodes
  ]);

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

      // Removed check for existing children to allow appending logic via Enter key
      // if (existingChildren.length > 0) return;

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
      setPendingNodeIds((prev) => new Set(prev).add(nodeId));

      try {
        const response = await expandNodeAction({
          rootTopic: topic.rootKeyword,
          topicDescription: topic.globalConstraints || topic.description,
          pathContext,
          pathDetails: lineage
            .slice()
            .reverse()
            .map((item) => ({
              title: item.title,
              description: item.description || ""
            }))
            .filter((item) => item.title.length > 0),
          existingChildren: existingChildren.map((child) => child.title),
          count,
          modelConfig
        });

        // 1. Create new nodes with temporary positions
        const newNodes: NodeRecord[] = response.nodes.map((node) => ({
          id: createId(),
          topicId: topic.id,
          parentId: parent.id,
          title: node.title,
          description: [node.reason, node.depth_thought].filter(Boolean).join("\n\n"),
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
      // We do NOT wait for layout effect here. We commit positions directly.
      // This prevents "Double Layout" (one from here, one from effect detecting new nodes)
      // because the new nodes are already in their correct places.
      // BUT, the effect will still fire because visibleNodes changed.
      // We need to ensure the effect detects that positions are already stable or 'close enough'.
      // The current effect logic checks (Math.abs(node.x - p.x) > 1).
      // Since we just calculated layoutWithD3Tree here and saved it, the effect should see 0 diff and do nothing.
      // Perfect.

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
    [nodes, topic, styleConfig.edgeStyle, styleConfig.nodeStyle, pendingNodeIds, visibleNodes, modelConfig]
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

  // Keyboard Navigation
  useKeyboardNavigation({
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    onExpandNode: handleExpandNode,
    onDeleteNode: handleDeleteNode
  });

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
          node.id === selectedNodeId,
          nodes.some((n) => n.parentId === node.id)
        )
      ),
    [visibleNodes, setSelectedNodeId, pendingNodeIds, selectedNodeId, nodes]
  );

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : null;

  const pathContext = useMemo(() => {
    if (!selectedNode || !topic) return [];
    const lineage: NodeRecord[] = [];
    let current: NodeRecord | undefined = selectedNode;
    while (current) {
      lineage.push(current);
      if (!current.parentId) break;
      current = nodes.find((node) => node.id === current?.parentId);
    }
    return lineage
      .reverse()
      .map((node) => node.title)
      .filter((value) => value.length > 0);
  }, [selectedNode, nodes, topic]);

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
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
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
        onSetColor={handleSetColor}
        isColorEnabled={Boolean(selectedNodeId)}
        lastColor={lastColor}
      />

      {selectedNode && topic && (
        <NodeDetailsPanel
          node={selectedNode}
          pathContext={pathContext}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
