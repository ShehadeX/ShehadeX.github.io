<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force'
import type { SimulationLinkDatum } from 'd3-force'
import type { StackCategory } from '@/data/stack'

/**
 * 技术栈图谱画布（Canvas + d3-force）。
 *
 * 为什么整体换掉原来的 SVG 实现：
 *   原方案每帧要更新 61 个 <text> + 122 个 <circle> 的属性，
 *   浏览器对 SVG 文本的排版与重绘代价极高，
 *   再叠加 Vue 响应式与力计算的 O(n²) 斥力，稍复杂的机器就会卡住。
 *
 * 新方案：
 *   - 物理引擎用 d3-force（业界标准，forceManyBody 用 Barnes-Hut 近似，O(n log n)）
 *   - 渲染用 Canvas 2D，一次 drawImage 级别的绘制，没有 DOM、没有文本节点
 *   - 指针吸附直接改 simulation 的节点位置，走 d3 的 tick 事件
 *
 * 标签排布仍然自己做避让，但结果只是「画到 canvas 上」，
 * 不涉及 DOM 布局，所以开销可以忽略。
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
/*  数据模型                                                          */
/* ------------------------------------------------------------------ */

interface GNode extends SimulationNodeDatum {
  id: string
  name: string
  r: number
  kind: 'hub' | 'item'
  category: string
  categoryName: string
  note: string
  projects: string[]
  count: number
  /** 标签绘制信息（避让后回填） */
  lx: number
  ly: number
  anchor: 'start' | 'end' | 'middle'
}

interface GLink extends SimulationLinkDatum<GNode> {
  source: string | GNode
  target: string | GNode
}

const nodes = shallowRef<GNode[]>([])
const links = shallowRef<GLink[]>([])

const buildData = () => {
  const ns: GNode[] = []
  const ls: GLink[] = []

  for (const cat of props.cats) {
    ns.push({
      id: cat.id,
      name: cat.name,
      x: 0,
      y: 0,
      r: 9,
      kind: 'hub',
      category: cat.id,
      categoryName: cat.name,
      note: cat.caption,
      projects: [...new Set(cat.items.flatMap((i) => i.projects))],
      count: cat.items.length,
      lx: 0,
      ly: 0,
      anchor: 'middle',
    })
    for (const it of cat.items) {
      ns.push({
        id: it.id,
        name: it.name,
        x: 0,
        y: 0,
        r: 3.4 + it.projects.length * 1.1,
        kind: 'item',
        category: cat.id,
        categoryName: cat.name,
        note: it.note,
        projects: it.projects,
        count: it.projects.length,
        lx: 0,
        ly: 0,
        anchor: 'start',
      })
      ls.push({ source: cat.id, target: it.id })
    }
  }
  return { ns, ls }
}

/* ------------------------------------------------------------------ */
/*  画布                                                              */
/* ------------------------------------------------------------------ */

const wrapEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const dpr = ref(1)
const cssW = ref(900)
const cssH = ref(620)

/** 窄屏：标签放不下，只显示分类名 */
const isNarrow = computed(() => cssW.value < 560)

let ctx: CanvasRenderingContext2D | null = null
let sim: Simulation<GNode, GLink> | null = null

/* ------------------------------------------------------------------ */
/*  物理引擎：d3-force                                               */
/* ------------------------------------------------------------------ */

const buildSimulation = () => {
  sim?.stop()

  const { ns, ls } = buildData()
  nodes.value = ns
  links.value = ls

  const base = Math.min(cssW.value, cssH.value)

  sim = forceSimulation<GNode, GLink>(ns)
    // 电荷斥力：Barnes-Hut 近似，d3 内部实现，复杂度 O(n log n)
    .force(
      'charge',
      forceManyBody<GNode>()
        .strength(isNarrow.value ? -80 : -130)
        .distanceMax(base * (isNarrow.value ? 0.6 : 0.5)),
    )
    // 分类 → 技术 的弹簧：拉近，保证技术项聚在各自分类周围
    .force(
      'link',
      forceLink<GNode, GLink>(ls)
        .id((d) => d.id)
        .distance(isNarrow.value ? base * 0.18 : base * 0.115)
        .strength(0.6),
    )
    // 向心力：整体收拢在画布内，X 略强于 Y，形成横向展开的观感
    .force('center', forceCenter(cssW.value / 2, cssH.value / 2).strength(0.14))
    .force('x', forceX<GNode>(cssW.value / 2).strength(0.075))
    .force('y', forceY<GNode>(cssH.value / 2).strength(0.035))
    // 节点防重叠
    .force(
      'collide',
      forceCollide<GNode>((d) => d.r + 8).strength(1).iterations(2),
    )
    .alpha(1)
    .alphaDecay(0.022)
    .velocityDecay(0.38)
    .on('tick', onTick)
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
 * 标签避让（确定性）。
 *
 * 每个标签有两个候选位置：节点右侧 / 节点左侧。
 * 依次尝试「右侧、左侧、右侧上移、左侧上移、右侧下移、左侧下移……」
 * 取第一个不与已放置标签相交的位置。
 */
function layoutLabels() {
  const ns = nodes.value
  const placed: { x1: number; x2: number; y: number }[] = []
  const H = 12

  const sorted = [...ns].sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))

  for (const node of sorted) {
    const w = labelWidth(node.name)

    if (node.kind === 'hub') {
      const x1 = (node.x ?? 0) - w / 2
      const x2 = (node.x ?? 0) + w / 2
      const baseY = (node.y ?? 0) - node.r - 7
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
      node.lx = node.x ?? 0
      node.ly = y
      node.anchor = 'middle'
      continue
    }

    const cx = node.x ?? 0
    const cy = node.y ?? 0
    const rightX = cx + node.r + 4
    const leftX = cx - node.r - 4
    const baseY = cy + 3.4

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
      if (!hit) chosen = { x1, x2, y, anchor: side === 'right' ? 'start' : 'end' }
    }

    if (!chosen) chosen = { x1: rightX, x2: rightX + w, y: baseY, anchor: 'start' }

    placed.push({ x1: chosen.x1, x2: chosen.x2, y: chosen.y })
    node.anchor = chosen.anchor
    node.ly = chosen.y
    node.lx = chosen.anchor === 'start' ? chosen.x1 : chosen.x2
  }
}

