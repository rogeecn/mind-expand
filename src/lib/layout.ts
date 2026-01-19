import type { NodeRecord } from "@/lib/db";
import { hierarchy, tree } from "d3-hierarchy";

const DEFAULT_ROW_GAP = 50;
const DEFAULT_COLUMN_GAP = 480;
const NYT_TITLE_CHARS = 20;
const NYT_DESC_CHARS = 32;
const COMPACT_TITLE_CHARS = 24;
const COMPACT_DESC_CHARS = 36;
const NYT_MAX_WIDTH = 360;
const COMPACT_MAX_WIDTH = 300;
const COLUMN_PADDING = 140;
const VERTICAL_PADDING = 24;

const estimateLines = (text: string, perLine: number) => {
  const trimmed = text.trim();
  if (!trimmed) return 1;
  return Math.max(1, Math.ceil(trimmed.length / perLine));
};

const estimateNodeHeight = (_node: NodeRecord) => {
  return 50;
};

const estimateNodeWidth = (node: NodeRecord) => {
  const isCompact = node.nodeStyle === "compact";
  const maxWidth = isCompact ? COMPACT_MAX_WIDTH : NYT_MAX_WIDTH;
  const perLine = isCompact ? COMPACT_TITLE_CHARS : NYT_TITLE_CHARS;
  const titleLines = estimateLines(node.title, perLine);
  const descLines = estimateLines(node.description, perLine + 6);
  const baseWidth = 220;
  const widthBoost = Math.min(maxWidth - baseWidth, (titleLines + descLines) * 24);
  return Math.min(maxWidth, baseWidth + widthBoost);
};

export function calculateChildPositions(
  parent: NodeRecord,
  existingChildren: NodeRecord[],
  count: number
) {
  const gapY = DEFAULT_ROW_GAP;
  const offsetX = DEFAULT_COLUMN_GAP;
  const startIndex = existingChildren.length;
  const total = existingChildren.length + count;
  return Array.from({ length: count }).map((_, index) => {
    const positionIndex = startIndex + index;
    const yOffset = (positionIndex - (total - 1) / 2) * gapY;
    return {
      x: parent.x + offsetX,
      y: parent.y + yOffset
    };
  });
}

type LayoutNode = NodeRecord & { children?: LayoutNode[] };

export function layoutWithD3Tree(nodes: NodeRecord[]) {
  const byParent = new Map<string | null, NodeRecord[]>();

  nodes.forEach((node) => {
    const key = node.parentId ?? null;
    const group = byParent.get(key) ?? [];
    group.push(node);
    byParent.set(key, group);
  });

  const roots = byParent.get(null) ?? [];
  if (roots.length === 0) return [];

  const buildTree = (node: NodeRecord): LayoutNode => {
    const children = byParent.get(node.id) ?? [];
    return {
      ...node,
      children: children.map(buildTree)
    };
  };

  const positions: { id: string; x: number; y: number }[] = [];
  const maxWidth = Math.max(
    ...nodes.map((node) => estimateNodeWidth(node) + COLUMN_PADDING)
  );
  const rowGap = DEFAULT_ROW_GAP;
  const treeLayout = tree<LayoutNode>().nodeSize([rowGap, maxWidth]);

  treeLayout.separation((a, b) => {
    const heightA = estimateNodeHeight(a.data) + VERTICAL_PADDING;
    const heightB = estimateNodeHeight(b.data) + VERTICAL_PADDING;
    const base = rowGap > 0 ? Math.max(heightA, heightB) / rowGap : 1;
    return a.parent === b.parent ? base : base + 0.6;
  });

  roots.forEach((root, index) => {
    const rootNode = buildTree(root);
    const rootHierarchy = hierarchy(rootNode);
    const layout = treeLayout(rootHierarchy);

    layout.each((node) => {
      positions.push({
        id: node.data.id,
        x: node.y,
        y: node.x + index * rowGap * 6
      });
    });
  });

  return positions;
}
