<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const links = [
  { label: 'About', href: '/#about' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Research', href: '/research' },
  { label: 'Contact', href: '/#contact' },
]

const scrolled = ref(false)
const progress = ref(0)

const onScroll = () => {
  scrolled.value = window.scrollY > 24
  const doc = document.documentElement
  const max = doc.scrollHeight - doc.clientHeight
  progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b transition-colors duration-150"
    :class="scrolled ? 'bg-base/85 backdrop-blur-md border-ink/10' : 'border-transparent'"
    style="border-color: rgba(32, 31, 29, 0.1)"
  >
    <!-- 滚动进度条：transform scaleX，走合成层 -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-claude will-change-transform"
      :style="{ transform: `scaleX(${progress})`, opacity: scrolled ? 1 : 0 }"
    />

    <div class="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-5 sm:px-8">
      <RouterLink to="/" class="flex items-center gap-2.5 shrink-0">
        <img
          src="/img/logos/gdut.png"
          alt="广东工业大学"
          class="h-7 w-7 shrink-0 object-contain"
        />
        <span class="font-mono text-[13px] text-ink">ShehadeProfile</span>
      </RouterLink>

      <nav class="ml-auto hidden items-center gap-6 md:flex">
        <RouterLink
          v-for="l in links"
          :key="l.href"
          :to="l.href"
          class="group relative font-mono text-[12px] text-ink-muted transition-colors duration-150 hover:text-ink"
        >
          {{ l.label }}
          <span
            class="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-claude transition-transform duration-200 ease-out group-hover:scale-x-100"
          />
        </RouterLink>
      </nav>

      <a
        href="https://github.com/ShehadeX"
        target="_blank"
        rel="noopener"
        class="ml-auto flex h-7 items-center rounded-[3px] border border-ink/15 px-2.5 font-mono text-[11px] text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:text-claude-deep md:ml-0"
      >
        GitHub ↗
      </a>
    </div>
  </header>
</template>
