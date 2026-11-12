<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { stackCategories, stackProjects, allStackItems, usageCount } from '@/data/stack'
import { stackCategoriesEn, stackProjectsEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'

/**
 * Obsidian 式技术栈图谱（纯力导向 + 实时吸附）。
 *
 * 布局完全由物理模拟产生，不写死任何坐标：
 *   - 初始位置由黄金角螺旋确定性生成（无随机数，首屏稳定）
 *   - 每帧计算：节点互斥 + 分类弹簧 + 向心力 + 指针磁吸
 *   - 标签水平排布，并做双侧（左 / 右）贪心避让，消除文字压叠
 *
 * 画布坐标系与 CSS 像素 1:1 对应（viewBox 跟随容器实测宽度），
 * 所以无论放在通栏还是窄栏，字号始终是真实的 9.5px，不会被缩得看不清。
 *
 * 节点语义：
 *   - 分类是枢纽节点（hub），技术项通过弹簧挂在对应分类下
 *   - 节点半径 = 该技术被多少个项目使用（用得越多越大）
 *   - 选中项目后，该项目用到的技术点染为橙色，其余淡出
 */

interface Props {
  /** 紧凑模式：窄栏使用，详情面板改为排在图谱下方 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { compact: false })

/* ------------------------------------------------------------------ */
/*  画布尺寸：跟随容器，1:1 映射 CSS 像素                             */
/* ------------------------------------------------------------------ */

const wrapEl = ref<HTMLDivElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)
const vw = ref(props.compact ? 680 : 1180)
const vh = ref(props.compact ? 780 : 720)

const CX = computed(() => vw.value / 2)
const CY = computed(() => vh.value / 2)

interface Node {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  kind: 'hub' | 'item'
  category: string
  categoryName: string
  note: string
  projects: string[]
  count: number
  /** 标签文本内容 */
  label: string
  /** 标签左上角 x */
  lx: number
  /** 标签基线 y */
  ly: number
  /** 标签锚点 */
  anchor: 'start' | 'end' | 'middle'
}

interface Edge {
  from: string
  to: string
}

const isEn = computed(() => lang.value === 'en')
const cats = computed(() => (isEn.value ? stackCategoriesEn : stackCategories))
const projects_ = computed(() => (isEn.value ? stackProjectsEn : stackProjects))

const selectedProject = ref<string | null>(null)
const hovered = ref<string | null>(null)

/** 指针位置（SVG 用户坐标 = CSS 像素），null 表示不在图上 */
const pointer = ref<{ x: number; y: number } | null>(null)
/** 被指针吸附的节点 id */
const snapped = ref<string | null>(null)

/* ------------------------------------------------------------------ */
/*  初始布局：黄金角螺旋（确定性）                                     */
/* ------------------------------------------------------------------ */

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

const buildLayout = () => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const cx = CX.value
  const cy = CY.value
  const base = Math.min(vw.value, vh.value)

  // 枢纽先占住中心附近，技术项沿螺旋铺开
  const hubCount = cats.value.length
  const hubR = base * 0.11
  cats.value.forEach((cat, ci) => {
    const a = -Math.PI / 2 + (ci * Math.PI * 2) / hubCount
    nodes.push({
      id: cat.id,
      name: cat.name,
      x: cx + hubR * Math.cos(a),
      y: cy + hubR * Math.sin(a),
      vx: 0,
      vy: 0,
      r: 9,
      kind: 'hub',
      category: cat.id,
      categoryName: cat.name,
      note: cat.caption,
      projects: [...new Set(cat.items.flatMap((i) => i.projects))],
      count: cat.items.length,
      label: cat.name,
      lx: 0,
      ly: 0,
      anchor: 'middle',
    })
  })

  let k = 0
  for (const cat of cats.value) {
    for (const it of cat.items) {
      const a = k * GOLDEN
      const rad = base * 0.2 + base * 0.055 * Math.sqrt(k)
      const count = usageCount(it.id)
      nodes.push({
        id: it.id,
        name: it.name,
        x: cx + rad * Math.cos(a),
        y: cy + rad * Math.sin(a),
        vx: 0,
        vy: 0,
        r: 3.6 + count * 1.15,
        kind: 'item',
        category: cat.id,
        categoryName: cat.name,
        note: it.note,
        projects: it.projects,
        count,
        label: it.name,
        lx: 0,
        ly: 0,
        anchor: 'start',
      })
      edges.push({ from: cat.id, to: it.id })
      k++
    }
  }

  return { nodes, edges }
}

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const resetLayout = () => {
  const l = buildLayout()
  nodes.value = l.nodes
  edges.value = l.edges
}

