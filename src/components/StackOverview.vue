<script setup lang="ts">
import { computed } from 'vue'
import { stackCategories, allStackItems } from '@/data/stack'
import { stackCategoriesEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'

/**
 * 技术栈领域概览。
 *
 * 从图谱的详情面板里独立出来，单独放在「关于我」左栏的底部：
 * 概览是静态文案（图谱本身已经承担了动态探索的职责），
 * 没必要占用图谱旁边的空间，独立出来还能让左栏内容更饱满。
 */

const isEn = computed(() => lang.value === 'en')
const cats = computed(() => (isEn.value ? stackCategoriesEn : stackCategories))
</script>

<template>
  <div class="mt-5 border-t border-ink/10 pt-4">
    <p class="eyebrow">{{ t('stack.graph') }}</p>
    <p class="mt-2 text-[12.5px] leading-[1.75] text-ink-muted">
      {{
        isEn
          ? `${cats.length} domains, ${allStackItems.length} technologies. Use the project filter in the graph to narrow the view, or hover any node to see how it is actually used.`
          : `${cats.length} 个领域、${allStackItems.length} 项技术。点图谱上方的项目筛选可以只看某个项目用到的部分；悬停任意节点查看它的实际用法。`
      }}
    </p>

    <div class="mt-3.5 space-y-2">
      <div v-for="c in cats" :key="c.id">
        <p class="flex items-baseline gap-2 text-[12.5px] font-semibold text-ink">
          <span class="claude-num">{{ String(c.items.length).padStart(2, '0') }}</span>
          {{ c.name }}
        </p>
        <p class="mt-0.5 pl-6 text-[11.5px] leading-[1.6] text-ink-faint">{{ c.caption }}</p>
      </div>
    </div>
  </div>
</template>
