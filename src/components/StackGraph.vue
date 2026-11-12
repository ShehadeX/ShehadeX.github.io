<script setup lang="ts">
import { computed } from 'vue'
import StackCanvas from '@/components/StackCanvas.vue'
import StackDetailPanel from '@/components/StackDetailPanel.vue'
import { stackCategories, stackProjects, allStackItems } from '@/data/stack'
import { stackCategoriesEn, stackProjectsEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'
import { useStackSelection } from '@/composables/useStackSelection'

/**
 * 技术栈图谱容器。
 *
 * 高频的物理模拟与指针状态全部封在 StackCanvas 里，
 * 这里只负责：项目筛选、详情面板、领域概览。
 * 这样指针移动不会引起本组件的重渲染，页面不会再卡死。
 *
 * 选中状态放在模块级单例（useStackSelection）里，
 * 这样左栏的「技术选型」能和右栏图谱双向联动。
 */

interface Props {
  /** 紧凑模式：窄栏使用 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { compact: false })

const isEn = computed(() => lang.value === 'en')
const cats = computed(() => (isEn.value ? stackCategoriesEn : stackCategories))
const projects_ = computed(() => (isEn.value ? stackProjectsEn : stackProjects))

const {
  selectedProject,
  selectedNode,
  hoveredNode,
  focusedNode: focused,
  setProject,
  toggleNode,
} = useStackSelection()

/**
 * 传给画布的持久选中 id。
 *
 * 只有「点击选中」算持久选择（悬停是临时预览），
 * 所以这里取 selectedNode 而非 focused —— 否则鼠标一移开，
 * 左栏点选的高亮就会跟着消失。
 */
const selectedId = computed(() => selectedNode.value?.id ?? null)

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

/** 详情面板是否有内容（决定是否加内边距） */
const hasPanelContent = computed(
  () => focused.value !== null || (selectedProject.value !== null && currentProject.value !== null),
)

const toggleProject = (slug: string) => {
  setProject(selectedProject.value === slug ? null : slug)
}
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

    <!--
      紧凑模式（首页 About 区）：只显示节点，不挂任何详情浮层。
      节点详情统一搬到左栏的技术选型面板里展示，
      这里保持纯图谱，右栏高度恒定，sticky 锁定不受影响。
    -->
    <div v-if="compact" class="relative">
      <StackCanvas
        :cats="cats"
        :active-ids="activeIds"
        :selected-id="selectedId"
        @hover="hoveredNode = $event"
        @select="toggleNode($event)"
      />
    </div>

    <!-- 宽屏模式：图谱 + 右侧独立详情栏 -->
    <div v-else class="grid gap-0 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
      <div class="border-b border-ink/10 lg:border-b-0 lg:border-r">
        <StackCanvas
        :cats="cats"
        :active-ids="activeIds"
        :selected-id="selectedId"
        @hover="hoveredNode = $event"
        @select="toggleNode($event)"
      />
      </div>

      <div :class="hasPanelContent ? 'p-5 sm:p-6' : ''">
        <template v-if="focused">
          <StackDetailPanel
            :hovered="focused"
            :hub-items="cats.find((c) => c.id === focused!.id)?.items ?? []"
          />
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
      </div>
    </div>
  </div>
</template>
