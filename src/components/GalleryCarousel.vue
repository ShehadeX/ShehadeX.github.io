<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { galleries } from '@/data/gallery'

/**
 * 照片轮播（首页画廊入口）。
 *
 * 把所有画廊的照片拍平成一条长序列，在这里连续展示。
 *
 * 动画模型：**连续位置 + rAF 贝塞尔缓动**。
 *
 *   - `pos` 是一个浮点位置（3.42 = 正从第 3 张滑向第 4 张），
 *     卡片位置/缩放/透明度都从它连续插值出来，
 *     所以整排卡片是「流」过去的，不是整格跳。
 *
 *   - 缓动用自定义三次贝塞尔 (0.22, 1, 0.36, 1) ——
 *     起步快、收尾慢，带一点非线性减速。
 *
 *   - 停留时长**非等间隔**：用确定性伪随机给每张照片一个
 *     3.4s–6.2s 的停留时间，避免机械的匀速节拍。
 *
 *   - rAF 只在「正在滑动」和「等待下一跳」时运行，
 *     静止时不占用任何 CPU。
 *
 * 播放策略：
 *   - 默认自动循环
 *   - 用户点过任何控件 → 永久暂停
 *   - 鼠标悬停 → 临时暂停
 *   - 滚出视口 → 停表
 */

interface FlatPhoto {
  src: string
  caption: string
  note: string
  place?: string
  date?: string
  gallerySlug: string
  galleryTitle: string
  category: string
}

/** 拍平所有画廊的照片 */
const photos = computed<FlatPhoto[]>(() =>
  galleries.flatMap((g) =>
    g.photos.map((p) => ({
      src: p.src,
      caption: p.caption,
      note: p.note,
      place: p.place,
      date: p.date,
      gallerySlug: g.slug,
      galleryTitle: g.title,
      category: g.category,
    })),
  ),
)

const total = computed(() => photos.value.length)

/**
 * 连续位置。
 *
 * 整数部分 = 当前卡片序号，小数部分 = 滑向下一张的进度。
 */
const pos = ref(0)

/**
 * 用户是否手动操作过。
 *
 * 点过之后暂停自动播放，让用户自己掌控节奏；
 * 但 **10 秒后自动恢复** —— 避免「点了一下之后轮播就死了」，
 * 也避免用户离开后画面长期停在原地。
 */
const userPaused = ref(false)

/** 手动操作后自动恢复的延迟（ms） */
const RESUME_DELAY = 10_000

/** 鼠标悬停中（临时暂停） */
const hovering = ref(false)

/* ------------------------------------------------------------------ */
/*  缓动                                                              */
/* ------------------------------------------------------------------ */

/**
 * 三次贝塞尔缓动求值（牛顿迭代 + 二分兜底）。
 *
 * CSS 的 cubic-bezier 只能用在 CSS 过渡里；
 * 这里要在 rAF 里驱动 JS 动画，所以自己解。
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a
  const B = (a: number, b: number) => 3 * b - 6 * a
  const C = (a: number) => 3 * a
  const calc = (t: number, a: number, b: number) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t
  const slope = (t: number, a: number, b: number) =>
    3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a)

  return (x: number): number => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    // 先用牛顿迭代求 t
    let t = x
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2)
      if (Math.abs(d) < 1e-6) break
      const e = calc(t, x1, x2) - x
      if (Math.abs(e) < 1e-7) return calc(t, y1, y2)
      t -= e / d
    }
    // 牛顿迭代失败则二分
    let lo = 0
    let hi = 1
    t = x
    while (hi - lo > 1e-7) {
      const v = calc(t, x1, x2)
      if (Math.abs(v - x) < 1e-7) break
      if (v > x) hi = t
      else lo = t
      t = (lo + hi) / 2
    }
    return calc(t, y1, y2)
  }
}

/** 主缓动：起步快、收尾慢的非线性减速 */
const ease = cubicBezier(0.22, 1, 0.36, 1)

