export interface RenderNode {
  id: number;
  x: number;
  y: number;
  fixed: boolean;
  displacementX?: number;
  displacementY?: number;
}

export interface RenderElement {
  id: number;
  nodeIds: [number, number];
  force?: number;
}

export interface RenderLoad {
  nodeId: number;
  fx: number;
  fy: number;
}

export interface RenderResult {
  stresses: number[];
  strains: number[];
  maxStress: number;
  maxDisplacement: number;
}

export interface RenderOptions {
  elementColors: Map<number, string>;
  selectedElement: number | null;
  showDeformed: boolean;
  deformationScale: number;
  heatmapMode: 'stress' | 'strain' | 'force';
  result?: RenderResult;
}

export function createRenderer(
  worldToScreen: (x: number, y: number) => [number, number]
): {
  render: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    nodes: RenderNode[],
    elements: RenderElement[],
    loads: RenderLoad[],
    options: RenderOptions
  ) => void;
} {
  function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
  }

  function drawEmptyState(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择一个预设模型开始分析', w / 2, h / 2);
  }

  function getNodeMap(nodes: RenderNode[]): Map<number, RenderNode> {
    const map = new Map<number, RenderNode>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }

  function drawElements(
    ctx: CanvasRenderingContext2D,
    elements: RenderElement[],
    nodeMap: Map<number, RenderNode>,
    options: RenderOptions
  ): void {
    for (const el of elements) {
      const n1 = nodeMap.get(el.nodeIds[0]);
      const n2 = nodeMap.get(el.nodeIds[1]);
      if (!n1 || !n2) continue;

      const [x1, y1] = worldToScreen(n1.x, n1.y);
      const [x2, y2] = worldToScreen(n2.x, n2.y);
      const color = options.elementColors.get(el.id) || '#6b7280';
      const isSelected = options.selectedElement === el.id;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 2.5;
      ctx.stroke();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawDeformedMesh(
    ctx: CanvasRenderingContext2D,
    elements: RenderElement[],
    nodeMap: Map<number, RenderNode>,
    options: RenderOptions
  ): void {
    if (!options.showDeformed || !options.result) return;

    ctx.setLineDash([5, 3]);
    const s = options.deformationScale;

    for (const el of elements) {
      const n1 = nodeMap.get(el.nodeIds[0]);
      const n2 = nodeMap.get(el.nodeIds[1]);
      if (!n1 || !n2) continue;

      const dx1 = n1.displacementX || 0;
      const dy1 = n1.displacementY || 0;
      const dx2 = n2.displacementX || 0;
      const dy2 = n2.displacementY || 0;

      const [x1, y1] = worldToScreen(n1.x + dx1 * s, n1.y + dy1 * s);
      const [x2, y2] = worldToScreen(n2.x + dx2 * s, n2.y + dy2 * s);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawNodes(
    ctx: CanvasRenderingContext2D,
    nodes: RenderNode[],
    nodeMap: Map<number, RenderNode>
  ): void {
    for (const node of nodes) {
      const [x, y] = worldToScreen(node.x, node.y);

      if (node.fixed) {
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x - 6, y + 4);
        ctx.lineTo(x + 6, y + 4);
        ctx.closePath();
        ctx.fillStyle = '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1;
        for (let i = -8; i <= 8; i += 4) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + 5);
          ctx.lineTo(x + i - 3, y + 10);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawLoads(
    ctx: CanvasRenderingContext2D,
    loads: RenderLoad[],
    nodeMap: Map<number, RenderNode>
  ): void {
    for (const load of loads) {
      const node = nodeMap.get(load.nodeId);
      if (!node) continue;
      const [x, y] = worldToScreen(node.x, node.y);

      const mag = Math.sqrt(load.fx ** 2 + load.fy ** 2);
      if (mag === 0) continue;

      const arrowLen = 30;
      const dx = (load.fx / mag) * arrowLen;
      const dy = (load.fy / mag) * arrowLen;

      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const headLen = 8;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLen * Math.cos(angle - 0.4), y - headLen * Math.sin(angle - 0.4));
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLen * Math.cos(angle + 0.4), y - headLen * Math.sin(angle + 0.4));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(mag / 1000).toFixed(1)}kN`, x - dx / 2, y - dy / 2 - 6);
    }
  }

  function drawLegend(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    elements: RenderElement[],
    options: RenderOptions
  ): void {
    const legendX = w - 40;
    const legendY = 30;
    const legendH = h - 60;
    const legendW = 15;

    const gradient = ctx.createLinearGradient(0, legendY, 0, legendY + legendH);
    gradient.addColorStop(0, 'rgb(255,0,0)');
    gradient.addColorStop(0.25, 'rgb(255,255,0)');
    gradient.addColorStop(0.5, 'rgb(0,255,0)');
    gradient.addColorStop(0.75, 'rgb(0,255,255)');
    gradient.addColorStop(1, 'rgb(0,0,128)');

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendW, legendH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendW, legendH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';

    let maxVal = 0;
    if (options.result) {
      switch (options.heatmapMode) {
        case 'stress':
          maxVal = Math.max(...options.result.stresses.map(Math.abs));
          break;
        case 'strain':
          maxVal = Math.max(...options.result.strains.map(Math.abs));
          break;
        case 'force':
          maxVal = Math.max(...elements.map((e) => Math.abs(e.force || 0)));
          break;
      }
    }

    const unit =
      options.heatmapMode === 'stress' ? 'MPa' :
      options.heatmapMode === 'strain' ? '%' : 'kN';

    ctx.textAlign = 'right';
    ctx.fillText(`${maxVal.toExponential(1)} ${unit}`, legendX - 4, legendY + 8);
    ctx.fillText('0', legendX - 4, legendY + legendH);

    ctx.save();
    ctx.translate(legendX + legendW + 10, legendY + legendH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(options.heatmapMode.toUpperCase(), 0, 0);
    ctx.restore();
  }

  function render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    nodes: RenderNode[],
    elements: RenderElement[],
    loads: RenderLoad[],
    options: RenderOptions
  ): void {
    drawBackground(ctx, width, height);

    if (nodes.length === 0) {
      drawEmptyState(ctx, width, height);
      return;
    }

    const nodeMap = getNodeMap(nodes);

    drawElements(ctx, elements, nodeMap, options);
    drawDeformedMesh(ctx, elements, nodeMap, options);
    drawNodes(ctx, nodes, nodeMap);
    drawLoads(ctx, loads, nodeMap);
    drawLegend(ctx, width, height, elements, options);
  }

  return { render };
}
