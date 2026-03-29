<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { TreeNode } from '../types';

const props = defineProps<{
  node: TreeNode;
  current: string;
  depth: number;
}>();

const emit = defineEmits<{
  select: [path: string];
}>();

const expanded = ref(true);

const isMarkdown = props.node.type === 'file' && props.node.name.endsWith('.md');

function toggle() {
  if (props.node.type === 'dir') {
    expanded.value = !expanded.value;
  } else if (isMarkdown) {
    emit('select', props.node.path);
  }
}
</script>

<template>
  <div>
    <button
      class="w-full text-left py-1.5 pr-3 text-[13px] flex items-center gap-2 transition-colors rounded-md mx-1"
      :style="{
        paddingLeft: `${depth * 16 + 12}px`,
        color:
          node.type === 'file' && node.path === current
            ? 'var(--color-active-text)'
            : 'var(--color-text-secondary)',
        background:
          node.type === 'file' && node.path === current
            ? 'var(--color-active-bg)'
            : 'transparent',
        fontWeight: node.type === 'file' && node.path === current ? 500 : 400,
        cursor: node.type === 'dir' || (node.type === 'file' && node.name.endsWith('.md')) ? 'pointer' : 'default',
      }"
      @click="toggle"
      @mouseenter="($event.target as HTMLElement).style.background = node.type === 'file' && node.path === current ? 'var(--color-active-bg)' : 'var(--color-hover-bg)'"
      @mouseleave="($event.target as HTMLElement).style.background = node.type === 'file' && node.path === current ? 'var(--color-active-bg)' : 'transparent'"
    >
      <!-- Folder icons -->
      <Icon
        v-if="node.type === 'dir'"
        :icon="expanded ? 'solar:folder-open-bold' : 'solar:folder-bold'"
        class="w-4 h-4 shrink-0"
        :style="{ color: expanded ? 'var(--color-link)' : 'var(--color-text-muted)' }"
      />
      <!-- Markdown file icon -->
      <Icon
        v-else-if="node.name.endsWith('.md')"
        icon="solar:document-text-bold"
        class="w-4 h-4 shrink-0"
        :style="{ color: node.path === current ? 'var(--color-active-text)' : 'var(--color-text-muted)' }"
      />
      <!-- Other file icon -->
      <Icon
        v-else
        icon="solar:file-linear"
        class="w-4 h-4 shrink-0"
        :style="{ color: 'var(--color-text-muted)', opacity: 0.5 }"
      />
      <span class="truncate" :style="{ opacity: node.type === 'file' && !node.name.endsWith('.md') ? 0.5 : 1 }">{{ node.name.endsWith('.md') ? node.name.replace(/\.md$/, '') : node.name }}</span>
      <!-- Chevron for dirs -->
      <Icon
        v-if="node.type === 'dir'"
        icon="solar:alt-arrow-down-linear"
        class="w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-150"
        :class="{ '-rotate-90': !expanded }"
        :style="{ color: 'var(--color-text-muted)' }"
      />
    </button>
    <div v-if="node.type === 'dir' && expanded && node.children">
      <TreeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :current="current"
        :depth="depth + 1"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