resetLayout()

/* ------------------------------------------------------------------ */
/*  物理参数（按画布尺寸自适应）                                       */
/* ------------------------------------------------------------------ */

const params = computed(() => {
  const base = Math.min(vw.value, vh.value)
  return {
    repulsion: base * base * 0.55,
    repulsionRange: base * 0.28,
    spring: 0.03,
    springLen: base * 0.2,
    centerPull: 0.0032,
    damping: 0.88,
    maxStep: base * 0.004,
    snapRange: 120,
    snapStrength: 0.16,
  }
})

let raf = 0
let running = false
let last = 0

function step(dt: number) {
  const ns = nodes.value
  const n = ns.length
  if (!n) return
  const P = params.value
  const cx = CX.value
  const cy = CY.value

  // ---- 斥力 ----
  for (let i = 0; i < n; i++) {
    const a = ns[i]!
    for (let j = i + 1; j < n; j++) {
      const b = ns[j]!
      let dx = b.x - a.x
      let dy = b.y - a.y
      let d2 = dx * dx + dy * dy
      if (d2 < 0.01) {
        dx = (i % 5) - 2
        dy = (j % 7) - 3
        d2 = dx * dx + dy * dy + 0.01
      }
      const d = Math.sqrt(d2)
      if (d > P.repulsionRange) continue
      const falloff = 1 - d / P.repulsionRange
      const force = ((P.repulsion * (1 + (a.r + b.r) * 2)) / d2) * falloff * falloff
      const fx = (dx / d) * force
      const fy = (dy / d) * force
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  // ---- 弹簧（分类 → 技术）----
  for (const e of edges.value) {
    const a = ns.find((x) => x.id === e.from)
    const b = ns.find((x) => x.id === e.to)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy) || 1
    const f = (d - P.springLen) * P.spring
    a.vx += (dx / d) * f
    a.vy += (dy / d) * f
    b.vx -= (dx / d) * f
    b.vy -= (dy / d) * f
  }

  // ---- 向心力 ----
  for (const node of ns) {
    node.vx += (cx - node.x) * P.centerPull
    node.vy += (cy - node.y) * P.centerPull
  }

  // ---- 指针磁吸 ----
  if (pointer.value) {
    const p = pointer.value
    let best: Node | null = null
    let bestDist = Infinity
    for (const node of ns) {
      const d = Math.hypot(node.x - p.x, node.y - p.y)
      if (d < P.snapRange && d < bestDist) {
        bestDist = d
        best = node
      }
    }
    snapped.value = best?.id ?? null
    if (best) {
      const dx = p.x - best.x
      const dy = p.y - best.y
      const d = Math.hypot(dx, dy) || 1
      // 停在指针外侧一点点，不覆盖指针本身
      const target = best.r + 22
      const pull = (d - target) * P.snapStrength
      best.vx += (dx / d) * pull
      best.vy += (dy / d) * pull
    }
  }

  // ---- 积分 ----
  for (const node of ns) {
    node.vx *= P.damping
    node.vy *= P.damping
    node.vx = Math.max(-P.maxStep, Math.min(P.maxStep, node.vx))
    node.vy = Math.max(-P.maxStep, Math.min(P.maxStep, node.vy))
    node.x += node.vx * dt
    node.y += node.vy * dt
    const m = node.r + 10
    node.x = Math.max(m, Math.min(vw.value - m, node.x))
    node.y = Math.max(m, Math.min(vh.value - m, node.y))
  }

  layoutLabels()
}

/* ------------------------------------------------------------------ */
/*  标签避让                                                          */
/* ------------------------------------------------------------------ */

/** 估算标签像素宽度：等宽字体，中日韩字符按全角算 */
const labelWidth = (name: string) => {
  let w = 0
  for (const ch of name) {
    w += /[\u4e00-\u9fff\uff00-\uffef]/.test(ch) ? 10.4 : 6.2
  }
  return w + 5
}

/**
 * 标签避让排布（确定性）。
 *
 * 每个标签有两个候选位置：节点右侧 / 节点左侧。
 * 依次尝试「右侧原位、左侧原位、右侧上移、左侧上移、右侧下移、左侧下移……」
 * 取第一个不与已放置标签相交的位置。
 *
 * 双侧策略是关键：只用单侧时，长标签会把整列挤成一条线；
 * 双侧交替后标签会自然分布在节点两侧，重叠几乎完全消失。
 */
function layoutLabels() {
  const ns = nodes.value
  const placed: { x1: number; x2: number; y: number }[] = []
  const H = 11

  const sorted = [...ns].sort((a, b) => a.y - b.y || a.x - b.x)

  for (const node of sorted) {
    const w = labelWidth(node.label)

    if (node.kind === 'hub') {
      // 枢纽标签在节点正上方居中
      const x1 = node.x - w / 2
      const x2 = node.x + w / 2
      const baseY = node.y - node.r - 5
      let y = baseY
      for (let attempt = 0; attempt < 16; attempt++) {
        const hit = placed.some(
          (p) => x1 < p.x2 + 3 && p.x1 - 3 < x2 && Math.abs(y - p.y) < H,
        )
        if (!hit) break
        const dir = attempt % 2 === 0 ? -1 : 1
        y = baseY + dir * (Math.floor(attempt / 2) + 1) * (H + 1)
      }
      placed.push({ x1, x2, y })
      node.lx = node.x
      node.ly = y
      node.anchor = 'middle'
      continue
    }

    const rightX = node.x + node.r + 4
    const leftX = node.x - node.r - 4
    const baseY = node.y + 3.4

    let chosen: { x1: number; x2: number; y: number; anchor: 'start' | 'end' } | null = null

    for (let attempt = 0; attempt < 20 && !chosen; attempt++) {
      const side = attempt % 2 === 0 ? 'right' : 'left'
      const step = Math.floor(attempt / 2)
      const dy = step === 0 ? 0 : (attempt % 4 === 0 ? -1 : 1) * step * (H + 1)
      const y = baseY + dy

      const x1 = side === 'right' ? rightX : leftX - w
      const x2 = x1 + w

      const hit = placed.some(
        (p) => x1 < p.x2 + 3 && p.x1 - 3 < x2 && Math.abs(y - p.y) < H,
      )
      if (!hit) {
        chosen = { x1, x2, y, anchor: side === 'right' ? 'start' : 'end' }
      }
    }

    if (!chosen) {
      chosen = { x1: rightX, x2: rightX + w, y: baseY, anchor: 'start' }
    }

    placed.push({ x1: chosen.x1, x2: chosen.x2, y: chosen.y })
    node.anchor = chosen.anchor
    node.ly = chosen.y
    node.lx = chosen.anchor === 'start' ? chosen.x1 : chosen.x2
  }
}

function tick(ts: number) {
  if (!running) return
  const dt = last ? Math.min(2, (ts - last) / 16.67) : 1
  last = ts
  step(dt)
  raf = requestAnimationFrame(tick)
}

function start() {
  if (running) return
  running = true
  last = 0
  raf = requestAnimationFrame(tick)
}

function stop() {
  running = false
  cancelAnimationFrame(raf)
}

onMounted(() => {
  measure()
  start()
  if (wrapEl.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => measure())
    ro.observe(wrapEl.value)
  }
})

