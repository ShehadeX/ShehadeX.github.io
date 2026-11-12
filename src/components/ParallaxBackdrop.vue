<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

/**
 * 滚动视差。
 *
 * 只写 transform（translate3d），不碰 top/left/height，
 * 因此每一帧都落在合成器上，由 GPU 完成，不触发 layout / paint。
 * 使用 rAF 节流，避免滚动事件里做同步布局计算。
 */
const root = ref<HTMLElement | null>(null)
const offset = ref(0)

let raf = 0

const onScroll = () => {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    const el = root.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
    const clamped = Math.max(0, Math.min(1, progress))
    offset.value = (clamped - 0.5) * 24
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div ref="root" class="relative">
    <div
      class="pointer-events-none absolute inset-0 -z-10 gpu will-change-transform"
      :style="{
        transform: `translate3d(0, ${offset}px, 0)`,
      }"
    />
    <slot />
  </div>
</template>