/* ------------------------------------------------------------------ */
/*  渲染数据                                                          */
/* ------------------------------------------------------------------ */

/**
 * 同屏可见的 5 张。
 *
 * offset 是**连续值**（例如 -1.42），不是整数 ——
 * 卡片位置由它连续插值出来，所以滑动过程是平滑流动的。
 */
const visible = computed(() => {
  const n = total.value
  if (n === 0) return []
  const center = Math.round(pos.value)
  return Array.from({ length: 5 }, (_, k) => {
    const idx = center + (k - 2)
    const wrapped = ((idx % n) + n) % n
    return {
      photo: photos.value[wrapped]!,
      /** 相对当前位置的连续偏移 */
      offset: idx - pos.value,
      /** 归一化索引，用于 key */
      idx,
    }
  })
})

/** 主卡（离中心最近的那张）的索引 */
const focusIdx = computed(() => Math.round(pos.value))

/** 每张卡的视觉参数：缩放、透明度、位移、旋转 */
const styleOf = (offset: number) => {
  const a = Math.abs(offset)
  /** 距离中心越远越小、越淡、旋转越多 —— 全部按 a 连续插值 */
  const scale = 1 - Math.min(a, 2) * 0.13
  const opacity = 1 - Math.min(a, 2) * 0.26
  const shift = offset * 50
  const rotate = offset * 3
  return {
    transform: `translateX(-50%) translateX(${shift}%) scale(${scale}) rotate(${rotate}deg)`,
    opacity,
    zIndex: 30 - Math.round(a),
  }
}

/* ------------------------------------------------------------------ */
/*  动画循环                                                          */
/* ------------------------------------------------------------------ */

let animStart = 0
let animFrom = 0
let animTo = 0
let animDur = 0

/** 确定性伪随机：同一张照片每次的停留时间一致 */
const jitter = (i: number) => {
  const x = Math.sin(i * 91.7 + 43.1) * 43758.5453
  return x - Math.floor(x)
}

/**
 * 停留时长：3.4s – 6.2s，非等间隔。
 *
 * 用照片索引做种子，保证同一张图的停留时间每次都一样
 * （刷新页面节奏不变），但不同照片之间节奏不同。
 */
const dwellFor = (i: number) => 3400 + jitter(i) * 2800

/**
 * 动画调度。
 *
 * 关键：**静止时没有任何 rAF 在跑**。
 *   - 滑动阶段才用 requestAnimationFrame（需要逐帧插值）
 *   - 等待阶段用 setTimeout（不需要逐帧更新）
 *
 * 所以页面静止时 CPU 占用为 0 —— 不存在「实时计算」。
 */
let rafId: number | null = null
/** 等待阶段的定时器 */
let waitTimer: number | null = null
/** 手动操作后自动恢复的定时器 */
let resumeTimer: number | null = null

/** 滑动阶段：逐帧插值 */
const rafTick = (now: number) => {
  rafId = null
  const t = Math.min(1, (now - animStart) / animDur)
  const e = ease(t)
  pos.value = animFrom + (animTo - animFrom) * e

  if (t < 1) {
    rafId = requestAnimationFrame(rafTick)
    return
  }

  // 落位
  pos.value = animTo
  animDur = 0
  scheduleNext()
}

/** 悬停：暂停等待计时 */
const pauseForHover = () => {
  hovering.value = true
  if (waitTimer !== null) {
    clearTimeout(waitTimer)
    waitTimer = null
  }
}

/** 移出：恢复等待 */
const resumeFromHover = () => {
  hovering.value = false
  scheduleNext()
}

/**
 * 安排下一跳。
 *
 * 停留时长按照片索引做种子 → 非等间隔（3.4s–6.2s），
 * 而且同一张照片每次的节奏一致（刷新页面不变）。
 */