onBeforeUnmount(() => {
  stop()
  ro?.disconnect()
})

let ro: ResizeObserver | null = null

/** 测量容器宽度，重建坐标系（1:1 映射 CSS 像素） */
function measure() {
  const el = wrapEl.value
  if (!el) return
  const w = Math.round(el.clientWidth)
  if (w < 10) return
  const targetH = props.compact
    ? Math.round(Math.max(520, Math.min(900, w * 1.12)))
    : Math.round(Math.max(520, Math.min(860, w * 0.62)))
  if (Math.abs(w - vw.value) < 8 && Math.abs(targetH - vh.value) < 8) return

  const sx = vw.value ? w / vw.value : 1
  const sy = vh.value ? targetH / vh.value : 1
  vw.value = w
  vh.value = targetH
  // 已有节点按比例迁移，避免重置时闪一下
  for (const n of nodes.value) {
    n.x *= sx
    n.y *= sy
  }
}

// 语言切换 → 数据源变化 → 重建
watch(cats, () => {
  resetLayout()
})

// 尺寸变化 → 重建
watch([vw, vh], () => {
  resetLayout()
})

/* ------------------------------------------------------------------ */
/*  交互                                                              */
/* ------------------------------------------------------------------ */

const toSvgPoint = (evt: MouseEvent) => {
  const el = svgEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  const scale = vw.value / r.width
  return {
    x: (evt.clientX - r.left) * scale,
    y: (evt.clientY - r.top) * scale,
  }
}

