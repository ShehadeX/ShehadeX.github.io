<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ code: string; id: string }>()

const el = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let mermaidMod: typeof import('mermaid').default | null = null

async function render() {
  if (!el.value) return
  el.value.innerHTML = ''
  try {
    if (!mermaidMod) {
      const mod = await import('mermaid')
      mermaidMod = mod.default
      mermaidMod.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: "'Inter', system-ui, sans-serif",
        themeVariables: {
          background: '#ECE9E0',
          primaryColor: '#DBD1C0',
          primaryTextColor: '#201F1D',
          primaryBorderColor: '#454036',
          lineColor: '#625F59',
          secondaryColor: '#ECE9E0',
          tertiaryColor: '#ECE9E0',
          fontSize: '14px',
        },
        flowchart: { curve: 'basis', padding: 16, nodeSpacing: 40, rankSpacing: 48 },
      })
    }
    const { svg } = await mermaidMod.render(
      `mmd-${props.id}-${Math.random().toString(36).slice(2, 8)}`,
      props.code,
    )
    el.value.innerHTML = svg
    const s = el.value.querySelector('svg')
    if (s) {
      s.setAttribute('max-width', '100%')
      s.style.height = 'auto'
      s.style.background = 'transparent'
    }
  } catch (e) {
    el.value.innerHTML = `<pre class="text-[12px] text-ink-muted">图表渲染失败</pre>`
    console.error(e)
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        render()
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.1 },
  )
  if (el.value) observer.observe(el.value)
})

onBeforeUnmount(() => observer?.disconnect())
watch(() => props.code, render)
</script>

<template>
  <div class="overflow-x-auto rounded-[15px] border border-ink/12 bg-base p-4 sm:p-6">
    <div ref="el" class="mermaid-host min-h-[120px] w-full" />
  </div>
</template>

<style>
.mermaid-host svg {
  display: block;
  margin: 0 auto;
}
</style>
