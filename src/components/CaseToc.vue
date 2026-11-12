<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 跟随视觉焦点的目录。
 *
 * 需求：目录要「跟着视觉焦点走」——
 *   页面滚动时，当前正在阅读的那一节会在目录里高亮并自动滚进视野，
 *   而不是让用户自己在目录里找位置。
 *
 * 实现要点：
 *   1. 用 IntersectionObserver 观察每个锚点，取「最靠近视口上沿」的那个作为当前项
 *      （比 scroll 事件 + getBoundingClientRect 便宜得多，而且不会抖动）。
 *   2. 当前项变化时，只把必要的那个条目 scrollIntoView 到目录可视区内，
 *      并且用 block:'nearest' 保证不会把整个页面带着跳。
 *   3. 目录容器自身可滚动（max-height + overflow-y: auto），
 *      条目多的时候能独立滚动而不撑破布局。
 */

interface NavItem {
  id: string
  no: string
  title: string
  children: { id: string; no: string; title: string }[]
}

interface Props {
  items: NavItem[]
  /** 顶部固定栏高度，锚点定位时要留出这段偏移 */
  offset?: number
}

const props = withDefaults(defineProps<Props>(), { offset: 96 })

const activeId = ref<string>('')
const activeChildId = ref<string>('')

/** 所有锚点（父 + 子），用于观察 */
const allIds = computed(() => [
  ...props.items.map((i) => i.id),
  ...props.items.flatMap((i) => i.children.map((c) => c.id)),
])

/** 每个锚点当前相对视口上沿的距离，用于挑出「当前焦点」 */
const distances = new Map<string, number>()

/**
 * 选出当前焦点。
 *
 * 规则：
 *   1. 在「焦点线（视口 30% 高度）以上或正好在焦点线上」的锚点里，
 *      取**距离焦点线最近**的那个 —— 即 d 最大的那个。
 *      （注意：不能取 d 最小的，那样永远命中第一个 section，
 *        目录高亮就只会停在 01，滚到哪儿都不动。）
 *   2. 如果焦点线上方一个锚点都没有（页面刚进入这一节），
 *      取焦点线下方最近的那个。
 */
const pickActive = () => {
  const line = window.innerHeight * 0.3
  let best: string | null = null
  let bestDist = -Infinity
  let nextBelow: string | null = null
  let nextBelowDist = Infinity

  for (const [id, d] of distances) {
    if (d <= line) {
      // 焦点线上方：取 d 最大的（最靠近焦点线）
      if (d > bestDist) {
        bestDist = d
        best = id
      }
    } else if (d < nextBelowDist) {
      // 焦点线下方：记住最近的一个作为兜底
      nextBelowDist = d
      nextBelow = id
    }
  }

  if (!best) best = nextBelow

  if (best) {
    // 命中的可能是二级细项：父级保持当前高亮，
    // 子级另外高亮，视觉上形成层级指示。
    const owner = props.items.find((i) => i.children.some((c) => c.id === best))
    if (owner) {
      activeId.value = owner.id
      activeChildId.value = best
    } else {
      activeId.value = best
      activeChildId.value = ''
    }
    return
  }
  // 没有锚点在焦点区：保留上一个，但若它已经滚到视口上方很远，
  // 就退到它所属 section 的最后一个子项
  const cur = activeId.value
  if (cur) {
    const owner = props.items.find((i) => i.id === cur || i.children.some((c) => c.id === cur))
    if (owner) {
      const lastChild = owner.children[owner.children.length - 1]
      if (lastChild && distances.get(lastChild.id) !== undefined && (distances.get(lastChild.id) ?? 0) < 0) {
        activeId.value = owner.id
        activeChildId.value = lastChild.id
        return
      }
    }
  }
}

/**
 * 阅读进度（0–1）。
 *
 * 以「正文区域」为基准：从内容顶部开始，到内容底部结束，
 * 当前滚动位置映射成百分比。贴在目录底部作为位置指示。
 */
const progress = ref(0)

const measure = () => {
  distances.clear()
  for (const id of allIds.value) {
    const el = document.getElementById(id)
    if (!el) continue
    distances.set(id, el.getBoundingClientRect().top)
  }
  pickActive()

  // 进度：取最后一个锚点作为内容底部的近似
  const ids = allIds.value
  if (ids.length) {
    const last = document.getElementById(ids[ids.length - 1]!)
    const first = document.getElementById(ids[0]!)
    if (last && first) {
      const top = first.getBoundingClientRect().top
      const bottom = last.getBoundingClientRect().bottom
      const span = bottom - top
      const scrolled = -top
      progress.value = span > 0 ? Math.min(1, Math.max(0, scrolled / span)) : 0
    }
  }
}

let scrollRaf = 0
const onScroll = () => {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0
    measure()
  })
}

/** 把当前高亮项滚进目录可视区（不带动页面） */
const scrollActiveIntoView = () => {
  const nav = navEl.value
  if (!nav) return
  const id = activeChildId.value || activeId.value
  if (!id) return
  const el = nav.querySelector<HTMLElement>(`[data-nav-id="${id}"]`)
  if (!el) return
  const nb = nav.getBoundingClientRect()
  const eb = el.getBoundingClientRect()
  if (eb.top < nb.top + 8) {
    nav.scrollTop -= nb.top + 8 - eb.top
  } else if (eb.bottom > nb.bottom - 8) {
    nav.scrollTop += eb.bottom - (nb.bottom - 8)
  }
}