const scheduleNext = () => {
  if (waitTimer !== null) {
    clearTimeout(waitTimer)
    waitTimer = null
  }
  if (userPaused.value || hovering.value || !inView) return
  waitTimer = window.setTimeout(() => {
    waitTimer = null
    step(1)
  }, dwellFor(Math.round(pos.value)))
}

/** 滑动到某个目标位置 */
const glideTo = (to: number, dur: number) => {
  const n = total.value
  if (n === 0) return
  // 取最短路径（支持跨过两端绕回）
  let d = to - pos.value
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  animFrom = pos.value
  animTo = pos.value + d
  animDur = dur
  animStart = performance.now()

  if (waitTimer !== null) {
    clearTimeout(waitTimer)
    waitTimer = null
  }
  if (rafId === null) rafId = requestAnimationFrame(rafTick)
}

/**
 * 恢复自动播放。
 *
 * 10 秒倒计时结束、或用户点「继续播放」时调用。
 */
const resumeAuto = () => {
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer)
    resumeTimer = null
  }
  userPaused.value = false
  scheduleNext()
}

/**
 * 手动操作后：暂停并启动 10 秒恢复倒计时。
 *
 * 每次操作都重置计时器 —— 用户连续操作时不该中途被抢走节奏。
 */
const pauseTemporarily = () => {
  userPaused.value = true
  if (waitTimer !== null) {
    clearTimeout(waitTimer)
    waitTimer = null
  }
  if (resumeTimer !== null) clearTimeout(resumeTimer)
  resumeTimer = window.setTimeout(() => {
    resumeTimer = null
    userPaused.value = false
    scheduleNext()
  }, RESUME_DELAY)
}

/** 前进/后退一格 */
const step = (dir: number) => {
  const n = total.value
  if (n === 0) return
  glideTo(pos.value + dir, 720)
}

const prev = () => {
  pauseTemporarily()
  step(-1)
}
const next = () => {
  pauseTemporarily()
  step(1)
}

/** 点击侧卡 → 把它滑到中心 */
const jumpTo = (idx: number) => {
  pauseTemporarily()
  glideTo(idx, 620)
}

/* ------------------------------------------------------------------ */
/*  生命周期                                                          */
/* ------------------------------------------------------------------ */

let io: IntersectionObserver | null = null
/** 是否在视口内 */
let inView = true

onMounted(() => {
  // 滚出视口就停表，回来再启
  io = new IntersectionObserver(
    (entries) => {
      const wasIn = inView
      inView = entries[0]?.isIntersecting ?? true
      if (inView && !wasIn) scheduleNext()
      if (!inView && waitTimer !== null) {
        clearTimeout(waitTimer)
        waitTimer = null
      }
    },
    { threshold: 0.15 },
  )
  const el = document.getElementById('gallery')
  if (el) io.observe(el)

  scheduleNext()
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (waitTimer !== null) clearTimeout(waitTimer)
  if (resumeTimer !== null) clearTimeout(resumeTimer)
  io?.disconnect()
})
</script>

