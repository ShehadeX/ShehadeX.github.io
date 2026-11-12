<script setup lang="ts">
import { lang, setLang } from '@/composables/useI18n'
</script>

<template>
  <button
    type="button"
    class="group flex h-7 items-center gap-1.5 rounded-[3px] border border-ink/15 px-2.5 font-mono text-[11px] text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:text-claude-deep"
    :title="lang === 'zh' ? 'Switch to English' : '切换到中文'"
    :aria-label="lang === 'zh' ? 'Switch to English' : '切换到中文'"
    @click="setLang(lang === 'zh' ? 'en' : 'zh')"
  >
    <span
      class="inline-block transition-transform duration-300 ease-out group-hover:rotate-180"
      aria-hidden="true"
    >
      ⇄
    </span>
    <span>{{ lang === 'zh' ? 'EN' : '中' }}</span>
  </button>
</template>
