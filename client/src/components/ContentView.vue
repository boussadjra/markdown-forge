<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import mermaid from 'mermaid';
import type { MarkdownDocument } from '../types';

const props = defineProps<{
  doc: MarkdownDocument;
}>();

const container = ref<HTMLElement | null>(null);

function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

function configureMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark() ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily:
      "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    themeVariables: {
      fontFamily:
        "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      primaryColor: isDark() ? '#1e293b' : '#eff6ff',
      primaryTextColor: isDark() ? '#f8fafc' : '#0f172a',
      primaryBorderColor: isDark() ? '#3b82f6' : '#60a5fa',
      lineColor: isDark() ? '#64748b' : '#94a3b8',
      secondaryColor: isDark() ? '#0f172a' : '#f1f5f9',
      tertiaryColor: isDark() ? '#334155' : '#e2e8f0',
    },
    flowchart: { curve: 'basis', htmlLabels: true, padding: 16, useMaxWidth: true },
    sequence: { useMaxWidth: true, actorMargin: 60, wrap: true },
    gantt: { useMaxWidth: true },
    journey: { useMaxWidth: true },
  });
}

function resetMermaidNodes() {
  if (!container.value) return;
  container.value
    .querySelectorAll<HTMLElement>('pre.mermaid')
    .forEach((el) => {
      const src = el.getAttribute('data-mermaid-src');
      if (src !== null) {
        el.textContent = src;
        el.removeAttribute('data-processed');
      }
    });
}

async function renderMermaid() {
  if (!container.value) return;
  const nodes = Array.from(
    container.value.querySelectorAll<HTMLElement>('pre.mermaid:not([data-processed])'),
  );
  if (!nodes.length) return;
  configureMermaid();
  try {
    await mermaid.run({ nodes });
  } catch (err) {
    console.error('[markdown-forge] mermaid render failed:', err);
  }
}

watch(
  () => props.doc.html,
  async () => {
    await nextTick();
    renderMermaid();
  },
  { immediate: true },
);

// Re-render mermaid diagrams when dark mode toggles on <html>.
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        resetMermaidNodes();
        nextTick(renderMermaid);
        break;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });
});
onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <article ref="container">
    <h1
      v-if="doc.title"
      class="text-4xl font-bold mb-8 tracking-tight leading-tight"
      :style="{ color: 'var(--color-text-heading)' }"
    >
      {{ doc.title }}
    </h1>
    <div class="markdown-body" v-html="doc.html"></div>
  </article>
</template>
