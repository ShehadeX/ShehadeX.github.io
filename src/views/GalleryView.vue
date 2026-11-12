<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { galleries, getGallery } from '@/data/gallery'
import { lang } from '@/composables/useI18n'

/**
 * 画廊详情页。
 *
 * 一个画廊 = 一个有共同主题的照片集。
 * 页面上每张照片都带完整记录：拍摄背景 + 我自己的评论。
 * 这部分内容不进正文，因为它记录的是「事情背后的东西」，
 * 而不是功能说明。
 */

const route = useRoute()
const isEn = computed(() => lang.value === 'en')

const gallery = computed(() => getGallery(String(route.params.slug)))
const others = computed(() => galleries.filter((g) => g.slug !== gallery.value?.slug))

const backLabel = computed(() => (isEn.value ? 'All galleries' : '全部画廊'))
</script>

<template>
  <div v-if="gallery" class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
    <!-- 面包屑 -->
    <RouterLink
      to="/#gallery"
      class="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-ink-muted transition-colors duration-150 hover:text-claude-deep"
    >
      <span aria-hidden="true">←</span> {{ backLabel }}
    </RouterLink>

    <!-- 头部 -->
    <header class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-end lg:gap-12">
      <div>
        <div class="flex items-baseline gap-3">
          <span class="eyebrow">{{ gallery.category }}</span>
          <span class="font-mono text-[10.5px] text-ink-faint">
            {{ gallery.photos.length }} {{ isEn ? 'photos' : '张照片' }}
          </span>
        </div>
        <h1 class="mt-4 text-balance text-[32px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[44px]">
          {{ gallery.title }}
        </h1>
        <p class="mt-3 text-[15px] text-ink-muted">{{ gallery.subtitle }}</p>
        <p class="mt-6 max-w-[56ch] text-pretty text-[14.5px] leading-[1.85] text-ink-body">
          {{ gallery.intro }}
        </p>
      </div>

      <!-- 封面 -->
      <figure class="overflow-hidden rounded-[15px] border border-ink/12 bg-raised">
        <img
          :src="gallery.cover"
          :alt="gallery.title"
          class="block w-full object-cover"
          :style="{ aspectRatio: gallery.coverRatio }"
        />
      </figure>
    </header>

    <!-- 照片列表 -->
    <div class="mt-16 space-y-16">
      <article
        v-for="(p, i) in gallery.photos"
        :key="p.src"
        class="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12"
      >
        <!-- 图片 -->
        <figure
          class="overflow-hidden rounded-[15px] border border-ink/12 bg-raised"
          :class="i % 2 === 1 ? 'lg:order-2' : ''"
        >
          <img
            :src="p.src"
            :alt="p.caption"
            loading="lazy"
            decoding="async"
            class="block w-full object-cover"
            :style="{ aspectRatio: p.ratio }"
          />
        </figure>

        <!-- 记录 -->
        <div :class="i % 2 === 1 ? 'lg:order-1' : ''">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <h2 class="text-[18px] font-semibold leading-snug text-ink">{{ p.caption }}</h2>
          </div>

          <!-- 元信息 -->
          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-ink-faint">
            <span v-if="p.place">{{ p.place }}</span>
            <span v-if="p.date">{{ p.date }}</span>
          </div>

          <p class="mt-4 max-w-[58ch] text-[14px] leading-[1.8] text-ink-body">
            {{ p.note }}
          </p>

          <!-- 我自己的记录 -->
          <div class="mt-6 max-w-[58ch] border-l-2 border-claude/45 pl-4">
            <p class="claude-num">Record</p>
            <p class="mt-2 text-[13.5px] leading-[1.85] text-ink-muted">{{ p.story }}</p>
          </div>
        </div>
      </article>
    </div>

    <!-- 其他画廊 -->
    <section class="mt-20 border-t border-ink/10 pt-10">
      <div class="flex items-baseline gap-4">
        <span class="eyebrow">{{ isEn ? 'Other galleries' : '其他画廊' }}</span>
        <span class="rule flex-1" />
      </div>
      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="g in others"
          :key="g.slug"
          :to="`/gallery/${g.slug}`"
          class="group overflow-hidden rounded-[15px] border border-ink/12 bg-raised transition-colors duration-150 hover:border-ink/25"
        >
          <img
            :src="g.cover"
            :alt="g.title"
            loading="lazy"
            decoding="async"
            class="block w-full object-cover"
            :style="{ aspectRatio: g.coverRatio }"
          />
          <div class="border-t border-ink/10 p-4">
            <div class="flex items-baseline gap-2">
              <span class="claude-num">{{ g.category }}</span>
              <span class="ml-auto font-mono text-[10px] text-ink-faint">
                {{ g.photos.length }}
              </span>
            </div>
            <p class="mt-1.5 text-[15px] font-semibold text-ink">{{ g.title }}</p>
            <p class="mt-0.5 text-[12px] text-ink-muted">{{ g.subtitle }}</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>

  <!-- 找不到 -->
  <div v-else class="mx-auto max-w-[1400px] px-5 py-24 sm:px-8">
    <p class="text-[15px] text-ink-muted">{{ isEn ? 'Gallery not found.' : '没有找到这个画廊。' }}</p>
    <RouterLink to="/#gallery" class="mt-4 inline-block font-mono text-[12px] text-claude-deep">
      ← {{ backLabel }}
    </RouterLink>
  </div>
</template>
