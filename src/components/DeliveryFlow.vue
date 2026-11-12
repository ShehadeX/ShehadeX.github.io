<script setup lang="ts">
import { t } from '@/composables/useI18n'

/**
 * 交付流程示意图。
 *
 * 四步串行：Figma 原型 → Claude 架构 → DeepSeek 实现 → GitHub 版本管理。
 * 连接线用 div + dashed border 实现（SVG path 上的 display 切换在
 * 某些浏览器里不可靠），节点序号与开发哲学的 01/02/03 呼应。
 */
const steps = [
  { key: 's1', n: '01', name: 'flow.s1.t', desc: 'flow.s1.d' },
  { key: 's2', n: '02', name: 'flow.s2.t', desc: 'flow.s2.d' },
  { key: 's3', n: '03', name: 'flow.s3.t', desc: 'flow.s3.d' },
  { key: 's4', n: '04', name: 'flow.s4.t', desc: 'flow.s4.d' },
]
</script>

<template>
  <div class="reveal gpu overflow-hidden rounded-[15px] border border-ink/12 bg-base">
    <!-- 头部 -->
    <div class="flex items-center justify-between gap-4 border-b border-ink/10 bg-raised px-5 py-3">
      <p class="eyebrow">{{ t('flow.eyebrow') }}</p>
      <p class="font-mono text-[10.5px] tracking-[0.12em] text-ink-faint">
        {{ t('flow.title') }}
      </p>
    </div>

    <div class="px-5 py-6 sm:px-6 sm:py-7">
      <!-- 桌面：横向连线 -->
      <div class="relative hidden sm:block">
        <div
          class="pointer-events-none absolute left-[12%] right-[12%] top-[18px] border-t border-dashed border-ink/30"
          aria-hidden="true"
        />
        <ol class="relative grid grid-cols-4 gap-4">
          <li v-for="s in steps" :key="s.key" class="group/flow flex flex-col items-center text-center">
            <span
              class="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-claude/45 bg-base font-mono text-[12px] font-medium text-claude transition-transform duration-200 ease-out group-hover/flow:scale-105"
            >
              {{ s.n }}
            </span>
            <p class="mt-3 text-[15px] font-semibold text-ink">{{ t(s.name) }}</p>
            <p class="mt-0.5 font-mono text-[10.5px] tracking-[0.1em] text-ink-faint">
              {{ t(s.desc) }}
            </p>
          </li>
        </ol>
      </div>

      <!-- 移动：纵向连线 -->
      <ol class="relative sm:hidden">
        <li
          v-for="(s, i) in steps"
          :key="s.key"
          class="group/flow relative flex gap-4 pb-6 last:pb-0"
        >
          <!-- 竖向连接线 -->
          <div
            v-if="i < steps.length - 1"
            class="absolute left-[18px] top-10 h-[calc(100%-2.5rem)] border-l border-dashed border-ink/30"
            aria-hidden="true"
          />
          <span
            class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-claude/45 bg-base font-mono text-[12px] font-medium text-claude"
          >
            {{ s.n }}
          </span>
          <div class="min-w-0 pt-1">
            <p class="text-[15px] font-semibold text-ink">{{ t(s.name) }}</p>
            <p class="mt-0.5 font-mono text-[10.5px] tracking-[0.1em] text-ink-faint">
              {{ t(s.desc) }}
            </p>
          </div>
        </li>
      </ol>

      <p class="mt-6 border-t border-ink/10 pt-4 text-[12.5px] leading-relaxed text-ink-muted">
        {{ t('flow.note') }}
      </p>
    </div>
  </div>
</template>
