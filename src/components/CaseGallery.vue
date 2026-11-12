<script setup lang="ts">
import { computed } from 'vue'

/**
 * 项目 Gallery —— 额外补充与记录。
 *
 * 与 Case Study 里的 media 段落不同，这里不是"讲一个功能"，
 * 而是**把实习期做过的其他界面原样收进来**，每张图配一段说明，
 * 作为工作痕迹的存档。
 *
 * 设计遵循 Claude / Anthropic 的界面规范：
 *   - 浅色底（#ECE9E0 / #DBD1C0），1px 细边框
 *   - 圆角只用 3px 与 15px 两档
 *   - 4px 栅格间距，字号取 10 / 11 / 14 / 15 / 17px
 *   - 动效只动 transform 与 opacity，且不超过 200ms
 *
 * 布局：单列纵向排列。截图本身是主角，文字在下方，
 * 不做多列瀑布流 —— 那样每张图会被压得太小，看不清界面细节。
 */

interface GalleryEntry {
  src: string
  caption: string
  note?: string
  /** 这张图背后的一段记录：为什么做、踩了什么坑 */
  story?: string
  ratio?: string
  /** 分组标签，如「管理后台」「采集端」 */
  tag?: string
}

const props = defineProps<{
  entries: GalleryEntry[]
  /** 段落引导语 */
  intro?: string
}>()

/** 按 tag 分组，保持传入顺序 */
const groups = computed(() => {
  const map = new Map<string, GalleryEntry[]>()
  for (const e of props.entries) {
    const key = e.tag ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return [...map.entries()]
})
</script>

<template>
  <div class="gallery">
    <p v-if="intro" class="max-w-[62ch] text-[14px] leading-[1.8] text-ink-body">
      {{ intro }}
    </p>

    <div v-for="[tag, items] in groups" :key="tag || '_'" class="mt-10 first:mt-8">
      <!-- 分组标题 -->
      <div v-if="tag" class="flex items-baseline gap-3 border-b border-ink/10 pb-2.5">
        <span class="eyebrow">{{ tag }}</span>
        <span class="font-mono text-[10.5px] text-ink-faint">
          {{ String(items.length).padStart(2, '0') }}
        </span>
      </div>

      <!-- 单列：图在上，说明在下 -->
      <div class="mt-6 space-y-10">
        <figure
          v-for="(e, i) in items"
          :key="e.src"
          class="reveal"
        >
          <!-- 图片 -->
          <div
            class="overflow-hidden rounded-[15px] border border-ink/12 bg-raised"
          >
            <img
              :src="e.src"
              :alt="e.caption"
              loading="lazy"
              decoding="async"
              class="block w-full"
              :style="e.ratio ? { aspectRatio: e.ratio, objectFit: 'contain' } : undefined"
            />
          </div>

          <!-- 编号 + 标题 -->
          <figcaption class="mt-4 flex items-baseline gap-2.5">
            <span class="claude-num shrink-0">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span class="text-[15px] font-semibold text-ink">{{ e.caption }}</span>
          </figcaption>

          <!-- 说明 -->
          <p
            v-if="e.note"
            class="mt-2 max-w-[68ch] pl-[26px] text-[13.5px] leading-[1.75] text-ink-body"
          >
            {{ e.note }}
          </p>

          <!-- 记录 -->
          <div
            v-if="e.story"
            class="mt-3.5 max-w-[68ch] border-l-2 border-claude/45 pl-4"
          >
            <p class="claude-num">Record</p>
            <p class="mt-1.5 text-[13px] leading-[1.8] text-ink-muted">
              {{ e.story }}
            </p>
          </div>
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Gallery 容器。
 *
 * 图片统一用 contain（不裁切）：
 * 系统截图的信息经常分布在左右两侧，cover 会直接丢内容。
 * 竖屏截图用 aspect-ratio 限定高度，contain 居中留白。
 */
.gallery img {
  background: var(--color-raised);
  object-fit: contain;
  width: 100%;
}
</style>
