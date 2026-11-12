<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { galleries } from '@/data/gallery'

/**
 * 照片轮播（首页画廊入口）。
 *
 * 把所有画廊的照片拍平成一条长序列，在这里连续展示。
 * 不是「每个集合一张封面」—— 那是上一版的做法，只露出很少内容。
 *
 * 布局：5 张同屏（中间主图 + 左右各两张景深虚化）。
 *   - 中间：完整不透明，放大，点击进入该照片所属画廊
 *   - 左右相邻：缩至 0.88 / 0.76，透明度 0.55 / 0.28，轻微旋转
 *   - 悬停任意卡片：临时暂停自动播放 + 该卡恢复不透明度
 *
 * 播放：
 *   - 默认自动循环（每 4.5 秒前进一张）
 *   - 用户点击任意控件后永久暂停（不再自动走）
 *   - 滚出视口时暂停定时器，省电
 *
 * 配色遵循 Claude 规范：浅底、1px 细边框、圆角 15px/3px、橙色强调。
 */

interface FlatPhoto {
  src: string
  caption: string
  note: string
  place?: string
  date?: string
  ratio: string
  /** 所属画廊 */
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
      ratio: p.ratio,
      gallerySlug: g.slug,
      galleryTitle: g.title,
      category: g.category,
    })),
  ),
)

const total = computed(() => photos.value.length)

/** 当前居中的照片索引 */
const index = ref(0)

/**
 * 用户是否手动操作过。
 *
 * 一旦点过就永久停止自动播放 —— 用户既然想自己控制，
 * 就不该再被自动轮播抢走节奏。
 */
const userPaused = ref(false)

/** 鼠标悬停中（临时暂停） */
const hovering = ref(false)

/**
 * 同屏可见的 5 张：offset ∈ [-2, 2]。
 *
 * 用循环取模，所以首尾会绕回 —— 视觉上是无限长卷轴。
 */
const visible = computed(() => {
  const n = total.value
  if (n === 0) return []
  return Array.from({ length: 5 }, (_, k) => {
    const offset = k - 2
    const i = (index.value + offset + n * 2) % n
    return { photo: photos.value[i]!, offset }
  })
})

/**
 * 每张卡的视觉参数：缩放、透明度、位移、旋转。
 *
 * 5 张同屏时两侧不能太虚 —— 太虚就看不出「这里有别的照片」，
 * 只剩中间一张。0.72 / 0.62 的透明度配合 0.9 / 0.8 的缩放，
 * 侧卡能看清内容但明显退到后面。
 */
const styleOf = (offset: number) => {
  const a = Math.abs(offset)
  const scale = offset === 0 ? 1 : a === 1 ? 0.87 : 0.76
  const opacity = offset === 0 ? 1 : a === 1 ? 0.7 : 0.52
  const shift = offset === 0 ? 0 : offset * 50
  const rotate = offset * 3
  /**
   * 底部对齐：Y 轴不做居中位移，卡片底边贴着容器底边。
   *
   * 所有卡片高度一致（图片区统一 4:3），
   * 所以底边对齐之后顶边也自然齐平 —— 整排卡片边框完全对齐。
   */
  return {
    transform: `translateX(-50%) translateX(${shift}%) scale(${scale}) rotate(${rotate}deg)`,
    opacity,
    zIndex: 30 - a,
  }
}

const go = (i: number) => {
  const n = total.value
  if (n === 0) return
  index.value = (i + n) % n
}

const prev = () => {
  userPaused.value = true
  go(index.value - 1)
}
const next = () => {
  userPaused.value = true
  go(index.value + 1)
}

/* ------------------------------------------------------------------ */
/*  自动播放                                                          */
/* ------------------------------------------------------------------ */

const INTERVAL = 4500
let timer: number | null = null
/** 是否在视口内 */
let inView = true

const startTimer = () => {
  stopTimer()
  if (userPaused.value || hovering.value || !inView) return
  timer = window.setInterval(() => {
    go(index.value + 1)
  }, INTERVAL)
}

const stopTimer = () => {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

let io: IntersectionObserver | null = null

onMounted(() => {
  startTimer()
  // 滚出视口就停表，回来再启
  io = new IntersectionObserver(
    (entries) => {
      inView = entries[0]?.isIntersecting ?? true
      if (inView) startTimer()
      else stopTimer()
    },
    { threshold: 0.15 },
  )
  const el = document.getElementById('gallery')
  if (el) io.observe(el)
})

onBeforeUnmount(() => {
  stopTimer()
  io?.disconnect()
})
</script>

<template>
  <div
    class="gallery-carousel"
    @mouseenter="hovering = true; stopTimer()"
    @mouseleave="hovering = false; startTimer()"
  >
    <!--
      照片带。

      卡片按各自图片比例撑开（不裁切、不旋转），
      所以高度本来就不一样 —— 这里让它们**底边对齐**：
      竖图顶部更高，横图顶部更低，但底边齐平，
      整排看起来是一条稳定的基线，而不是参差不齐的一堆。
    -->
    <div class="relative h-[300px] sm:h-[340px]">
      <div
        v-for="{ photo, offset } in visible"
        :key="`${photo.src}-${offset}`"
        class="absolute bottom-0 left-1/2 w-[min(46vw,264px)] transition-all duration-500 ease-out sm:w-[min(30vw,300px)]"
        :style="styleOf(offset)"
      >
        <!--
          中间主图 → 进入该照片所属画廊；
          侧图 → 点击切换到那张（同时永久暂停自动播放）。
        -->
        <component
          :is="offset === 0 ? 'RouterLink' : 'button'"
          :to="offset === 0 ? `/gallery/${photo.gallerySlug}` : undefined"
          :type="offset === 0 ? undefined : 'button'"
          class="group relative block w-full overflow-hidden rounded-[15px] border bg-raised text-left transition-[border-color,box-shadow] duration-200"
          :class="
            offset === 0
              ? 'border-ink/15 shadow-[0_16px_44px_-16px_rgba(32,31,29,0.4)] hover:border-claude/45'
              : 'border-ink/12 hover:border-ink/30'
          "
          :style="offset === 0 ? {} : { opacity: styleOf(offset).opacity }"
          @click="offset === 0 ? undefined : (userPaused = true, go(index + offset))"
        >
          <!--
            图片。

            关键：**不旋转、不裁切**，也不让卡片高度随图片变化。
            做法是给图片区一个统一的 4:3 容器，
            真实比例的图片用 object-contain 居中放进去 ——
            竖图两侧自然留白（不裁内容、不变形），
            而 5 张卡片的边框高度完全一致，视觉上是一整排整齐的卡片。
          -->
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
            说明：主图用浮层压在图片底部（absolute），
            不占布局高度 —— 这样主卡和侧卡的总高度一致，
            整排底边与顶边都在同一条基线上。
          -->
          <div
            v-if="offset === 0"
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
          {{ String(index + 1).padStart(2, '0') }} / {{ String(total).padStart(2, '0') }}
        </span>
        <div class="h-px w-24 overflow-hidden bg-ink/12">
          <div
            class="h-px bg-claude transition-[width] duration-300 ease-out"
            :style="{ width: `${((index + 1) / total) * 100}%` }"
          />
        </div>
        <span
          v-if="userPaused"
          class="font-mono text-[10px] text-ink-faint"
          title="自动播放已暂停"
        >
          PAUSED
        </span>
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
 * 所有过渡只动 transform / opacity（合成层属性），
 * 不触发重排 —— 5 张卡同时在动，重排会明显掉帧。
 */
.gallery-carousel button,
.gallery-carousel a {
  -webkit-tap-highlight-color: transparent;
}
</style>
