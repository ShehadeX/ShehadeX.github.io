<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import StackCanvas from '@/components/StackCanvas.vue'
import { stackCategories, stackProjects, allStackItems } from '@/data/stack'
import { stackCategoriesEn, stackProjectsEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'

/**
 * 技术栈图谱容器。
 *
 * 高频的物理模拟与指针状态全部封在 StackCanvas 里，
 * 这里只负责：项目筛选、详情面板、领域概览。
 * 这样指针移动不会引起本组件的重渲染，页面不会再卡死。
 */

interface Props {
  /** 紧凑模式：窄栏使用 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { compact: false })

const isEn = computed(() => lang.value === 'en')
const cats = computed(() => (isEn.value ? stackCategoriesEn : stackCategories))
const projects_ = computed(() => (isEn.value ? stackProjectsEn : stackProjects))

const selectedProject = ref<string | null>(null)

/** 悬停中的节点信息，由画布组件抛出 */
const hovered = ref<{
  id: string
  name: string
  kind: 'hub' | 'item'
  category: string
  note: string
  projects: string[]
  count: number
} | null>(null)

/** 选中项目时该项目用到的技术 id 集合，传给画布做高亮 */
const activeIds = computed<string[] | null>(() => {
  if (!selectedProject.value) return null
  return allStackItems
    .filter((i) => i.projects.includes(selectedProject.value as string))
    .map((i) => i.id)
})

const currentProject = computed(
  () => projects_.value.find((p) => p.slug === selectedProject.value) ?? null,
)

const itemProjects = computed(() => {
  if (!hovered.value) return []
  return hovered.value.projects
    .map((slug) => projects_.value.find((p) => p.slug === slug))
    .filter(Boolean)
})

const toggleProject = (slug: string) => {
  selectedProject.value = selectedProject.value === slug ? null : slug
}

// 切换项目时清掉悬停状态，避免详情面板停留在上一个项目的节点上
watch(selectedProject, () => {
  hovered.value = null
})
</script>

<template>
  <div class="overflow-hidden rounded-[15px] border border-ink/12 bg-base">
    <!-- 头部：项目筛选 -->
    <div class="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-raised px-4 py-2.5">
      <span class="eyebrow mr-1">{{ t('stack.graph') }}</span>
      <button
        type="button"
        class="h-7 rounded-[3px] px-2.5 font-mono text-[11px] transition-colors duration-150"
        :class="
          selectedProject === null
            ? 'bg-overlay text-base'
            : 'border border-ink/15 text-ink-muted hover:bg-base hover:text-ink'
        "
        @click="selectedProject = null"
      >
        All
      </button>
      <button
        v-for="p in projects_"
        :key="p.slug"
        type="button"
        class="h-7 rounded-[3px] px-2.5 font-mono text-[11px] transition-colors duration-150"
        :class="
          selectedProject === p.slug
            ? 'bg-claude text-white'
            : 'border border-ink/15 text-ink-muted hover:bg-base hover:text-ink'
        "
        @click="toggleProject(p.slug)"
      >
        {{ p.name }}
      </button>
      <span class="ml-auto font-mono text-[10.5px] text-ink-faint">
        {{ allStackItems.length }} {{ isEn ? 'techs' : '项技术' }} ·
        {{ cats.length }} {{ isEn ? 'domains' : '个领域' }}
      </span>
    </div>

    <div
      class="grid gap-0"
      :class="compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]'"
    >
      <!-- 图谱 -->
      <div class="border-b border-ink/10" :class="compact ? '' : 'lg:border-b-0 lg:border-r'">
        <StackCanvas :cats="cats" :active-ids="activeIds" @hover="hovered = $event" />

        <p class="border-t border-ink/10 px-4 py-2 font-mono text-[10.5px] leading-relaxed text-ink-faint">
          {{ t('stack.hint') }}
        </p>
      </div>

      <!-- 详情面板 -->
      <div class="p-5 sm:p-6">
        <template v-if="hovered">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">
              {{ hovered.kind === 'hub' ? t('stack.domain') : t('stack.tech') }}
            </span>
            <h3 class="display text-[20px] leading-tight">{{ hovered.name }}</h3>
          </div>
          <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ hovered.category }}</p>
          <p class="mt-3 text-[13.5px] leading-[1.8] text-ink-body">{{ hovered.note }}</p>

          <div v-if="itemProjects.length" class="mt-5">
            <p class="eyebrow">{{ t('stack.usedin') }}</p>
            <ul class="mt-2.5 space-y-1.5">
              <li
                v-for="p in itemProjects"
                :key="p!.slug"
                class="flex items-baseline gap-2.5 text-[13px] text-ink-muted"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-claude" />
                <span class="text-ink">{{ p!.name }}</span>
                <span class="text-[12px] text-ink-faint">{{ p!.caption }}</span>
              </li>
            </ul>
          </div>

          <div v-if="hovered.kind === 'hub'" class="mt-5 flex flex-wrap gap-1.5">
            <span
              v-for="it in cats.find((c) => c.id === hovered!.id)?.items ?? []"
              :key="it.id"
              class="tag"
            >
              {{ it.name }}
            </span>
          </div>
        </template>

        <template v-else-if="selectedProject && currentProject">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">PROJECT</span>
            <h3 class="display text-[20px] leading-tight">{{ currentProject.name }}</h3>
          </div>
          <p class="mt-1 text-[13px] text-ink-muted">{{ currentProject.caption }}</p>
          <ul class="mt-4 space-y-1.5">
            <li
              v-for="it in allStackItems.filter((i) => i.projects.includes(currentProject!.slug))"
              :key="it.id"
              class="flex items-baseline gap-2.5 text-[13px] text-ink-muted"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-claude" />
              {{ it.name }}
            </li>
          </ul>
        </template>

        <template v-else>
          <p class="eyebrow">{{ t('stack.graph') }}</p>
          <p class="mt-3 text-[13.5px] leading-[1.85] text-ink-muted">
            {{
              isEn
                ? "Hover any node to see how the technology is actually used, or pick a project above to narrow the graph down to that project's stack."
                : '悬停任意节点查看这项技术的实际用法，或点上方项目筛选，把图谱收窄到某个项目用到的部分。'
            }}
          </p>
          <ul class="mt-4 space-y-1.5">
            <li
              v-for="c in cats"
              :key="c.id"
              class="flex items-baseline gap-2.5 text-[12.5px] text-ink-muted"
            >
              <span class="claude-num shrink-0">{{ String(c.items.length).padStart(2, '0') }}</span>
              <span class="text-ink">{{ c.name }}</span>
              <span class="truncate text-[11.5px] text-ink-faint">{{ c.caption }}</span>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>
