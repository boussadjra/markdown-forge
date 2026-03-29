<script setup lang="ts">
import type { TreeNode } from '../types';
import TreeItem from './TreeItem.vue';

defineProps<{
  tree: TreeNode[];
  current: string;
}>();

const emit = defineEmits<{
  select: [path: string];
}>();
</script>

<template>
  <nav class="py-2">
    <TreeItem
      v-for="node in tree"
      :key="node.path"
      :node="node"
      :current="current"
      :depth="0"
      @select="emit('select', $event)"
    />
  </nav>
</template>
