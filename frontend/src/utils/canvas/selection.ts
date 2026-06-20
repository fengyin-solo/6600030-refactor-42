export interface Point {
  x: number;
  y: number;
}

export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const sx = x1 + t * dx;
  const sy = y1 + t * dy;
  return Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
}

export interface ElementLike {
  id: number;
  nodeIds: [number, number];
}

export interface NodeLike {
  id: number;
  x: number;
  y: number;
}

export function findNearestElement(
  screenX: number,
  screenY: number,
  elements: ElementLike[],
  nodes: NodeLike[],
  worldToScreen: (x: number, y: number) => [number, number],
  threshold = 15
): number | null {
  const nodeMap = new Map<number, NodeLike>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  let bestDist = threshold;
  let bestId: number | null = null;

  for (const el of elements) {
    const n1 = nodeMap.get(el.nodeIds[0]);
    const n2 = nodeMap.get(el.nodeIds[1]);
    if (!n1 || !n2) continue;

    const [x1, y1] = worldToScreen(n1.x, n1.y);
    const [x2, y2] = worldToScreen(n2.x, n2.y);

    const dist = pointToSegmentDistance(screenX, screenY, x1, y1, x2, y2);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = el.id;
    }
  }

  return bestId;
}
