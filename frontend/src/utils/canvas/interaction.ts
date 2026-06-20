export interface InteractionHandlers {
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: WheelEvent) => void;
  onClick: (e: MouseEvent) => void;
}

export interface InteractionDeps {
  pan: (dx: number, dy: number) => void;
  zoomAt: (screenX: number, screenY: number, factor: number) => void;
  findNearestElement: (screenX: number, screenY: number) => number | null;
  onSelect: (id: number | null) => void;
  onChange: () => void;
}

export function createInteraction(deps: InteractionDeps): InteractionHandlers {
  let isDragging = false;
  let lastMouse = { x: 0, y: 0 };

  function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const target = e.currentTarget as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function onMouseDown(e: MouseEvent): void {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    lastMouse = { x: e.clientX, y: e.clientY };
    deps.pan(dx, dy);
    deps.onChange();
  }

  function onMouseUp(): void {
    isDragging = false;
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    deps.zoomAt(x, y, factor);
    deps.onChange();
  }

  function onClick(e: MouseEvent): void {
    const { x, y } = getCanvasCoords(e);
    const id = deps.findNearestElement(x, y);
    deps.onSelect(id);
    deps.onChange();
  }

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    onClick,
  };
}
