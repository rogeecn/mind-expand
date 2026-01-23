import { useEffect } from "react";
import { type NodeRecord, db } from "@/lib/db";

type UseKeyboardNavigationProps = {
  nodes: NodeRecord[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  onExpandNode: (nodeId: string) => Promise<void>;
  onDeleteNode: (nodeId: string) => Promise<void>;
};

export function useKeyboardNavigation({
  nodes,
  selectedNodeId,
  setSelectedNodeId,
  onExpandNode,
  onDeleteNode
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!selectedNodeId) return;

    const handler = async (event: KeyboardEvent) => {
      // Allow normal typing if in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      const currentNode = nodes.find((n) => n.id === selectedNodeId);
      if (!currentNode) return;

      // Left: Collapse or Go to Parent
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();

        const hasChildren = nodes.some((n) => n.parentId === currentNode.id);
        const isCollapsed = currentNode.collapsed;

        if (hasChildren && !isCollapsed) {
          await db.nodes.update(currentNode.id, { collapsed: true });
        } else if (currentNode.parentId) {
          setSelectedNodeId(currentNode.parentId);
        }
      }

      // Right: Expand or Go to First Child
      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();

        const children = nodes.filter((n) => n.parentId === currentNode.id);
        const hasChildren = children.length > 0;

        if (currentNode.collapsed) {
          await db.nodes.update(currentNode.id, { collapsed: false });
        } else if (hasChildren) {
          // Sort visually by Y position to find "top-most" or "middle"
          // Standard tree behavior usually selects the first/top child
          const sortedChildren = children.sort((a, b) => a.y - b.y);
          // Selection strategy: Middle child often feels most natural in radial/tree maps, 
          // but first child is safer standard. Let's stick to middle for "center-out" feel.
          const middleIndex = Math.floor(sortedChildren.length / 2);
          setSelectedNodeId(sortedChildren[middleIndex]?.id || sortedChildren[0].id);
        }
      }

      // Up/Down: Navigate Siblings
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();

        const parentId = currentNode.parentId;
        const siblings = nodes
          .filter((n) => n.parentId === parentId)
          .sort((a, b) => a.y - b.y);

        const currentIndex = siblings.findIndex((n) => n.id === currentNode.id);

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

      // Enter: Expand/Generate
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default if any
        void onExpandNode(selectedNodeId);
      }

      // Delete/Backspace: Delete Node
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        void onDeleteNode(selectedNodeId);
      }

      // Escape: Deselect
      if (event.key === "Escape") {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [selectedNodeId, nodes, setSelectedNodeId, onExpandNode, onDeleteNode]);
}
