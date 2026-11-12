<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'

onMounted(() => {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  )
  document.querySelectorAll('.fade-up').forEach((el) => io.observe(el))
  onBeforeUnmount(() => io.disconnect())
})
</script>

<template>
  <div class="min-h-dvh bg-base">
    <SiteHeader />
    <main>
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>
    <SiteFooter />
  </div>
</template>
