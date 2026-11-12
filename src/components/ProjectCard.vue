<script setup lang="ts">
import { computed } from 'vue'
import type { LocalizedProject } from '@/composables/useLocalizedProjects'
import ProjectCarousel from '@/components/ProjectCarousel.vue'
import { t } from '@/composables/useI18n'

/**
 * 项目卡片（首页精选区）。
 *
 * 布局：左侧描述 + 右侧项目截图轮播。
 * 左侧 = 标题 / 副标题 / 摘要 / 标签 / BEFORE-BUILT-AFTURE / 周期 / 详情链接；
 * 右侧 = 只有轮播图，自动定时左右滑动，悬停暂停，可手动翻页。
 */

const props = defineProps<{ project: LocalizedProject; index: number }>()

/** 轮播帧：项目 gallery 全部截图 */
const slides = computed(() => props.project.gallery ?? [])

/** 竖屏项目（PolyMed 手机截图）整体用 contain，避免左右留白过多 */
const ratio = computed(() => {
  const portrait = slides.value.some((s) => {
    if (!s.ratio) return false
    const [w, h] = s.ratio.split('/').map((v) => parseFloat(v.trim()))
    return Number.isFinite(w) && Number.isFinite(h) && h > w
  })
  return portrait ? '4 / 3' : '16 / 10'
})
</script>

<template>
  <article
    class="gpu-hover group relative overflow-hidden rounded-[15px] border border-ink/12 bg-base transition-colors duration-150 hover:border-ink/25"
  >
    <div
      class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-9"
    >
      <!-- 左：描述 -->
      <div class="flex flex-col">
        <RouterLink
          :to="`/project/${project.slug}`"
          class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <h3 class="display text-[26px] leading-tight">{{ project.title }}</h3>
          <p class="mt-1.5 text-[14px] text-ink-muted">{{ project.subtitle }}</p>
          <p class="mt-3.5 max-w-[46ch] text-[13.5px] leading-[1.75] text-ink-body">
            {{ project.summary }}
          </p>
        </RouterLink>

        <div class="mt-4 flex flex-wrap gap-1.5">
          <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <!-- BEFORE / BUILT / AFTER -->
        <dl class="mt-5 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-3">
          <div v-for="k in (['before', 'built', 'after'] as const)" :key="k">
            <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-claude-deep">
              {{ k }}
            </dt>
            <dd class="mt-1.5 text-[12px] leading-[1.65] text-ink-muted">
              {{ project.bba[k] }}
            </dd>
          </div>
        </dl>

        <div class="mt-5 flex items-center justify-between gap-4 border-t border-ink/10 pt-3.5">
          <span class="font-mono text-[11px] text-ink-faint">{{ project.period }}</span>
          <RouterLink
            :to="`/project/${project.slug}`"
            class="inline-flex items-center gap-1.5 font-mono text-[11px] text-claude-deep underline decoration-claude/35 underline-offset-4 transition-colors duration-150 hover:decoration-claude-deep"
          >
            {{ t('proj.preview') }}
            <span class="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
          </RouterLink>
        </div>
      </div>

      <!-- 右：项目截图轮播 -->
      <div class="relative">
        <ProjectCarousel :items="slides" :ratio="ratio">
          <template #badge>{{ project.case }}</template>
        </ProjectCarousel>
        <p class="mt-2 font-mono text-[10px] tracking-[0.1em] text-ink-faint">
          {{ project.domain }}
        </p>
      </div>
    </div>
  </article>
</template>
