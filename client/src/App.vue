<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { TreeNode, MarkdownDocument, Theme } from './types';
import { fetchTree, fetchFile, saveFile, fetchThemes } from './api';
import { createWsClient } from './ws';
import Sidebar from './components/Sidebar.vue';
import ContentView from './components/ContentView.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import CodeThemeSwitcher from './components/CodeThemeSwitcher.vue';

const tree = ref<TreeNode[]>([]);
const currentFile = ref('');
const doc = ref<MarkdownDocument | null>(null);
const themes = ref<Theme[]>([]);
const activeTheme = ref('default');
const codeTheme = ref('github-dark');
const sidebarOpen = ref(true);
const loading = ref(false);
const darkMode = ref(false);
const editMode = ref(false);
const editContent = ref('');
const saving = ref(false);

// Persist dark mode preference
function initDarkMode() {
  const saved = localStorage.getItem('markdownStudio.darkMode');
  if (saved !== null) {
    darkMode.value = saved === 'true';
  } else {
    darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyDarkMode();
}

function applyDarkMode() {
  document.documentElement.classList.toggle('dark', darkMode.value);
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('markdownStudio.darkMode', String(darkMode.value));
  applyDarkMode();
}

async function loadTree() {
  tree.value = await fetchTree();
}

async function loadFile(path: string) {
  loading.value = true;
  editMode.value = false;
  currentFile.value = path;
  const url = new URL(window.location.href);
  url.searchParams.set('file', path);
  window.history.replaceState({}, '', url.toString());
  doc.value = await fetchFile(path);
  loading.value = false;
}

function onThemeChange(name: string) {
  activeTheme.value = name;
  localStorage.setItem('markdownStudio.theme', name);

  // Set data-theme attribute for CSS variable scoping
  if (name === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', name);
  }

  // Load theme CSS files
  const existing = document.getElementById('studio-theme');
  if (existing) existing.remove();

  const theme = themes.value.find((t) => t.name === name);
  if (theme) {
    for (const file of theme.cssFiles) {
      const link = document.createElement('link');
      link.id = 'studio-theme';
      link.rel = 'stylesheet';
      link.href = `/themes/${file}`;
      document.head.appendChild(link);
    }
  }
}

function onCodeThemeChange(name: string) {
  codeTheme.value = name;
  localStorage.setItem('markdownStudio.codeTheme', name);
  applyCodeTheme(name);
}

function applyCodeTheme(name: string) {
  const existing = document.getElementById('studio-code-theme');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = 'studio-code-theme';
  link.rel = 'stylesheet';
  link.href = `/hljs-themes/${name}.min.css`;
  document.head.appendChild(link);
}

async function toggleEdit() {
  if (!editMode.value && doc.value) {
    // If raw content is missing, re-fetch the file to get it
    if (!doc.value.raw && currentFile.value) {
      doc.value = await fetchFile(currentFile.value);
    }
    editContent.value = doc.value.raw || '';
  }
  editMode.value = !editMode.value;
}

async function onSave() {
  if (!currentFile.value) return;
  saving.value = true;
  try {
    doc.value = await saveFile(currentFile.value, editContent.value);
    editMode.value = false;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  initDarkMode();

  // Restore code theme
  const savedCodeTheme = localStorage.getItem('markdownStudio.codeTheme');
  if (savedCodeTheme) codeTheme.value = savedCodeTheme;
  applyCodeTheme(codeTheme.value);

  await loadTree();
  themes.value = await fetchThemes();

  // Restore UI theme
  const savedTheme = localStorage.getItem('markdownStudio.theme');
  if (savedTheme && themes.value.some((t) => t.name === savedTheme)) {
    onThemeChange(savedTheme);
  }

  const params = new URLSearchParams(window.location.search);
  const file = params.get('file');
  if (file) {
    await loadFile(file);
  } else {
    const first = findFirstFile(tree.value);
    if (first) await loadFile(first);
  }

  createWsClient([
    (msg) => {
      if (msg.type === 'file-changed' && msg.path === currentFile.value) {
        loadFile(msg.path);
      } else if (msg.type === 'tree-changed') {
        loadTree();
      } else if (msg.type === 'reload') {
        loadTree();
        if (currentFile.value) loadFile(currentFile.value);
      }
    },
  ]);
});

function findFirstFile(nodes: TreeNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'file') return node.path;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
}
</script>

