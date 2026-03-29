<script setup lang="ts">
import { Icon } from '@iconify/vue';

const codeThemes = [
  { label: 'GitHub Dark', value: 'github-dark' },
  { label: 'GitHub', value: 'github' },
  { label: 'Atom One Dark', value: 'atom-one-dark' },
  { label: 'Atom One Light', value: 'atom-one-light' },
  { label: 'Dracula', value: 'dracula' },
  { label: 'Nord', value: 'nord' },
  { label: 'Monokai', value: 'monokai' },
  { label: 'VS 2015', value: 'vs2015' },
  { label: 'VS', value: 'vs' },
  { label: 'Tokyo Night Dark', value: 'tokyo-night-dark' },
  { label: 'Tokyo Night Light', value: 'tokyo-night-light' },
  { label: 'A11y Dark', value: 'a11y-dark' },
  { label: 'A11y Light', value: 'a11y-light' },
];

defineProps<{
  active: string;
}>();

const emit = defineEmits<{
  change: [value: string];
}>();
</script>

<template>
  <div>
    <label
      class="text-xs font-medium mb-1.5 flex items-center gap-1.5"
      :style="{ color: 'var(--color-text-muted)' }"
    >
      <Icon icon="solar:code-square-linear" class="w-3.5 h-3.5" />
      Code Theme
    </label>
    <select
      :value="active"
      class="w-full text-sm rounded-lg px-2.5 py-1.5
             focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-colors
             appearance-none cursor-pointer"
      :style="{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
      }"
      @change="emit('change', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="t in codeThemes" :key="t.value" :value="t.value">
        {{ t.label }}
      </option>
    </select>
  </div>
</template>
