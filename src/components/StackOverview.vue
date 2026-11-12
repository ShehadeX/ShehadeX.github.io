<script setup lang="ts">
import { computed } from 'vue'
import { stackCategories, type StackCategory } from '@/data/stack'
import { stackCategoriesEn } from '@/data/stack.en'
import { lang } from '@/composables/useI18n'
import { useStackSelection } from '@/composables/useStackSelection'

/**
 * 技术选型（左栏）。
 *
 * 完全由右侧图谱驱动：
 *   - 悬停/点击某个节点 → 展示该节点所属分类的技术清单
 *   - 选中某个项目筛选   → 展示该项目用到的技术
 *   - 什么都没选         → 整个面板不渲染（保持左栏干净）
 *
 * 之前这里还有一份静态的六领域概览列表，
 * 但那与图谱里的六个枢纽节点信息重复，且长期占着左栏空间，
 * 所以已经删除 —— 图谱本身���承担「有哪些领域」的表达。
 */

const isEn = computed(() => lang.value === 'en')
const cats = computed<StackCategory[]>(() => (isEn.value ? stackCategoriesEn : stackCategories))

const { focusedNode, selectedProject } = useStackSelection()

/** 当前要展示的技术清单：选中节点 → 其所属分类 */
const activeCategory = computed(() => {
  const f = focusedNode.value
  if (!f) return null
  return cats.value.find((c) => c.id === f.category) ?? null
})

/** 只选了项目筛选（没选节点）→ 该项目用到的技术，按领域分组 */
const projectCategory = computed(() => {
  if (focusedNode.value || !selectedProject.value) return null
  return cats.value.filter((c) => c.items.some((i) => i.projects.includes(selectedProject.value!)))
})

/** 面板是否有内容 */
const hasContent = computed(
  () => activeCategory.value !== null || (projectCategory.value?.length ?? 0) > 0,
)
</script>

<template>
  <!--
    没有选中任何东西时整个面板不渲染。
    这样左栏保持干净，不会一直挂着一份没人看的清单。
  -->
  <div v-if="hasContent" class="mt-5 border-t border-ink/10 pt-4">
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
              {{
                String(
                  c.items.filter((i) => i.projects.includes(selectedProject!)).length,
                ).padStart(2, '0')
              }}
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
    </div>
  </div>
</template>
