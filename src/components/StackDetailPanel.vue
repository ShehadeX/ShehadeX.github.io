<script setup lang="ts">
import { computed } from 'vue'
import { stackProjects } from '@/data/stack'
import { stackProjectsEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'

/**
 * 图谱详情面板（紧凑模式的悬浮层版本）。
 *
 * 为什么独立成组件：
 * 紧凑模式下详情面板是**绝对定位浮层**覆盖在画布底部，
 * 而不是排在画布下方。
 *
 * 原因：详情面板在悬停时才出现，如果它占据文档流高度，
 * 右侧栏高度会突然超过视口，sticky 锁定立刻失效，
 * 图谱就会重新变成「独立滑动」——那正是要解决的问题。
 * 改成浮层后，右栏高度恒定，锁定始终有效。
 */

interface Props {
  hovered: {
    id: string
    name: string
    kind: 'hub' | 'item'
    category: string
    note: string
    projects: string[]
    count: number
  } | null
  /** 悬停节点所属分类的技术列表（分类节点时展开） */
  hubItems: { id: string; name: string }[]
}

const props = defineProps<Props>()

const projects = computed(() => (lang.value === 'en' ? stackProjectsEn : stackProjects))

const itemProjects = computed(() =>
  (props.hovered?.projects ?? [])
    .map((slug) => projects.value.find((p) => p.slug === slug))
    .filter(Boolean),
)
</script>

<template>
  <div>
    <div class="flex items-baseline gap-2.5">
      <span class="claude-num">
        {{ props.hovered?.kind === 'hub' ? t('stack.domain') : t('stack.tech') }}
      </span>
      <h3 class="display text-[19px] leading-tight">{{ props.hovered?.name }}</h3>
    </div>

    <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ props.hovered?.category }}</p>

    <p class="mt-2.5 text-[13px] leading-[1.75] text-ink-body">{{ props.hovered?.note }}</p>

    <div v-if="itemProjects.length" class="mt-4">
      <p class="eyebrow">{{ t('stack.usedin') }}</p>
      <ul class="mt-2 space-y-1">
        <li
          v-for="p in itemProjects"
          :key="p!.slug"
          class="flex items-baseline gap-2 text-[12.5px] text-ink-muted"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-claude" />
          <span class="text-ink">{{ p!.name }}</span>
        </li>
      </ul>
    </div>

    <div v-if="props.hovered?.kind === 'hub' && props.hubItems.length" class="mt-4 flex flex-wrap gap-1.5">
      <span v-for="it in props.hubItems" :key="it.id" class="tag">{{ it.name }}</span>
    </div>
  </div>
</template>
