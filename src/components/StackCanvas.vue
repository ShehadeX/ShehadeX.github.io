<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { StackCategory } from '@/data/stack'

/**
 * 技术栈图谱画布（独立组件）。
 *
 * 为什么单独拆一个组件：
 *   指针位置、悬停节点这些高频变化的数据，如果放在父组件里，
 *   每次鼠标移动都会触发父组件整个模板重渲染（包含 61 个 SVG 节点组），
 *   主线程直接被压死。这里把高频状态全部关在画布内部，
 *   并用**命令式 DOM 更新**代替 Vue 的 diff，
 *   帧率才稳得住。
 *
 * 渲染策略：
 *   - Vue 只负责**首次结构渲染**（节点、边、标签）
 *   - 之后的每帧动画用 setAttribute 直接改坐标，零 diff
 *
 * 缩放策略：
 *   viewBox 与 CSS 像素 1:1（vw/vh 即容器实测尺寸），
 *   svg 用 width:100% + aspect-ratio 填充容器，
 *   因此实际渲染比例恒为 1:1，文字永远不会被缩放变形。
 */

interface Props {
  cats: StackCategory[]
  /** 选中项目时该项目用到的技术 id；null 表示未筛选 */
  activeIds: string[] | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'hover', payload: { id: string; name: string; kind: 'hub' | 'item'; category: string; note: string; projects: string[]; count: number } | null): void
}>()

/* ------------------------------------------------------------------ */
/*  节点模型                                                          */
/* ------------------------------------------------------------------ */

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
  /** 标签文本 */
  label: string
  /** 标签锚点 */
  anchor: 'start' | 'end' | 'middle'
  /** 标签基线 y */
  ly: number
  /** 标签锚点 x */
  lx: number
}

interface Edge {
  from: string
  to: string
}

/* ------------------------------------------------------------------ */
/*  尺寸：跟随容器，1:1 映射 CSS 像素                                  */
/* ------------------------------------------------------------------ */

const wrapEl = ref<HTMLDivElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const vw = ref(900)
const vh = ref(620)

const CX = () => vw.value / 2
const CY = () => vh.value / 2

/** 窄屏：标签无法全部放下，降级为只显示分类名 */
const isNarrow = computed(() => vw.value < 560)

/* ------------------------------------------------------------------ */
/*  初始布局：黄金角螺旋（确定性，首屏稳定）                           */
/* ------------------------------------------------------------------ */

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

const buildLayout = (): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const cx = CX()
  const cy = CY()
  const base = Math.min(vw.value, vh.value)

  const hubCount = props.cats.length
  const hubR = base * 0.12
  props.cats.forEach((cat, ci) => {
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
      anchor: 'middle',
      lx: 0,
      ly: 0,
    })
  })

  let k = 0
  for (const cat of props.cats) {
    for (const it of cat.items) {
      const a = k * GOLDEN
      const rad = base * 0.22 + base * 0.055 * Math.sqrt(k)
      const count = it.projects.length
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
        anchor: 'start',
        lx: 0,
        ly: 0,
      })
      edges.push({ from: cat.id, to: it.id })
      k++
    }
  }

  return { nodes, edges }
}

/**
 * 节点集合用 shallowRef：
 * 物理模拟直接改写对象属性，若用深响应式 ref，每次改坐标都会触发
 * 依赖更新，整棵 SVG 会被反复 patch。shallowRef 只在结构变化时通知。
 */
const nodes = shallowRef<Node[]>([])
const edges = shallowRef<Edge[]>([])

const resetLayout = () => {
  const l = buildLayout()
  nodes.value = l.nodes
  edges.value = l.edges
  // 重新渲染结构后需要重新收集 DOM 引用
  requestAnimationFrame(() => collectEls())
}

resetLayout()

/* ------------------------------------------------------------------ */
/*  命令式 DOM 引用                                                   */
/* ------------------------------------------------------------------ */

interface NodeEls {
  dot: SVGCircleElement
  hit: SVGCircleElement
  text: SVGTextElement
}
const nodeEls = new Map<string, NodeEls>()
let edgeEls: SVGLineElement[] = []

function collectEls() {
  nodeEls.clear()
  edgeEls = []
  const svg = svgEl.value
  if (!svg) return
  const groups = svg.querySelectorAll<SVGGElement>('g[data-node]')
  groups.forEach((g) => {
    const id = g.dataset.node!
    const dot = g.querySelector<SVGCircleElement>('circle.dot')
    const hit = g.querySelector<SVGCircleElement>('circle.hit')
    const text = g.querySelector<SVGTextElement>('text.lbl')
    if (dot && hit && text) nodeEls.set(id, { dot, hit, text })
  })
  edgeEls = Array.from(svg.querySelectorAll<SVGLineElement>('g[data-edges] line'))
}

/* ------------------------------------------------------------------ */
/*  物理参数                                                          */
/* ------------------------------------------------------------------ */