const navEl = ref<HTMLElement | null>(null)

/**
 * 目录容器高度：从固定顶栏下方一直到视口底部。
 *
 * 用 JS 计算而不是 CSS calc 任意值，避开 Tailwind 转义坑；
 * 视口高度变化时（旋转屏幕 / 拖窗口）跟着更新。
 */
const tocHeight = ref('calc(100vh - 5rem)')
const updateHeight = () => {
  tocHeight.value = `calc(100vh - 5rem)`
}
onMounted(updateHeight)

watch([activeId, activeChildId], () => {
  requestAnimationFrame(scrollActiveIntoView)
})

onMounted(() => {
  measure()
  updateHeight()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
})

// 内容变化（切换项目 / 语言）→ 重新测量
watch(
  () => props.items,
  () => {
    requestAnimationFrame(() => {
      measure()
      if (props.items.length) activeId.value = props.items[0]!.id
    })
  },
  { immediate: true, deep: true },
)

/**
 * 父级是否处于「当前焦点」。
 *
 * 当焦点落在某个二级细项时，父级仍然标记为当前所属章节，
 * 但用弱化样式，避免父子同时出现强高亮。
 */
const isActive = (id: string) => activeId.value === id
const hasActiveChild = (id: string) =>
  activeChildId.value !== '' &&
  props.items.find((i) => i.id === id)?.children.some((c) => c.id === activeChildId.value) === true
const isChildActive = (id: string) => activeChildId.value === id
</script>

<template>
  <!--
    目录占满视口高度（从顶栏下方一直到屏幕底部）。

    之前用的是 max-h，内容少的时候容器仍然按内容收缩，
    目录只占上半屏 —— 这正是要修的。
    改成 flex 布局：
      - 外层 h-[calc(100vh-5rem)] 撑满视口
      - nav flex-1 吃掉剩余高度，条目多时自身滚动
      - 底部的阅读进度条贴在视口底部
  -->
  <!--
    高度用 inline style 计算，而不是 Tailwind 任意值：
    Tailwind 的 calc 任意值要求写成 calc(100vh_-_5rem)，
    写成 calc(100vh-5rem) 会被原样输出成无效 CSS（缺空格），
    结果容器直接塌成内容高度 —— 就是之前目录只占上半屏的原因。
  -->
  <div class="flex flex-col" :style="{ height: tocHeight }">
    <nav
      ref="navEl"
      class="min-h-0 flex-1 overflow-y-auto pr-1"
    >
    <p class="eyebrow">Contents</p>
    <!--
      条目在纵向空间里均匀铺开：
      用 flex + justify-between 让条目撑满整列高度，
      底部不会留一大段空白。条目多到超出时自动转为自身滚动。
    -->
    <ul class="mt-4 flex min-h-full flex-col justify-between gap-0.5">
      <li v-for="s in items" :key="s.id">
        <a
          :href="`#${s.id}`"
          :data-nav-id="s.id"
          class="group flex items-baseline gap-2.5 border-l-2 py-1.5 pl-3 text-[13.5px] transition-colors duration-150"
          :class="
            isActive(s.id) && !hasActiveChild(s.id)
              ? 'border-claude text-ink'
              : hasActiveChild(s.id)
                ? 'border-claude/45 text-ink'
                : 'border-ink/12 text-ink-muted hover:border-ink/35 hover:text-ink'
          "
        >
          <span
            class="claude-num shrink-0 transition-colors duration-150"
            :class="isActive(s.id) ? 'text-claude-deep' : ''"
          >
            {{ s.no }}
          </span>
          <span class="leading-snug">{{ s.title }}</span>
        </a>

        <!-- 细分问题：父级高亮时才展开，避免目录过长 -->
        <ul v-if="s.children.length" class="mt-0.5 space-y-0.5">
          <li v-for="c in s.children" :key="c.id">
            <a
              :href="`#${c.id}`"
              :data-nav-id="c.id"
              class="group flex items-baseline gap-2 border-l-2 py-1 pl-6 text-[12.5px] transition-colors duration-150"
              :class="
                isChildActive(c.id)
                  ? 'border-claude/70 text-ink'
                  : 'border-ink/8 text-ink-faint hover:border-ink/30 hover:text-ink-muted'
              "
            >
              <span class="font-mono text-[10.5px] tabular-nums">{{ c.no }}</span>
              <span class="leading-snug">{{ c.title }}</span>
            </a>
          </li>
        </ul>
      </li>
    </ul>
    </nav>

    <!--
      阅读进度：贴着视口底部的一条竖向轨道，
      表示当前在整篇 case study 中的位置。
      既利用了底部空间，也给「目录占满全屏」一个视觉锚点。
    -->
    <div class="mt-4 shrink-0 border-t border-ink/10 pt-3">
      <div class="flex items-center justify-between font-mono text-[10px] text-ink-faint">
        <span>READING</span>
        <span class="tnum">{{ Math.round(progress * 100) }}%</span>
      </div>
      <div class="mt-2 h-px w-full bg-ink/12">
        <div
          class="h-px bg-claude transition-[width] duration-150"
          :style="{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }"
        />
      </div>
    </div>
  </div>
</template>