/* ------------------------------------------------------------------ */
/*  绘制                                                              */
/* ------------------------------------------------------------------ */

const BG = '#ece9e0'
const INK = 'rgba(32,31,29,0.55)'
const INK_STRONG = '#201f1d'
const LABEL = 'rgba(98,95,89,0.95)'
const CLAUDE = '#d97757'
const CLAUDE_DEEP = '#b4553a'

let hoveredId: string | null = null
let snappedId: string | null = null
let activeSet: Set<string> | null = null

function onTick() {
  layoutLabels()
  draw()
}

function draw() {
  const c = canvasEl.value
  if (!c || !ctx) return

  const w = cssW.value
  const h = cssH.value

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  const ns = nodes.value
  const ls = links.value
  const narrow = isNarrow.value

  // ---- 边 ----
  ctx.strokeStyle = 'rgba(32,31,29,0.13)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const l of ls) {
    const a = l.source as GNode
    const b = l.target as GNode
    if (typeof a === 'string' || typeof b === 'string') continue
    ctx.moveTo(a.x ?? 0, a.y ?? 0)
    ctx.lineTo(b.x ?? 0, b.y ?? 0)
  }
  ctx.stroke()

  // ---- 节点 ----
  for (const n of ns) {
    const x = n.x ?? 0
    const y = n.y ?? 0
    const dim = activeSet
      ? n.kind === 'hub'
        ? !n.projects.some((p) => activeSet!.has(p))
        : !activeSet.has(n.id)
      : false
    const hot = hoveredId === n.id || snappedId === n.id

    ctx.globalAlpha = dim ? 0.18 : 1

    if (n.kind === 'hub') {
      // 分类节点：实心 + 浅色外环，视觉上作为「簇中心」
      ctx.beginPath()
      ctx.arc(x, y, n.r + 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(32,31,29,0.08)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = INK_STRONG
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(x, y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = activeSet?.has(n.id) ? CLAUDE : INK
      ctx.fill()
      ctx.lineWidth = hot ? 1.8 : 1
      ctx.strokeStyle = hot ? CLAUDE : 'rgba(32,31,29,0.25)'
      ctx.stroke()
    }
  }

  // ---- 标签引导线 ----
  // 标签被避让推开后，节点和文字之间会有一段距离，
  // 画一条极淡的引导线，保证「这个标签属于这个点」的关系一眼可读。
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(32,31,29,0.14)'
  ctx.lineWidth = 0.75
  ctx.beginPath()
  for (const n of ns) {
    if (narrow && n.kind === 'item') continue
    const nx = n.x ?? 0
    const ny = n.y ?? 0
    // 标签锚点与节点中心的距离太近就不画，避免糊成一片
    if (Math.abs(n.lx - nx) < 12 && Math.abs(n.ly - ny) < 6) continue
    ctx.moveTo(nx, ny)
    ctx.lineTo(n.lx, n.ly - 3)
  }
  ctx.stroke()

  // ---- 标签 ----
  ctx.font = `${narrow ? 10 : 9.5}px ui-monospace, SFMono-Regular, Menlo, monospace`
  ctx.textBaseline = 'alphabetic'

  for (const n of ns) {
    // 窄屏只显示分类名
    if (narrow && n.kind === 'item') continue
    const hot = hoveredId === n.id || snappedId === n.id
    ctx.textAlign = n.anchor === 'middle' ? 'center' : n.anchor
    ctx.fillStyle = hot ? CLAUDE_DEEP : LABEL
    ctx.fillText(n.name, n.lx, n.ly)
  }

  ctx.globalAlpha = 1
}

/* ------------------------------------------------------------------ */
/*  指针交互                                                          */
/* ------------------------------------------------------------------ */

const pointer = { x: 0, y: 0, inside: false }

/** 找到离指针最近的节点 */
const pickNode = (x: number, y: number, range: number) => {
  let best: GNode | null = null
  let bestDist = Infinity
  for (const n of nodes.value) {
    const d = Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y)
    if (d < range && d < bestDist) {
      bestDist = d
      best = n
    }
  }
  return best
}