/**
 * 指针位置追踪。
 *
 * 同时监听 pointermove 与 mousemove：
 * 某些环境（嵌入式 webview、旧版 WebKit）只派发其中之一，
 * 监听两个可以保证吸附效果在任何环境下都能生效。
 */
const onPointerMove = (evt: MouseEvent) => {
  pointer.value = toSvgPoint(evt)
}

const onPointerLeave = () => {
  pointer.value = null
  snapped.value = null
}

/** 选中项目时该项目用到的技术集合 */
const activeItems = computed(() => {
  if (!selectedProject.value) return null
  return new Set(
    allStackItems
      .filter((i) => i.projects.includes(selectedProject.value as string))
      .map((i) => i.id),
  )
})

const isDim = (node: Node) => {
  if (!selectedProject.value) return false
  if (node.kind === 'hub') {
    return !node.projects.includes(selectedProject.value as string)
  }
  return !activeItems.value?.has(node.id)
}

const currentProject = computed(
  () => projects_.value.find((p) => p.slug === selectedProject.value) ?? null,
)

const detail = computed(() => {
  const id = hovered.value
  if (!id) return null
  return nodes.value.find((n) => n.id === id) ?? null
})

const itemProjects = computed(() => {
  if (!detail.value) return []
  return detail.value.projects
    .map((slug) => projects_.value.find((p) => p.slug === slug))
    .filter(Boolean)
})

const toggleProject = (slug: string) => {
  selectedProject.value = selectedProject.value === slug ? null : slug
}

const nodeById = (id: string) => nodes.value.find((n) => n.id === id)
</script>

