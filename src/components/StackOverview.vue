<script setup lang="ts">
import { computed } from 'vue'
import { stackCategories, type StackCategory } from '@/data/stack'
import { stackCategoriesEn } from '@/data/stack.en'
import { lang } from '@/composables/useI18n'
import { useStackSelection } from '@/composables/useStackSelection'

/**
 * 技术选型（动态）。
 *
 * 之前这里是一份静态的「全部技术清单」+ 一份静态的领域列表，
 * 内容重复且太长（左栏被撑到近 2000px，图谱的 sticky 行程也就跟着变长）。
 *
 * 现在改成由右栏图谱驱动：
 *   - 悬停/点击某个节点 → 这里展示该节点所属分类的技术清单
 *   - 未选中任何节点   → 展示全部领域的概览（紧凑的一行式列表）
 *
 * 这样左栏长度可控（不会超过图谱太多），sticky 行程稳定，
 * 而且内容始终和用户正在看的图谱对应。
 */

const isEn = computed(() => lang.value === 'en')
const cats = computed<StackCategory[]>(() => (isEn.value ? stackCategoriesEn : stackCategories))

const { focusedNode, selectedProject } = useStackSelection()

/**
 * 当前要展示的技术清单。
 *
 * 优先级：
 *   1. 选中/悬停了某个节点 → 该节点所属分类的完整技术列表
 *   2. 选中了某个项目       → 该项目用到的技术（按领域分组）
 *   3. 都没选               → null（显示紧凑的领域概览）
 */
const activeCategory = computed(() => {
  const f = focusedNode.value
  if (f) return cats.value.find((c) => c.id === f.category) ?? null
  return null
})

const projectCategory = computed(() => {
  if (focusedNode.value || !selectedProject.value) return null
  return cats.value.filter((c) => c.items.some((i) => i.projects.includes(selectedProject.value!)))
})

/** 每个分类在当前项目筛选下命中的技术数 */
const countFor = (items: { id: string; projects: string[] }[]) => {
  if (!selectedProject.value) return items.length
  return items.filter((i) => i.projects.includes(selectedProject.value!)).length
}
</script>

<template>
  <div class="mt-5 border-t border-ink/10 pt-4">
    <!-- 头部 -->
    <div class="flex items-baseline gap-2.5">
      <span class="eyebrow">{{ isEn ? 'Tech Stack' : '技术选型' }}</span>
      <span v-if="focusedNode" class="font-mono text-[10.5px] text-claude-deep">
        {{ focusedNode.name }}
      </span>
      <span
        v-else-if="selectedProject"
        class="font-mono text-[10.5px] text-claude-deep"
      >
        {{ selectedProject }}
      </span>
    </div>

    <!--
      动态区域：跟随图谱选中节点变化。
      用固定高度容器 + 内容切换，避免高度突变导致右侧图谱的 sticky 行程抖动。
    -->
    <div class="mt-3.5">
      <!-- 选中了某个分类节点 / 该分类下的技术节点 -->
      <div v-if="activeCategory">
        <div class="flex items-baseline gap-2.5">
          <span class="claude-num">{{ String(activeCategory.items.length).padStart(2, '0') }}</span>
          <h3 class="text-[14px] font-semibold text-ink">{{ activeCategory.name }}</h3>
          <span class="ml-auto font-mono text-[10.5px] text-ink-faint">
            {{ activeCategory.caption }}
          </span>
        </div>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="it in activeCategory.items"
            :key="it.id"
            class="text-[12px] leading-[1.6]"
          >
            <span class="text-ink">{{ it.name }}</span>
            <span class="text-ink-faint"> — {{ it.note }}</span>
          </li>
        </ul>
      </div>

      <!-- 选中了项目筛选：展示该项目用到的技术（按领域分组） -->
      <div v-else-if="projectCategory && projectCategory.length">
        <div
          v-for="c in projectCategory"
          :key="c.id"
          class="mb-3 last:mb-0"
        >
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">
              {{ String(countFor(c.items)).padStart(2, '0') }}
            </span>
            <h3 class="text-[13.5px] font-semibold text-ink">{{ c.name }}</h3>
            <span class="ml-auto font-mono text-[10.5px] text-ink-faint">{{ c.caption }}</span>
          </div>
          <ul class="mt-2 flex flex-wrap gap-1.5">
            <li
              v-for="it in c.items.filter((i: { projects: string[] }) => i.projects.includes(selectedProject!))"
              :key="it.id"
              class="rounded-[3px] bg-raised px-2 py-0.5 text-[11.5px] text-ink-muted"
            >
              {{ it.name }}
            </li>
          </ul>
        </div>
      </div>

      <!--
        都没选：显示紧凑的领域概览。
        每个领域一行，不再把该领域下的技术全列出来（那部分由图谱详情承担）。
      -->
      <div v-else>
        <ul class="space-y-1.5">
          <li
            v-for="c in cats"
            :key="c.id"
            class="flex items-baseline gap-2 text-[12.5px]"
          >
            <span class="claude-num shrink-0">{{ String(c.items.length).padStart(2, '0') }}</span>
            <span class="font-medium text-ink">{{ c.name }}</span>
            <span class="truncate text-[11px] text-ink-faint">{{ c.caption }}</span>
          </li>
        </ul>
        <p class="mt-3 text-[11.5px] leading-[1.6] text-ink-faint">
          {{
            isEn
              ? 'Hover or click a node in the graph to see the technologies behind it.'
              : '在右侧图谱悬停或点击任意节点，这里会显示它背后的技术清单。'
          }}
        </p>
      </div>
    </div>
  </div>
</template>