<template>
  <div
    class="gallery-carousel"
    @mouseenter="pauseForHover"
    @mouseleave="resumeFromHover"
  >
    <!--
      照片带。
      卡片按各自图片比例撑开（不裁切、不旋转），
      图片区统一 4:3 容器 + object-contain，
      所以 5 张卡片边框高度一致，底边对齐。
    -->
    <div class="relative h-[300px] sm:h-[340px]">
      <div
        v-for="{ photo, offset, idx } in visible"
        :key="`${photo.src}-${idx}`"
        class="absolute bottom-0 left-1/2 w-[min(46vw,264px)] sm:w-[min(30vw,300px)]"
        :style="styleOf(offset)"
      >
        <!--
          主卡 → 进入该照片所属画廊；
          侧卡 → 点击把它滑到中心（同时永久暂停自动播放）。
        -->
        <component
          :is="idx === focusIdx ? 'RouterLink' : 'button'"
          :to="idx === focusIdx ? `/gallery/${photo.gallerySlug}` : undefined"
          :type="idx === focusIdx ? undefined : 'button'"
          class="group relative block w-full overflow-hidden rounded-[15px] border bg-raised text-left transition-[border-color,box-shadow] duration-200"
          :class="
            idx === focusIdx
              ? 'border-ink/15 shadow-[0_16px_44px_-16px_rgba(32,31,29,0.4)] hover:border-claude/45'
              : 'border-ink/12 hover:border-ink/30'
          "
          @click="idx === focusIdx ? undefined : jumpTo(idx)"
        >
          <!-- 图片 -->
          <div class="relative aspect-[4/3] overflow-hidden bg-raised">
            <img
              :src="photo.src"
              :alt="photo.caption"
              loading="lazy"
              decoding="async"
              class="block size-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <!-- 顶边锐利高光 + 柔和暖色泛光 -->
            <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-ink/20" />
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-claude/12 to-transparent"
            />
          </div>

          <!--
            说明：只在主卡上显示，用浮层压在图片底部，
            不占布局高度 —— 主卡与侧卡总高一致，整排对齐。
          -->
          <div
            v-if="idx === focusIdx"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 via-ink/78 to-transparent px-3.5 pb-3 pt-10"
          >
            <div class="flex items-baseline gap-2">
              <span class="font-mono text-[10px] uppercase tracking-[0.12em] text-base/70">
                {{ photo.category }}
              </span>
              <span class="ml-auto truncate font-mono text-[10px] text-base/60">
                {{ photo.place }}
              </span>
            </div>
            <p class="mt-1 text-[13px] font-semibold leading-snug text-base">
              {{ photo.caption }}
            </p>
            <p class="mt-1 line-clamp-1 text-[11.5px] leading-[1.6] text-base/75">
              {{ photo.note }}
            </p>
            <p class="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-claude">
              {{ photo.galleryTitle }} <span aria-hidden="true">→</span>
            </p>
          </div>
        </component>
      </div>
    </div>

    <!-- 导航控件 -->
    <div class="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:bg-raised hover:text-ink"
        aria-label="Previous photo"
        @click="prev"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <!-- 进度指示：当前 / 总数 + 细进度条 -->
      <div class="flex items-center gap-3">
        <span class="font-mono text-[10.5px] tabular-nums text-ink-faint">
          {{ String(focusIdx + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}
        </span>
        <div class="h-px w-24 overflow-hidden bg-ink/12">
          <div
            class="h-px bg-claude transition-[width] duration-300 ease-out"
            :style="{ width: `${((focusIdx + 1) / total) * 100}%` }"
          />
        </div>
        <!--
          暂停状态提示。
          手动操作后暂停，10 秒后自动恢复；也可以点这里立即恢复。
        -->
        <button
          v-if="userPaused"
          type="button"
          class="group flex items-center gap-1.5 font-mono text-[10px] text-ink-faint transition-colors duration-150 hover:text-claude"
          title="已暂停，10 秒后自动播放（点击立即恢复）"
          @click="resumeAuto"
        >
          <span
            class="flex size-3.5 items-center justify-center rounded-full border border-current transition-colors duration-150 group-hover:border-claude"
            aria-hidden="true"
          >
            <span class="ml-px block size-1.5 bg-current transition-colors duration-150 group-hover:bg-claude" />
          </span>
          <span class="tracking-[0.1em]">10s 后自动播放</span>
        </button>
      </div>

      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:bg-raised hover:text-ink"
        aria-label="Next photo"
        @click="next"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * 照片轮播。
 *
 * 位置由 rAF 每帧写入 style（transform / opacity），
 * 所以这里不能再给卡片加 transition ——
 * 否则浏览器缓动会和 JS 缓动打架，出现「顿一下再动」。
 * 只保留 border-color / box-shadow 的过渡。
 */
.gallery-carousel button,
.gallery-carousel a {
  -webkit-tap-highlight-color: transparent;
}
</style>
