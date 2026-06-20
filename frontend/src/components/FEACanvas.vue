<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useFEAStore } from '../store/fea';
import { createViewport, computeBounds } from '../utils/canvas/viewport';
import { createRenderer } from '../utils/canvas/renderer';
import { findNearestElement } from '../utils/canvas/selection';
import { createInteraction } from '../utils/canvas/interaction';

const store = useFEAStore();
const canvas = ref<HTMLCanvasElement>();

const viewport = createViewport();
const renderer = createRenderer(viewport.worldToScreen);

let lastBoundsKey = '';

function draw() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;

  const W = canvas.value!.width;
  const H = canvas.value!.height;
  const { nodes, elements, loads } = store.model;

  if (nodes.length > 0) {
    const bounds = computeBounds(nodes);
    const boundsKey = `${bounds.minX},${bounds.maxX},${bounds.minY},${bounds.maxY}`;

    if (boundsKey !== lastBoundsKey) {
      viewport.resetUserTransform();
      lastBoundsKey = boundsKey;
    }

    viewport.fitToBounds(bounds, W, H);
  }

  renderer.render(ctx, W, H, nodes, elements, loads, {
    elementColors: store.elementColors,
    selectedElement: store.selectedElement,
    showDeformed: store.showDeformed,
    deformationScale: store.deformationScale,
    heatmapMode: store.heatmapMode,
    result: store.result ? {
      stresses: store.result.stresses,
      strains: store.result.strains,
      maxStress: store.result.maxStress,
      maxDisplacement: store.result.maxDisplacement,
    } : undefined,
  });
}

const interaction = createInteraction({
  pan: viewport.pan,
  zoomAt: viewport.zoomAt,
  findNearestElement: (x: number, y: number) => {
    const { nodes, elements } = store.model;
    return findNearestElement(x, y, elements, nodes, viewport.worldToScreen);
  },
  onSelect: (id: number | null) => store.selectElement(id),
  onChange: () => draw(),
});

onMounted(() => {
  nextTick(draw);
});

watch(
  () => [
    store.model,
    store.result,
    store.showDeformed,
    store.deformationScale,
    store.selectedElement,
    store.heatmapMode,
    store.elementColors,
  ],
  () => nextTick(draw),
  { deep: true }
);
</script>

<template>
  <canvas
    ref="canvas"
    width="800"
    height="500"
    class="w-full rounded-lg border border-slate-700 cursor-crosshair"
    @mousedown="interaction.onMouseDown"
    @mousemove="interaction.onMouseMove"
    @mouseup="interaction.onMouseUp"
    @mouseleave="interaction.onMouseUp"
    @wheel="interaction.onWheel"
    @click="interaction.onClick"
  />
</template>
