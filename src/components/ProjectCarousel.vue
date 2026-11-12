<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LazyImage from '@/components/LazyImage.vue'
import type { GalleryItem } from '@/data/projects'

/**
 * 项目截图轮播（左右定时滑动）。
 *
 * 交互要点：
 *   - 自动播放：每 4.6s 向左推进一张，鼠标悬停 / 获得焦点时暂停
 *   - 手动控制：左右箭头 + 底部指示点，点击直接跳到对应帧
 *   - 过渡：CSS transform 横向位移，切换时平滑滑动而非闪切
 *   - 轨道宽度按帧数动态计算，保证每帧严格等宽，滑动不会错位
 */

interface Props {
  items: GalleryItem[]
  /** 展示帧的宽高比，容器高度由此固定 */
  ratio?: string
  /** 自动播放间隔（毫秒） */
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  ratio: '16 / 10',
  interval: 4600,
})

const index = ref(0)
const paused = ref(false)
const count = computed(() => props.items.length)

let timer: number | undefined

function next() {
  if (count.value <= 1) return
  index.value = (index.value + 1) % count.value
}

function prev() {
  if (count.value <= 1) return
  index.value = (index.value - 1 + count.value) % count.value
}

function go(i: number) {
  index.value = i
}

/** 重置计时器：切换语言/数据后从第一帧重新播放 */
function restart() {
  index.value = 0
  start()
}

/**
 * 自动播放计时器。
 *
 * 暂停时不是"跳过"，而是整体停表：
 * 这样鼠标移开后会从当前帧重新计时，而不是立刻跳下一帧。
 */
function start() {
  stop()
  if (count.value <= 1) return
  timer = window.setInterval(() => {
    if (paused.value) return
    next()
  }, props.interval)
}


function stop() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

onMounted(start)
onBeforeUnmount(stop)
watch(() => props.items.length, restart)

/**
 * 轨道位移。
 *
 * 横屏：每帧占满容器（100%），位移 = -索引 * 100%。
 * 竖屏：手机截图较窄，若仍占满 100% 会在两侧留下大片空白；
 *      这里让每帧只占一部分宽度并居中，前后帧从两侧露出，
 *      视觉上就是「几张手机截图并排」，既填满画面又不裁切内容。
 */
const trackStyle = computed(() => {
  if (!allPortrait.value) {
    return { transform: `translate3d(-${index.value * 100}%, 0, 0)` }
  }
  // 步长必须与帧宽一致，相邻帧才正好错开一格
  const step = 38
  const offset = index.value * step
  return {
    transform: `translate3d(calc(50% - ${offset}%), 0, 0)`,
  }
})

const current = computed(() => props.items[index.value] ?? null)

/**
 * 是否整体为竖屏素材（手机截图）。
 *
 * 按**整个 gallery** 判断，而不是只看当前帧：
 * 若混有横屏与竖屏，逐帧切换 fit 会出现「同一张图忽然被裁 / 忽然留白」的跳变。
 */
const allPortrait = computed(() => {
  if (!props.items.length) return false
  return props.items.every((it) => {
    const r = it.ratio
    if (!r) return false
    const [w, h] = r.split('/').map((v) => parseFloat(v.trim()))
    return Number.isFinite(w) && Number.isFinite(h) && h > w
  })
})


</script>

<template>
  <div
    class="group/carousel relative overflow-hidden rounded-[10px] border border-ink/10 bg-raised"
    @pointerenter="paused = true"
    @pointerleave="paused = false"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <!-- 画面 -->
    <div class="relative overflow-hidden" :style="{ aspectRatio: ratio }">
      <div
        class="flex h-full w-full transition-transform duration-[560ms] ease-[cubic-bezier(0.4,0.02,0.2,1)]"
        :style="trackStyle"
      >
        <div
          v-for="(item, i) in items"
          :key="item.src + i"
          class="relative h-full shrink-0 grow-0"
          :class="allPortrait ? 'w-[38%]' : 'w-full basis-full'"
          :aria-hidden="i !== index"
        >
          <!--
            竖屏素材用 contain 完整显示（不裁切手机界面），
            并给底衬一点背景色，避免大片空白看起来像图裂了。
          -->
          <!--
            统一用 contain：系统截图的关键信息经常分布在左右两侧，
            cover 会直接裁掉，等于把内容丢了。
          -->
          <LazyImage
            :src="item.src"
            :alt="item.caption"
            :ratio="ratio"
            fit="contain"
            fill
            class="bg-raised/50"
          />
        </div>
      </div>

      <!-- CASE 徽章 -->
      <span
        class="absolute left-3 top-3 inline-flex h-6 items-center rounded-[3px] bg-overlay px-2.5 font-mono text-[10px] tracking-[0.12em] text-base"
      >
        <slot name="badge" />
      </span>

      <!-- 左右箭头 -->
      <button
        v-if="count > 1"
        type="button"
        class="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[4px] bg-base/80 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/carousel:opacity-100 focus-visible:opacity-100"
        aria-label="previous slide"
        @click.stop.prevent="prev"
      >
        <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M10 3 5 8l5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="count > 1"
        type="button"
        class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[4px] bg-base/80 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover/carousel:opacity-100 focus-visible:opacity-100"
        aria-label="next slide"
        @click.stop.prevent="next"
      >
        <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M6 3l5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 底部渐变 + 图注 -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-overlay/85 to-transparent px-3 pb-2.5 pt-8"
      >
        <p class="font-mono text-[10.5px] leading-tight text-base/90">{{ current?.caption }}</p>
        <span
          class="shrink-0 font-mono text-[10px] tabular-nums text-base/70"
        >
          {{ String(index + 1).padStart(2, '0') }} / {{ String(count).padStart(2, '0') }}
        </span>
      </div>
    </div>

    <!-- 指示点 -->
    <div v-if="count > 1" class="flex items-center justify-center gap-1.5 border-t border-ink/10 bg-base px-3 py-2">
      <button
        v-for="i in count"
        :key="`dot-${i}`"
        type="button"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="i === index ? 'w-5 bg-claude' : 'w-1.5 bg-ink/20 hover:bg-ink/40'"
        :aria-label="`go to slide ${i + 1}`"
        :aria-current="i === index"
        @click.stop.prevent="go(i)"
      />
    </div>
  </div>
</template>
