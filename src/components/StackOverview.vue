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
 *   - 什么都没选         → 展示领域概要（可点击，点击即选中右侧对应枢纽）
 *
 * 之前这里什么���不渲染，左栏会空出一大块。
 * 现在补上领域概要，既填掉空白，也给用户一个「从哪里开始探索」的入口 ——
 * 点左边某个领域，右边图谱上那个枢纽会同步高亮。
 */

const isEn = computed(() => lang.value === 'en')
const cats = computed<StackCategory[]>(() => (isEn.value ? stackCategoriesEn : stackCategories))

const { focusedNode, selectedProject, selectCategory } = useStackSelection()

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

/**
 * 领域概要：各领域的技术数、被哪些项目用到，以及几个代表技术。
 *
 * 代表技术取该领域里「被项目用得最多」的几项 ——
 * 这样即使不点开也能看出这个领域具体是什么。
 */
const overview = computed(() =>
  cats.value.map((c) => {
    const projects = [...new Set(c.items.flatMap((i) => i.projects))]
    // 按使用项目数排序，取前 3 个作为代表
    const highlights = [...c.items]
      .sort((a, b) => b.projects.length - a.projects.length)
      .slice(0, 3)
      .map((i) => i.name)
    return {
      id: c.id,
      name: c.name,
      caption: c.caption,
      count: c.items.length,
      projects,
      highlights,
    }
  }),
)

/** 某领域是否正被选中 */
const isCategoryActive = (id: string) => focusedNode.value?.category === id
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
      <span v-else class="font-mono text-[10.5px] text-ink-faint">
        {{ overview.length }} {{ isEn ? 'domains' : '个领域' }} ·
        {{ overview.reduce((n, c) => n + c.count, 0) }} {{ isEn ? 'techs' : '项技术' }}
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

      <!--
        什么都没选：领域概要。
        每一条都可点击 —— 点一下就选中右侧图谱里对应的枢纽节点，
        两边始终指向同一个东西。
      -->
      <ul v-else class="space-y-px">
        <li v-for="c in overview" :key="c.id">
          <button
            type="button"
            class="group -mx-2 flex w-[calc(100%+1rem)] items-baseline gap-2.5 rounded-[3px] border-l-2 px-2 py-2 text-left transition-colors duration-150"
            :class="
              isCategoryActive(c.id)
                ? 'border-claude bg-raised'
                : 'border-transparent hover:border-ink/25 hover:bg-raised/60'
            "
            @click="selectCategory(c.id, c.name, c.projects)"
          >
            <span
              class="claude-num shrink-0 transition-colors duration-150"
              :class="isCategoryActive(c.id) ? 'text-claude-deep' : ''"
            >
              {{ String(c.count).padStart(2, '0') }}
            </span>
            <span class="min-w-0 flex-1">
              <span
                class="block text-[12.5px] font-medium leading-snug transition-colors duration-150"
                :class="isCategoryActive(c.id) ? 'text-ink' : 'text-ink-body'"
              >
                {{ c.name }}
              </span>
              <span class="mt-0.5 block truncate text-[11px] leading-snug text-ink-faint">
                {{ c.caption }}
              </span>
            </span>
            <span class="shrink-0 font-mono text-[10px] text-ink-faint">
              {{ c.projects.length }}
            </span>
          </button>

          <!--
            代表技术：默认展开，让左栏在未选中时也有实质内容，
            不只是六个空标题。
          -->
          <ul class="mt-1 mb-2 flex flex-wrap gap-1 pl-[26px]">
            <li
              v-for="h in c.highlights"
              :key="h"
              class="rounded-[3px] bg-raised px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
            >
              {{ h }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>
