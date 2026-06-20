export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const FIT_MARGIN = 60;

export function createViewport(): {
  worldToScreen: (x: number, y: number) => [number, number];
  screenToWorld: (sx: number, sy: number) => [number, number];
  pan: (dx: number, dy: number) => void;
  zoomAt: (screenX: number, screenY: number, factor: number) => void;
  fitToBounds: (bounds: Bounds, canvasWidth: number, canvasHeight: number) => void;
  resetUserTransform: () => void;
  getUserScale: () => number;
  setUserScale: (scale: number) => void;
} {
  let baseScale = 1;
  let baseOffsetX = 0;
  let baseOffsetY = 0;

  let userScale = 1;
  let userOffsetX = 0;
  let userOffsetY = 0;

  function getScale(): number {
    return baseScale * userScale;
  }

  function getOffsetX(): number {
    return baseOffsetX + userOffsetX;
  }

  function getOffsetY(): number {
    return baseOffsetY + userOffsetY;
  }

  function worldToScreen(x: number, y: number): [number, number] {
    return [x * getScale() + getOffsetX(), y * getScale() + getOffsetY()];
  }

  function screenToWorld(sx: number, sy: number): [number, number] {
    const scale = getScale();
    return [(sx - getOffsetX()) / scale, (sy - getOffsetY()) / scale];
  }

  function pan(dx: number, dy: number): void {
    userOffsetX += dx;
    userOffsetY += dy;
  }

  function zoomAt(screenX: number, screenY: number, factor: number): void {
    const [worldX, worldY] = screenToWorld(screenX, screenY);
    const newUserScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, userScale * factor));
    const newScale = baseScale * newUserScale;
    userOffsetX = screenX - worldX * newScale - baseOffsetX;
    userOffsetY = screenY - worldY * newScale - baseOffsetY;
    userScale = newUserScale;
  }

  function fitToBounds(bounds: Bounds, canvasWidth: number, canvasHeight: number): void {
    const { minX, maxX, minY, maxY } = bounds;
    const worldW = maxX - minX || 1;
    const worldH = maxY - minY || 1;

    baseScale = Math.min(
      (canvasWidth - FIT_MARGIN * 2) / worldW,
      (canvasHeight - FIT_MARGIN * 2) / worldH
    );

    baseOffsetX = FIT_MARGIN - minX * baseScale + (canvasWidth - FIT_MARGIN * 2 - worldW * baseScale) / 2;
    baseOffsetY = FIT_MARGIN - minY * baseScale + (canvasHeight - FIT_MARGIN * 2 - worldH * baseScale) / 2;
  }

  function getUserScale(): number {
    return userScale;
  }

  function setUserScale(scale: number): void {
    userScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  }

  function resetUserTransform(): void {
    userScale = 1;
    userOffsetX = 0;
    userOffsetY = 0;
  }

  return {
    worldToScreen,
    screenToWorld,
    pan,
    zoomAt,
    fitToBounds,
    resetUserTransform,
    getUserScale,
    setUserScale,
  };
}

export function computeBounds(nodes: { x: number; y: number }[]): Bounds {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }
  return { minX, maxX, minY, maxY };
}
