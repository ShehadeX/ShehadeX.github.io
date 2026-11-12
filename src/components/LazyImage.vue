<script setup lang="ts">
import { ref } from 'vue'

/**
 * 图片组件。
 *
 * 为什么不使用原生 loading="lazy"：
 * 原生懒加载与 IntersectionObserver 都依赖浏览器的渲染管线来投递回调。
 * 在嵌入式 webview、后台标签页以及部分无头浏览器中，这个回调可能永远不触发，
 * 结果是图片停留在「已请求但未发起网络请求」的状态（complete=false、
 * naturalWidth=0），页面上表现为一片空白。
 *
 * 站点图片已全部压缩为 WebP，总体积约 2.2MB，单张 20–175KB，
 * 直接加载的成本远低于「图片不显示」的代价，因此这里不做延迟加载。
 */
interface Props {
  src: string
  alt: string
  /** 容器固定比例，避免加载完成时布局跳动 */
  ratio?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  ratio: '16 / 10',
  class: '',
})

const loaded = ref(false)
const failed = ref(false)
</script>

<template>
  <div
    class="relative overflow-hidden bg-raised"
    :style="{ aspectRatio: ratio }"
    :class="props.class"
  >
    <!-- 占位骨架：结构化，不用 spinner -->
    <div
      v-if="!loaded && !failed"
      class="absolute inset-0 grid-lines opacity-60"
      aria-hidden="true"
    />

    <img
      :src="src"
      :alt="alt"
      decoding="async"
      :class="[
        'h-full w-full object-cover object-top transition-opacity duration-200 ease-out',
        loaded ? 'opacity-100' : 'opacity-0',
      ]"
      @load="loaded = true"
      @error="failed = true"
    />

    <!-- 加载失败兜底：不让卡片变成空白黑洞 -->
    <div
      v-if="failed"
      class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-raised px-4 text-center"
    >
      <span class="font-mono text-[11px] text-ink-faint">image unavailable</span>
      <span class="font-mono text-[10px] text-ink-faint/70">{{ alt }}</span>
    </div>
  </div>
</template>
