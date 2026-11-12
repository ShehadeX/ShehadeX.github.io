<script setup lang="ts">
import { computed } from 'vue'
import { galleries } from '@/data/gallery'
import GalleryCarousel from '@/components/GalleryCarousel.vue'
import { lang } from '@/composables/useI18n'

/**
 * 画廊入口（首页）。
 *
 * 这里只是入口 —— 详细的照片记录在 /gallery/:slug 独立页面。
 * 位置：研究之后、联系之前。
 */

const isEn = computed(() => lang.value === 'en')

const eyebrow = computed(() => (isEn.value ? 'Gallery' : '画廊'))
const title = computed(() =>
  isEn.value ? 'Outside the codebase' : '项目之外',
)
/** 全部照片总数 */
const photoCount = computed(() => galleries.reduce((n, g) => n + g.photos.length, 0))

const intro = computed(() =>
  isEn.value
    ? 'Photographs from the places these projects actually happened — wards, labs, server rooms, and everywhere else I have been. Each gallery opens into its own record.'
    : '这些项目真实发生过的现场照片 —— 病房、实验室、机房，以及我去过的其他地方。自动轮播全部照片，点开任意一张可以进入它所属的画廊，看到背后的记录。',
)
</script>

<template>
  <section id="gallery" class="border-b border-ink/10">
    <div class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
      <div class="flex items-baseline gap-4">
        <span class="claude-num">04</span>
        <span class="eyebrow">{{ eyebrow }}</span>
        <span class="rule flex-1" />
        <span class="font-mono text-[10.5px] text-ink-faint">
          {{ galleries.length }} {{ isEn ? 'galleries' : '个画廊' }} ·
          {{ photoCount }} {{ isEn ? 'photos' : '张照片' }}
        </span>
      </div>

      <div class="mt-6 max-w-[62ch]">
        <h2 class="text-balance text-[26px] font-semibold leading-[1.2] tracking-tight text-ink sm:text-[32px]">
          {{ title }}
        </h2>
        <p class="mt-3 text-pretty text-[14.5px] leading-[1.85] text-ink-body">
          {{ intro }}
        </p>
      </div>

      <div class="mt-10">
        <GalleryCarousel />
      </div>
    </div>
  </section>
</template>
