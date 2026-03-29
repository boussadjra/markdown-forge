<script setup lang="ts">
import type { MarkdownDocument } from '../types';

defineProps<{
  doc: MarkdownDocument;
}>();
</script>

<template>
  <article>
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