<template>
  <div class="flex h-screen" :style="{ background: 'var(--color-bg)' }">
    <!-- Sidebar -->
    <aside
      v-show="sidebarOpen"
      class="w-72 flex-shrink-0 flex flex-col overflow-hidden transition-colors duration-200"
      :style="{
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
      }"
    >
      <!-- Brand -->
      <div
        class="px-5 py-4 flex items-center gap-2.5"
        :style="{ borderBottom: '1px solid var(--color-border)' }"
      >
        <Icon icon="solar:book-2-bold" class="w-6 h-6 text-blue-500" />
        <span class="font-semibold text-base tracking-tight" :style="{ color: 'var(--color-text-heading)' }">
          Markdown Studio
        </span>
      </div>

      <!-- File tree -->
      <div class="flex-1 overflow-y-auto py-1">
        <Sidebar :tree="tree" :current="currentFile" @select="loadFile" />
      </div>

      <!-- Bottom: theme + code theme + dark mode -->
      <div class="px-4 py-3 space-y-3" :style="{ borderTop: '1px solid var(--color-border)' }">
        <ThemeSwitcher :themes="themes" :active="activeTheme" @change="onThemeChange" />
        <CodeThemeSwitcher :active="codeTheme" @change="onCodeThemeChange" />
        <button
          class="w-full flex items-center justify-center gap-2 text-sm py-1.5 rounded-lg transition-colors"
          :style="{
            color: 'var(--color-text-muted)',
            background: 'var(--color-hover-bg)',
          }"
          @click="toggleDarkMode"
        >
          <Icon :icon="darkMode ? 'solar:sun-bold' : 'solar:moon-bold'" class="w-4 h-4" />
          {{ darkMode ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden transition-colors duration-200" :style="{ background: 'var(--color-bg)' }">
      <!-- Top bar -->
      <header
        class="h-12 flex items-center px-4 gap-3 shrink-0"
        :style="{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }"
      >
        <button
          class="p-1.5 rounded-lg transition-colors"
          :style="{ color: 'var(--color-text-muted)' }"
          @click="sidebarOpen = !sidebarOpen"
          title="Toggle sidebar"
        >
          <Icon icon="solar:hamburger-menu-linear" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2 text-sm truncate" :style="{ color: 'var(--color-text-muted)' }">
          <Icon icon="solar:document-text-linear" class="w-4 h-4 shrink-0" />
          <span class="truncate">{{ currentFile || 'No file selected' }}</span>
        </div>
        <!-- Edit toggle -->
        <button
          v-if="doc && currentFile"
          class="ml-auto p-1.5 rounded-lg transition-colors"
          :style="{
            color: editMode ? 'var(--color-active-text)' : 'var(--color-text-muted)',
            background: editMode ? 'var(--color-active-bg)' : 'transparent',
          }"
          @click="toggleEdit"
          :title="editMode ? 'Switch to preview' : 'Edit file'"
        >
          <Icon :icon="editMode ? 'solar:eye-bold' : 'solar:pen-new-square-linear'" class="w-5 h-5" />
        </button>
        <!-- Top-right dark mode toggle -->
        <button
          class="p-1.5 rounded-lg transition-colors"
          :class="{ 'ml-auto': !doc || !currentFile }"
          :style="{ color: 'var(--color-text-muted)' }"
          @click="toggleDarkMode"
          :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Icon :icon="darkMode ? 'solar:sun-bold' : 'solar:moon-bold'" class="w-5 h-5" />
        </button>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto w-full px-8 py-10">
          <div v-if="loading" class="flex items-center gap-2 mt-16 justify-center" :style="{ color: 'var(--color-text-muted)' }">
            <Icon icon="solar:refresh-circle-line-duotone" class="w-5 h-5 animate-spin" />
            <span>Loading…</span>
          </div>

          <!-- Edit mode -->
          <div v-else-if="editMode && doc" class="flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium" :style="{ color: 'var(--color-text-muted)' }">
                Editing: {{ currentFile }}
              </span>
              <div class="flex items-center gap-2">
                <button
                  class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
                  :style="{
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                  }"
                  @click="editMode = false"
                >
                  <Icon icon="solar:close-circle-linear" class="w-4 h-4" />
                  Cancel
                </button>
                <button
                  class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors text-white"
                  :style="{ background: '#2563eb' }"
                  :disabled="saving"
                  @click="onSave"
                >
                  <Icon :icon="saving ? 'solar:refresh-circle-line-duotone' : 'solar:diskette-linear'" class="w-4 h-4" :class="{ 'animate-spin': saving }" />
                  {{ saving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
            <textarea
              v-model="editContent"
              class="flex-1 min-h-[400px] w-full rounded-xl p-5 font-mono text-sm leading-relaxed
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
              :style="{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Preview mode -->
          <ContentView v-else-if="doc" :doc="doc" />
          <div v-else class="text-center mt-24 flex flex-col items-center gap-3" :style="{ color: 'var(--color-text-muted)' }">
            <Icon icon="solar:document-add-linear" class="w-12 h-12 opacity-50" />
            <p>Select a file from the sidebar to get started.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
