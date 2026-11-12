<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GalleryEntry } from '@/data/gallery'

/**
 * 画廊卡片（3D 景深堆叠）。
 *
 * 布局参考 Testimonial 三卡堆叠：
 *   - 中间卡片是主视觉（放大、置顶、不透明）
 *   - 左右两张缩小、降低透明度、向两侧偏移并带轻微旋转
 *   - 底部有左右切换的圆形按钮
 *
 * 配色遵循 Claude 规范：
 *   - 浅色底 #ECE9E0 / 卡片 #DBD1C0
 *   - 强调色用 --color-claude（橙），不是紫粉渐变
 *   - 圆角只用 15px（卡片）与 3px（按钮）
 *   - 1px 细边框
 *
 * 卡片高度按图片比例自适应：
 *   横图（4:3）占主卡高度，竖图（3:4）用较高容器，
 *   避免同一排里高度参差不齐。
 */

const props = defineProps<{
  galleries: GalleryEntry[]
}>()

/** 当前居中的画廊索引 */
const index = ref(0)

const count = computed(() => props.galleries.length)
/**
 * 相对当前索引的位置偏移：-2 / -1 / 0 / 1 / 2。
 * 只渲染 |offset| <= 1 的卡片，避免一次画五张。
 */
const visible = computed(() =>
  props.galleries.map((g, i) => ({ g, offset: i - index.value })).filter((x) => Math.abs(x.offset) <= 1),
)

const prev = () => {
  index.value = (index.value - 1 + count.value) % count.value
}
const next = () => {
  index.value = (index.value + 1) % count.value
}
</script>

<template>
  <div class="gallery-carousel">
    <!--
      卡片堆叠区。
      高度按主卡的图片比例 + 文字块撑开，
      所以容器高度给足，避免卡片溢出被裁切。
    -->
    <div class="relative h-[520px] sm:h-[560px]">
      <div
        v-for="{ g, offset } in visible"
        :key="g.slug"
        class="absolute left-1/2 top-1/2 w-[min(80vw,460px)] transition-all duration-300 ease-out"
        :style="{
          transform: `translate(-50%, -50%) translateX(${offset * 58}%) scale(${offset === 0 ? 1 : 0.78}) rotate(${offset * 5}deg)`,
          zIndex: offset === 0 ? 30 : 20 - Math.abs(offset),
          opacity: offset === 0 ? 1 : 0.4,
        }"
      >
        <!--
          非主卡可点击切换；
          主卡点击进入详情。
          hover 时恢复不透明度（对应 Testimonial 的悬停反馈）。
        -->
        <RouterLink
          v-if="offset === 0"
          :to="`/gallery/${g.slug}`"
          class="group block overflow-hidden rounded-[15px] border border-ink/15 bg-raised transition-shadow duration-200 hover:shadow-[0_12px_40px_-12px_rgba(32,31,29,0.35)]"
        >
          <!-- 图片 -->
          <div class="relative overflow-hidden bg-raised">
            <img
              :src="g.cover"
              :alt="g.title"
              loading="lazy"
              decoding="async"
              class="block w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              :style="{ aspectRatio: g.coverRatio }"
            />
            <!-- 顶边高光：锐利的边缘高光 + 柔和的暖色泛光 -->
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-px bg-ink/20"
            />
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-claude/12 to-transparent"
            />
          </div>

          <!-- 文字 -->
          <div class="border-t border-ink/10 bg-raised p-5">
            <div class="flex items-baseline gap-2.5">
              <span class="claude-num">{{ g.category }}</span>
              <span class="ml-auto font-mono text-[10.5px] text-ink-faint">
                {{ g.photos.length }} {{ 'photos' }}
              </span>
            </div>
            <h3 class="mt-2 text-[19px] font-semibold leading-tight text-ink">
              {{ g.title }}
            </h3>
            <p class="mt-1 text-[12.5px] text-ink-muted">{{ g.subtitle }}</p>
            <p class="mt-3 line-clamp-2 text-[12.5px] leading-[1.7] text-ink-muted">
              {{ g.intro }}
            </p>
            <span
              class="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-claude-deep"
            >
              进入画廊 <span aria-hidden="true">→</span>
            </span>
          </div>
        </RouterLink>

        <!-- 两侧卡片 -->
        <button
          v-else
          type="button"
          class="block w-full overflow-hidden rounded-[15px] border border-ink/12 bg-raised text-left transition-opacity duration-200 hover:opacity-100"
          @click="offset < 0 ? prev() : next()"
        >
          <img
            :src="g.cover"
            :alt="g.title"
            loading="lazy"
            decoding="async"
            class="block w-full object-cover"
            :style="{ aspectRatio: g.coverRatio }"
          />
          <div class="border-t border-ink/10 p-4">
            <p class="text-[14px] font-semibold text-ink">{{ g.title }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- 导航控件 -->
    <div class="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:bg-raised hover:text-ink"
        aria-label="Previous gallery"
        @click="prev"
      >
        <span aria-hidden="true">‹</span>
      </button>

      <!-- 指示点 -->
      <div class="flex items-center gap-1.5">
        <button
          v-for="(g, i) in galleries"
          :key="g.slug"
          type="button"
          class="h-1.5 rounded-full transition-all duration-200"
          :class="i === index ? 'w-6 bg-claude' : 'w-1.5 bg-ink/20 hover:bg-ink/35'"
          :aria-label="`Go to ${g.title}`"
          @click="index = i"
        />
      </div>

      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink-muted transition-colors duration-150 hover:border-claude/45 hover:bg-raised hover:text-ink"
        aria-label="Next gallery"
        @click="next"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * 卡片堆叠。
 *
 * 用 transform + opacity 做过渡（合成层属性），
 * 不动 width/height，避免每次切换触发重排。
 */
.gallery-carousel button,
.gallery-carousel a {
  -webkit-tap-highlight-color: transparent;
}
</style>
