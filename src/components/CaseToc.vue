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

const measure = () => {
  distances.clear()
  for (const id of allIds.value) {
    const el = document.getElementById(id)
    if (!el) continue
    distances.set(id, el.getBoundingClientRect().top)
  }
  pickActive()
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

watch([activeId, activeChildId], () => {
  requestAnimationFrame(scrollActiveIntoView)
})

onMounted(() => {
  measure()
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
    目录高度占满可用视口（calc(100vh - 5rem) 减去顶部偏移），
    而不是只占上半屏。条目多时目录自身滚动，
    当前项会被自动滚进视野。
  -->
  <nav
    ref="navEl"
    class="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1"
  >
    <p class="eyebrow">Contents</p>
    <ul class="mt-4 space-y-1">
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
</template>