<template>
  <div class="overflow-hidden rounded-[15px] border border-ink/12 bg-base">
    <!-- 头部：项目筛选 -->
    <div class="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-raised px-4 py-2.5">
      <span class="eyebrow mr-1">{{ t('stack.graph') }}</span>
      <button
        type="button"
        class="h-7 rounded-[3px] px-2.5 font-mono text-[11px] transition-colors duration-150"
        :class="
          selectedProject === null
            ? 'bg-overlay text-base'
            : 'border border-ink/15 text-ink-muted hover:bg-base hover:text-ink'
        "
        @click="selectedProject = null"
      >
        All
      </button>
      <button
        v-for="p in projects_"
        :key="p.slug"
        type="button"
        class="h-7 rounded-[3px] px-2.5 font-mono text-[11px] transition-colors duration-150"
        :class="
          selectedProject === p.slug
            ? 'bg-claude text-white'
            : 'border border-ink/15 text-ink-muted hover:bg-base hover:text-ink'
        "
        @click="toggleProject(p.slug)"
      >
        {{ p.name }}
      </button>
      <span class="ml-auto font-mono text-[10.5px] text-ink-faint">
        {{ allStackItems.length }} {{ isEn ? 'techs' : '项技术' }} ·
        {{ cats.length }} {{ isEn ? 'domains' : '个领域' }}
      </span>
    </div>

    <div
      class="grid gap-0"
      :class="compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]'"
    >
      <!-- 图谱 -->
      <div
        ref="wrapEl"
        class="relative border-b border-ink/10"
        :class="compact ? '' : 'lg:border-b-0 lg:border-r'"
      >
        <svg
          ref="svgEl"
          :viewBox="`0 0 ${vw} ${vh}`"
          :width="vw"
          :height="vh"
          class="block max-w-full touch-none select-none"
          role="img"
          aria-label="技术栈关系图谱"
          @pointermove="onPointerMove"
          @mousemove="onPointerMove"
          @pointerleave="onPointerLeave"
          @mouseleave="onPointerLeave"
        >
          <!-- 归属边 -->
          <line
            v-for="(e, i) in edges"
            :key="`e${i}`"
            :x1="nodeById(e.from)?.x"
            :y1="nodeById(e.from)?.y"
            :x2="nodeById(e.to)?.x"
            :y2="nodeById(e.to)?.y"
            stroke="rgba(32,31,29,0.13)"
            stroke-width="1"
          />

          <!-- 节点 -->
          <g
            v-for="n in nodes"
            :key="n.id"
            class="cursor-pointer"
            :opacity="isDim(n) ? 0.2 : 1"
            @mouseenter="hovered = n.id"
            @mouseleave="hovered = null"
          >
            <circle
              v-if="n.kind === 'hub'"
              :cx="n.x"
              :cy="n.y"
              :r="n.r"
              fill="#0f0f10"
            />
            <circle
              v-else
              :cx="n.x"
              :cy="n.y"
              :r="n.r"
              :fill="
                selectedProject && activeItems?.has(n.id) ? '#d97757' : 'rgba(32,31,29,0.55)'
              "
              :stroke="hovered === n.id || snapped === n.id ? '#d97757' : 'rgba(32,31,29,0.25)'"
              :stroke-width="hovered === n.id || snapped === n.id ? 1.8 : 1"
            />
            <!-- 命中区域放大，方便悬停 -->
            <circle :cx="n.x" :cy="n.y" :r="Math.max(n.r + 7, 13)" fill="transparent" />

            <!-- 标签 -->
            <text
              :x="n.lx"
              :y="n.ly"
              :text-anchor="n.anchor"
              font-size="9.5"
              font-family="ui-monospace, monospace"
              :fill="hovered === n.id || snapped === n.id ? '#b4553a' : 'rgba(98,95,89,0.95)'"
              stroke="#ECE9E0"
              stroke-width="2.8"
              paint-order="stroke"
              stroke-linejoin="round"
            >
              {{ n.label }}
            </text>
          </g>
        </svg>

        <p class="border-t border-ink/10 px-4 py-2 font-mono text-[10.5px] leading-relaxed text-ink-faint">
          {{ t('stack.hint') }}
        </p>
      </div>

      <!-- 详情面板 -->
      <div class="p-5 sm:p-6">
        <template v-if="detail">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">{{ detail.kind === 'hub' ? t('stack.domain') : t('stack.tech') }}</span>
            <h3 class="display text-[20px] leading-tight">{{ detail.name }}</h3>
          </div>
          <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ detail.categoryName }}</p>
          <p class="mt-3 text-[13.5px] leading-[1.8] text-ink-body">{{ detail.note }}</p>

          <div v-if="itemProjects.length" class="mt-5">
            <p class="eyebrow">{{ t('stack.usedin') }}</p>
            <ul class="mt-2.5 space-y-1.5">
              <li
                v-for="p in itemProjects"
                :key="p!.slug"
                class="flex items-baseline gap-2.5 text-[13px] text-ink-muted"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-claude" />
                <span class="text-ink">{{ p!.name }}</span>
                <span class="text-[12px] text-ink-faint">{{ p!.caption }}</span>
              </li>
            </ul>
          </div>

          <div v-if="detail.kind === 'hub'" class="mt-5 flex flex-wrap gap-1.5">
            <span
              v-for="it in cats.find((c) => c.id === detail!.id)?.items ?? []"
              :key="it.id"
              class="tag"
            >
              {{ it.name }}
            </span>
          </div>
        </template>

        <template v-else-if="selectedProject && currentProject">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">PROJECT</span>
            <h3 class="display text-[20px] leading-tight">{{ currentProject.name }}</h3>
          </div>
          <p class="mt-1 text-[13px] text-ink-muted">{{ currentProject.caption }}</p>
          <ul class="mt-4 space-y-1.5">
            <li
              v-for="it in allStackItems.filter((i) => i.projects.includes(currentProject!.slug))"
              :key="it.id"
              class="flex items-baseline gap-2.5 text-[13px] text-ink-muted"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-claude" />
              {{ it.name }}
            </li>
          </ul>
        </template>

        <template v-else>
          <p class="eyebrow">{{ t('stack.graph') }}</p>
          <p class="mt-3 text-[13.5px] leading-[1.85] text-ink-muted">
            {{
              isEn
                ? `${cats.length} domains, ${allStackItems.length} technologies. Use the project filter above to narrow the view, or hover any node to see how it is actually used.`
                : `${cats.length} 个领域、${allStackItems.length} 项技术。点上方项目筛选可以只看某个项目用到的部分；悬停任意节点查看它的实际用法。`
            }}
          </p>
          <div class="mt-4 space-y-2.5">
            <div v-for="c in cats" :key="c.id">
              <p class="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
                <span class="claude-num">{{ c.items.length }}</span>
                {{ c.name }}
              </p>
              <p class="mt-0.5 pl-6 text-[12px] text-ink-faint">{{ c.caption }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