const onPointerMove = (evt: PointerEvent | MouseEvent) => {
  const c = canvasEl.value
  if (!c) return
  const r = c.getBoundingClientRect()
  pointer.x = evt.clientX - r.left
  pointer.y = evt.clientY - r.top
  pointer.inside = true

  // 磁吸：把最近的节点拉向指针，但保持一点点距离，不覆盖指针
  const target = pickNode(pointer.x, pointer.y, 130)
  snappedId = target?.id ?? null
  if (target && sim) {
    const dx = pointer.x - (target.x ?? 0)
    const dy = pointer.y - (target.y ?? 0)
    const d = Math.hypot(dx, dy) || 1
    const desired = target.r + 24
    const pull = (d - desired) * 0.12
    target.vx = (target.vx ?? 0) + (dx / d) * pull * 6
    target.vy = (target.vy ?? 0) + (dy / d) * pull * 6
    sim.alpha(Math.max(sim.alpha(), 0.12)).restart()
  }

  // 悬停
  const hov = pickNode(pointer.x, pointer.y, 18)
  const hid = hov?.id ?? null
  if (hid !== hoveredId) {
    hoveredId = hid
    if (hov) {
      emit('hover', {
        id: hov.id,
        name: hov.name,
        kind: hov.kind,
        category: hov.categoryName,
        note: hov.note,
        projects: hov.projects,
        count: hov.count,
      })
    } else {
      emit('hover', null)
    }
  }
  draw()
}

const onPointerLeave = () => {
  pointer.inside = false
  snappedId = null
  if (hoveredId) {
    hoveredId = null
    emit('hover', null)
  }
  draw()
}

/* ------------------------------------------------------------------ */
/*  尺寸                                                              */
/* ------------------------------------------------------------------ */

let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let visible = true
let pageVisible = true

function measure() {
  const el = wrapEl.value
  const c = canvasEl.value
  if (!el || !c) return
  const w = Math.round(el.clientWidth)
  if (w < 10) return

  const targetH =
    w < 560
      ? Math.round(Math.max(520, Math.min(720, w * 1.5)))
      : Math.round(Math.max(560, Math.min(820, w * 0.92)))

  const ratio = window.devicePixelRatio || 1
  dpr.value = ratio
  cssW.value = w
  cssH.value = targetH

  c.width = Math.round(w * ratio)
  c.height = Math.round(targetH * ratio)
  c.style.width = `${w}px`
  c.style.height = `${targetH}px`
  ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

  // 重建模拟（尺寸变了，力参数也要跟着变）
  buildSimulation()
  draw()
}

/* ------------------------------------------------------------------ */
/*  生命周期                                                          */
/* ------------------------------------------------------------------ */

onMounted(() => {
  measure()
  if (wrapEl.value && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => measure())
    ro.observe(wrapEl.value)
  }
  if (wrapEl.value && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        syncSim()
      },
      { rootMargin: '150px' },
    )
    io.observe(wrapEl.value)
  }
  document.addEventListener('visibilitychange', onVisibility)
})

function syncSim() {
  if (!sim) return
  if (visible && pageVisible) sim.alpha(0.35).restart()
  else sim.stop()
}

function onVisibility() {
  pageVisible = document.visibilityState === 'visible'
  syncSim()
}

onBeforeUnmount(() => {
  sim?.stop()
  ro?.disconnect()
  io?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
})

// 数据源变化 → 重建
watch(
  () => props.cats,
  () => buildSimulation(),
)

// 选中项目 → 更新高亮集合
watch(
  () => props.activeIds,
  (v) => {
    activeSet = v ? new Set(v) : null
    draw()
  },
  { immediate: true },
)
</script>

<template>
  <div ref="wrapEl" class="relative w-full overflow-hidden">
    <canvas
      ref="canvasEl"
      class="block w-full touch-none select-none"
      role="img"
      aria-label="技术栈关系图谱"
      @pointermove="onPointerMove"
      @mousemove="onPointerMove"
      @pointerleave="onPointerLeave"
      @mouseleave="onPointerLeave"
    />
  </div>
</template>
