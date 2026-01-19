import type { NodeRecord } from "@/lib/db";

export function calculateChildPositions(
  parent: NodeRecord,
  existingChildren: NodeRecord[],
  count: number
) {
  const gapY = 140;
  const offsetX = 300;
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