const params = () => {
  const base = Math.min(vw.value, vh.value)
  if (isNarrow.value) {
    return {
      repulsion: base * base * 1.05,
      repulsionRange: base * 0.42,
      spring: 0.022,
      springLen: base * 0.3,
      centerPull: 0.0024,
      damping: 0.9,
      maxStep: base * 0.006,
      snapRange: 100,
      snapStrength: 0.16,
    }
  }
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
}

/* 高频状态用普通变量，不进响应式系统 */
let pointer: { x: number; y: number } | null = null
let snappedId: string | null = null
let hoverId: string | null = null

let raf = 0
let running = false
let last = 0
/** 标签避让的重算节流计数器 */
let frameNo = 0

function step(dt: number) {
  const ns = nodes.value
  const n = ns.length
  if (!n) return
  const P = params()
  const cx = CX()
  const cy = CY()

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
  if (pointer) {
    const p = pointer
    let best: Node | null = null
    let bestDist = Infinity
    for (const node of ns) {
      const d = Math.hypot(node.x - p.x, node.y - p.y)
      if (d < P.snapRange && d < bestDist) {
        bestDist = d
        best = node
      }
    }
    snappedId = best?.id ?? null
    if (best) {
      const dx = p.x - best.x
      const dy = p.y - best.y
      const d = Math.hypot(dx, dy) || 1
      const target = best.r + 22
      const pull = (d - target) * P.snapStrength
      best.vx += (dx / d) * pull
      best.vy += (dy / d) * pull
    }
  } else {
    snappedId = null
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
 * 依次尝试「右侧、左侧、右侧上移、左侧上移、右侧下移、左侧下移……」
 * 取第一个不与已放置标签相交的位置。
 *
 * 双侧策略是关键：只用单侧时，长标签会把整列挤成一条线；
 * 双侧交替后标签自然分布在节点两侧，重叠几乎完全消失。
 */
function layoutLabels() {
  const ns = nodes.value
  const placed: { x1: number; x2: number; y: number }[] = []
  const H = 12

  const sorted = [...ns].sort((a, b) => a.y - b.y || a.x - b.x)

  for (const node of sorted) {
    const w = labelWidth(node.label)

    if (node.kind === 'hub') {
      // 枢纽标签在节点正上方居中
      const x1 = node.x - w / 2
      const x2 = node.x + w / 2
      const baseY = node.y - node.r - 6
      let y = baseY
      for (let attempt = 0; attempt < 16; attempt++) {
        const hit = placed.some(
          (p) => x1 < p.x2 + 4 && p.x1 - 4 < x2 && Math.abs(y - p.y) < H,
        )
        if (!hit) break
        const dir = attempt % 2 === 0 ? -1 : 1
        y = baseY + dir * (Math.floor(attempt / 2) + 1) * (H + 2)
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
      const lvl = Math.floor(attempt / 2)
      const dy = lvl === 0 ? 0 : (attempt % 4 === 0 ? -1 : 1) * lvl * (H + 2)
      const y = baseY + dy

      const x1 = side === 'right' ? rightX : leftX - w
      const x2 = x1 + w

      const hit = placed.some(
        (p) => x1 < p.x2 + 4 && p.x1 - 4 < x2 && Math.abs(y - p.y) < H,
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

/* ------------------------------------------------------------------ */
/*  命令式渲染：每帧只改属性，不走 Vue diff                           */
/* ------------------------------------------------------------------ */

const activeSet = computed(() => (props.activeIds ? new Set(props.activeIds) : null))

function paint() {
  const ns = nodes.value
  const act = activeSet.value
  const narrow = isNarrow.value

  for (const node of ns) {
    const el = nodeEls.get(node.id)
    if (!el) continue

    el.dot.setAttribute('cx', node.x.toFixed(2))
    el.dot.setAttribute('cy', node.y.toFixed(2))
    el.hit.setAttribute('cx', node.x.toFixed(2))
    el.hit.setAttribute('cy', node.y.toFixed(2))

    const hot = hoverId === node.id || snappedId === node.id
    if (node.kind === 'item') {
      el.dot.setAttribute('fill', act?.has(node.id) ? '#d97757' : 'rgba(32,31,29,0.55)')
      el.dot.setAttribute('stroke', hot ? '#d97757' : 'rgba(32,31,29,0.25)')
      el.dot.setAttribute('stroke-width', hot ? '1.8' : '1')
    }

    // 窄屏：技术项不画标签
    const showText = !narrow || node.kind === 'hub'
    if (showText) {
      el.text.setAttribute('x', node.lx.toFixed(2))
      el.text.setAttribute('y', node.ly.toFixed(2))
      el.text.setAttribute('text-anchor', node.anchor)
      el.text.setAttribute('fill', hot ? '#b4553a' : 'rgba(98,95,89,0.95)')
      el.text.style.display = ''
    } else {
      el.text.style.display = 'none'
    }

    // 选中项目时未使用的节点淡出
    const dim = act
      ? node.kind === 'hub'
        ? !node.projects.some((p) => act.has(node.id) || act.has(p))
        : !act.has(node.id)
      : false
    const g = el.dot.parentElement as SVGGElement | null
    if (g) g.setAttribute('opacity', dim ? '0.18' : '1')
  }

  // 边
  const es = edges.value
  for (let i = 0; i < edgeEls.length; i++) {
    const line = edgeEls[i]
    const e = es[i]
    if (!line || !e) continue
    const a = ns.find((x) => x.id === e.from)
    const b = ns.find((x) => x.id === e.to)
    if (!a || !b) continue
    line.setAttribute('x1', a.x.toFixed(2))
    line.setAttribute('y1', a.y.toFixed(2))
    line.setAttribute('x2', b.x.toFixed(2))
    line.setAttribute('y2', b.y.toFixed(2))
  }
}

/* ------------------------------------------------------------------ */
/*  主循环                                                            */
/* ------------------------------------------------------------------ */

function tick(ts: number) {
  if (!running) return
  const dt = last ? Math.min(2, (ts - last) / 16.67) : 1
  last = ts
  step(dt)

  // 标签避让每 4 帧重算一次即可（标签位置变化很慢）
  frameNo++
  if (frameNo % 4 === 0) layoutLabels()

  paint()

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

/* ------------------------------------------------------------------ */
/*  尺寸测量                                                          */
/* ------------------------------------------------------------------ */

let ro: ResizeObserver | null = null

function measure() {
  const el = wrapEl.value
  if (!el) return
  const w = Math.round(el.clientWidth)
  if (w < 10) return

  const targetH =
    w < 560
      ? Math.round(Math.max(560, Math.min(760, w * 1.6)))
      : Math.round(Math.max(520, Math.min(900, w * 1.02)))

  if (Math.abs(w - vw.value) < 8 && Math.abs(targetH - vh.value) < 8) return

  const sx = vw.value ? w / vw.value : 1
  const sy = vh.value ? targetH / vh.value : 1
  vw.value = w
  vh.value = targetH
  // 已有节点按比例迁移，避免整图重排
  for (const n of nodes.value) {
    n.x *= sx
    n.y *= sy
  }
}

onMounted(() => {
  measure()
  collectEls()
  layoutLabels()
  start()
  if (wrapEl.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      measure()
      layoutLabels()
    })
    ro.observe(wrapEl.value)
  }
})

onBeforeUnmount(() => {
  stop()
  ro?.disconnect()
})

// 数据源变化 → 重建
watch(
  () => props.cats,
  () => {
    resetLayout()
  },
)

/* ------------------------------------------------------------------ */
/*  交互                                                              */
/* ------------------------------------------------------------------ */

const toSvgPoint = (evt: MouseEvent) => {
  const el = svgEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (!r.width) return null
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
  pointer = toSvgPoint(evt)
}

const onPointerLeave = () => {
  pointer = null
  snappedId = null
}

const onNodeEnter = (id: string) => {
  hoverId = id
  const node = nodes.value.find((n) => n.id === id)
  if (node) {
    emit('hover', {
      id: node.id,
      name: node.name,
      kind: node.kind,
      category: node.categoryName,
      note: node.note,
      projects: node.projects,
      count: node.count,
    })
  }
}

const onNodeLeave = () => {
  hoverId = null
  emit('hover', null)
}
</script>

<template>
  <div ref="wrapEl" class="relative w-full overflow-hidden">
    <svg
      ref="svgEl"
      :viewBox="`0 0 ${vw} ${vh}`"
      width="100%"
      :style="{ aspectRatio: `${vw} / ${vh}` }"
      class="block w-full touch-none select-none"
      role="img"
      aria-label="技术栈关系图谱"
      @pointermove="onPointerMove"
      @mousemove="onPointerMove"
      @pointerleave="onPointerLeave"
      @mouseleave="onPointerLeave"
    >
      <!-- 归属边 -->
      <g data-edges>
        <line
          v-for="i in edges.length"
          :key="i"
          stroke="rgba(32,31,29,0.13)"
          stroke-width="1"
        />
      </g>

      <!-- 节点 -->
      <g
        v-for="n in nodes"
        :key="n.id"
        :data-node="n.id"
        class="cursor-pointer"
        @mouseenter="onNodeEnter(n.id)"
        @mouseleave="onNodeLeave"
      >
        <circle
          v-if="n.kind === 'hub'"
          class="dot"
          :r="n.r"
          fill="#0f0f10"
          :cx="n.x"
          :cy="n.y"
        />
        <circle
          v-else
          class="dot"
          :r="n.r"
          fill="rgba(32,31,29,0.55)"
          stroke="rgba(32,31,29,0.25)"
          stroke-width="1"
          :cx="n.x"
          :cy="n.y"
        />
        <!-- 命中区域放大，方便悬停 -->
        <circle
          class="hit"
          :r="Math.max(n.r + 7, 13)"
          fill="transparent"
          :cx="n.x"
          :cy="n.y"
        />
        <!-- 标签 -->
        <text
          class="lbl"
          :x="n.lx"
          :y="n.ly"
          text-anchor="middle"
          font-size="9.5"
          font-family="ui-monospace, monospace"
          fill="rgba(98,95,89,0.95)"
          stroke="#ECE9E0"
          stroke-width="2.8"
          paint-order="stroke"
          stroke-linejoin="round"
        >
          {{ n.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
