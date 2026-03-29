<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { Theme } from '../types';

defineProps<{
  themes: Theme[];
  active: string;
}>();

const emit = defineEmits<{
  change: [name: string];
}>();
</script>

<template>
  <div v-if="themes.length > 0">
    <label
      class="text-xs font-medium mb-1.5 flex items-center gap-1.5"
      :style="{ color: 'var(--color-text-muted)' }"
    >
      <Icon icon="solar:pallete-2-linear" class="w-3.5 h-3.5" />
      Theme
    </label>
    <select
      :value="active"
      class="w-full text-sm rounded-lg px-2.5 py-1.5
             focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-colors
             appearance-none cursor-pointer capitalize"
      :style="{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
      }"
      @change="emit('change', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="theme in themes" :key="theme.name" :value="theme.name">
        {{ theme.name }}
      </option>
    </select>
  </div>
</template>
