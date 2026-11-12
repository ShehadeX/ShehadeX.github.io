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
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import type { StackCategory } from '@/data/stack'

/**
 * 技术栈图谱画布（Canvas + d3-force，静态为主）。
 *
 * 设计原则（按需求定死）：
 *   1. 只有首次加载（以及尺寸/语言变化重建）时跑一次入场动画，
 *      物理模拟收敛后彻底停机，之后只剩轻微的呼吸浮动。
 *   2. 悬停任意节点时，以它为中心做放射状关联高亮：
 *      自己 + 直连邻居 + 相关边保持清晰，其余全部淡出。
 *   3. 渲染用 Canvas 2D，一次绘制无 DOM，指针移动只触发重画不触发布局。
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
  /** 呼吸浮动的相位与幅度 */
  ph: number
  amp: number
}

interface GLink extends SimulationLinkDatum<GNode> {
  source: string | GNode
  target: string | GNode
}

const nodes = shallowRef<GNode[]>([])
const links = shallowRef<GLink[]>([])

/** 确定性伪随机：首屏布局稳定，每次加载都一样 */
const seeded = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const buildData = () => {
  const ns: GNode[] = []
  const ls: GLink[] = []
  const cx = cssW.value / 2
  const cy = cssH.value / 2
  const base = Math.min(cssW.value, cssH.value)

  let k = 0
  props.cats.forEach((cat, ci) => {
    // 枢纽初始位置沿圆周排布，入场动画会向中心收拢
    const a = -Math.PI / 2 + (ci * Math.PI * 2) / props.cats.length
    ns.push({
      id: cat.id,
      name: cat.name,
      x: cx + base * 0.42 * Math.cos(a),
      y: cy + base * 0.42 * Math.sin(a),
      vx: 0,
      vy: 0,
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
      ph: ci * 1.1,
      amp: 1.2,
    })
    for (const it of cat.items) {
      k++
      const ra = seeded(k) * Math.PI * 2
      const rr = base * (0.1 + seeded(k + 999) * 0.3)
      ns.push({
        id: it.id,
        name: it.name,
        x: cx + rr * Math.cos(ra),
        y: cy + rr * Math.sin(ra),
        vx: 0,
        vy: 0,
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
        ph: k * 0.83,
        amp: 2.2,
      })
      ls.push({ source: cat.id, target: it.id })
    }
  })
  return { ns, ls }
}

/* ------------------------------------------------------------------ */
/*  画布                                                              */
/* ------------------------------------------------------------------ */

const wrapEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const cssW = ref(900)
const cssH = ref(620)

/** 窄屏：标签放不下，只显示分类名 */
const isNarrow = computed(() => cssW.value < 560)

let ctx: CanvasRenderingContext2D | null = null
let sim: Simulation<GNode, GLink> | null = null

/* ------------------------------------------------------------------ */
/*  物理引擎：只用于入场动画                                        */
/* ------------------------------------------------------------------ */

const buildSimulation = () => {
  sim?.stop()

  const { ns, ls } = buildData()
  nodes.value = ns
  links.value = ls

  const base = Math.min(cssW.value, cssH.value)

  sim = forceSimulation<GNode, GLink>(ns)
    .force(
      'charge',
      forceManyBody<GNode>()
        .strength(isNarrow.value ? -80 : -130)
        .distanceMax(base * (isNarrow.value ? 0.6 : 0.5)),
    )
    .force(
      'link',
      forceLink<GNode, GLink>(ls)
        .id((d) => d.id)
        .distance(isNarrow.value ? base * 0.18 : base * 0.115)
        .strength(0.6),
    )
    .force('center', forceCenter(cssW.value / 2, cssH.value / 2).strength(0.14))
    .force('x', forceX<GNode>(cssW.value / 2).strength(0.075))
    .force('y', forceY<GNode>(cssH.value / 2).strength(0.035))
    .force(
      'collide',
      forceCollide<GNode>((d) => d.r + 8).strength(1).iterations(2),
    )
    .alpha(1)
    .alphaDecay(0.03)
    .velocityDecay(0.4)
    .on('tick', () => {
      tickCount++
      if (tickCount % 3 === 0) layoutLabels()
      draw(0)
    })
    .on('end', () => {
      // 入场动画结束：最后排一次标签，之后只保留轻微呼吸浮动
      layoutLabels()
      draw(performance.now())
      startIdle()
    })
}

let tickCount = 0

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
      if (!chosen && false) chosen = null
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

const LABEL = 'rgba(98,95,89,0.95)'
const CLAUDE = '#d97757'
const CLAUDE_DEEP = '#b4553a'

let hoveredId: string | null = null
let egoSet: Set<string> | null = null
let activeSet: Set<string> | null = null

const nodeId = (v: string | GNode) => (typeof v === 'string' ? v : v.id)

/** 悬停节点的 1 跳邻居集合（含自己） */
function buildEgo(id: string) {
  const s = new Set<string>([id])
  for (const l of links.value) {
    const a = nodeId(l.source)
    const b = nodeId(l.target)
    if (a === id) s.add(b)
    else if (b === id) s.add(a)
  }
  return s
}

/**
 * 绘制一帧。
 *
 * @param time 毫秒时间戳；传 0 表示不加呼吸浮动（入场动画期间用）。
 */
function draw(time: number) {
  const c = canvasEl.value
  if (!c || !ctx) return

  const w = cssW.value
  const h = cssH.value

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#ece9e0'
  ctx.fillRect(0, 0, w, h)

  const ns = nodes.value
  const ls = links.value
  const narrow = isNarrow.value
  const T = time * 0.001

  // 呼吸浮动偏移（收敛后才有，幅度很小）
  const breath = (n: GNode): [number, number] => {
    if (!time) return [0, 0]
    return [
      Math.sin(T * 0.9 + n.ph) * n.amp,
      Math.cos(T * 0.7 + n.ph * 1.3) * n.amp,
    ]
  }

  const px = (n: GNode) => (n.x ?? 0) + breath(n)[0]
  const py = (n: GNode) => (n.y ?? 0) + breath(n)[1]

  const hovering = hoveredId !== null

  // ---- 边 ----
  ctx.lineWidth = 1
  for (const l of ls) {
    const a = l.source as GNode
    const b = l.target as GNode
    if (typeof a === 'string' || typeof b === 'string') continue
    const related =
      hovering && (egoSet!.has(a.id) && egoSet!.has(b.id))
    const dim =
      (hovering && !related) ||
      (activeSet &&
        (!activeSet.has(a.id) && !activeSet.has(b.id)))
    if (related) {
      ctx.strokeStyle = 'rgba(217,119,87,0.75)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(px(a), py(a))
      ctx.lineTo(px(b), py(b))
      ctx.stroke()
      ctx.lineWidth = 1
    } else {
      ctx.strokeStyle = 'rgba(32,31,29,0.13)'
      ctx.globalAlpha = dim ? 0.25 : 1
      ctx.beginPath()
      ctx.moveTo(px(a), py(a))
      ctx.lineTo(px(b), py(b))
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  // ---- 节点 ----
  for (const n of ns) {
    const x = px(n)
    const y = py(n)
    const inEgo = !hovering || egoSet!.has(n.id)
    const dim =
      !inEgo ||
      (activeSet ? (n.kind === 'hub' ? !n.projects.some((p) => activeSet!.has(p)) : !activeSet.has(n.id)) : false)
    const isHover = hoveredId === n.id
    const isNeighbor = hovering && !isHover && egoSet!.has(n.id)

    ctx.globalAlpha = dim ? 0.14 : 1

    if (isHover) {
      // 悬停节点：橙色光环
      ctx.beginPath()
      ctx.arc(x, y, n.r + 7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(217,119,87,0.18)'
      ctx.fill()
    }

    if (n.kind === 'hub') {
      ctx.beginPath()
      ctx.arc(x, y, n.r + 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(32,31,29,0.08)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = isHover ? CLAUDE : '#0f0f10'
      ctx.fill()
      // 邻居分类节点描橙边
      if (isNeighbor) {
        ctx.beginPath()
        ctx.arc(x, y, n.r + 1.5, 0, Math.PI * 2)
        ctx.strokeStyle = CLAUDE
        ctx.lineWidth = 1.6
        ctx.stroke()
      }
    } else {
      ctx.beginPath()
      ctx.arc(x, y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = activeSet?.has(n.id) ? CLAUDE : 'rgba(32,31,29,0.55)'
      if (isHover) ctx.fillStyle = CLAUDE
      ctx.fill()
      ctx.lineWidth = isHover || isNeighbor ? 1.8 : 1
      ctx.strokeStyle = isHover || isNeighbor ? CLAUDE : 'rgba(32,31,29,0.25)'
      ctx.stroke()
    }
  }

  // ---- 标签引导线 ----
  ctx.globalAlpha = 1
  ctx.strokeStyle = hovering ? 'rgba(217,119,87,0.35)' : 'rgba(32,31,29,0.14)'
  ctx.lineWidth = 0.75
  ctx.beginPath()
  for (const n of ns) {
    if (narrow && n.kind === 'item') continue
    if (hovering && !egoSet!.has(n.id)) continue
    const [bx, by] = breath(n)
    const nx = (n.x ?? 0) + bx
    const ny = (n.y ?? 0) + by
    if (Math.abs(n.lx + bx - nx) < 12 && Math.abs(n.ly + by - ny) < 6) continue
    ctx.moveTo(nx, ny)
    ctx.lineTo(n.lx + bx, n.ly + by - 3)
  }
  ctx.stroke()

  // ---- 标签 ----
  const font = narrow
    ? '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    : '9.5px ui-monospace, SFMono-Regular, Menlo, monospace'
  if (ctx.font !== font) ctx.font = font
  ctx.textBaseline = 'alphabetic'

  for (const n of ns) {
    if (narrow && n.kind === 'item') continue
    const inEgo = !hovering || egoSet!.has(n.id)
    if (!inEgo) continue
    const [bx, by] = breath(n)
    const hot = hoveredId === n.id
    const neighbor = hovering && !hot && egoSet!.has(n.id)
    ctx.textAlign = n.anchor === 'middle' ? 'center' : n.anchor
    ctx.fillStyle = hot || neighbor ? CLAUDE_DEEP : LABEL
    ctx.fillText(n.name, n.lx + bx, n.ly + by)
  }

  ctx.globalAlpha = 1
}

/* ------------------------------------------------------------------ */
/*  呼吸浮动循环（收敛后）：约 30fps 的轻量重绘                      */
/* ------------------------------------------------------------------ */

let idleRaf = 0
let idleRunning = false
let lastIdle = 0
let inView = true
let pageVisible = true

function idleTick(ts: number) {
  if (!idleRunning) return
  // 不可见时直接跳过绘制但保持循环（rAF 在切标签页时本来就会被节流）
  if (inView && pageVisible && ts - lastIdle > 33) {
    lastIdle = ts
    draw(ts)
  }
  idleRaf = requestAnimationFrame(idleTick)
}

function startIdle() {
  if (idleRunning) return
  idleRunning = true
  lastIdle = 0
  idleRaf = requestAnimationFrame(idleTick)
}

function stopIdle() {
  idleRunning = false
  cancelAnimationFrame(idleRaf)
}

/* ------------------------------------------------------------------ */
/*  指针交互：悬停即放射高亮，不再推动物理                          */
/* ------------------------------------------------------------------ */

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
  const x = evt.clientX - r.left
  const y = evt.clientY - r.top

  const hov = pickNode(x, y, 18)
  const hid = hov?.id ?? null
  if (hid !== hoveredId) {
    hoveredId = hid
    egoSet = hid ? buildEgo(hid) : null
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
    draw(performance.now())
  }
  if (c.style.cursor !== (hid ? 'pointer' : 'default')) {
    c.style.cursor = hid ? 'pointer' : 'default'
  }
}

const onPointerLeave = () => {
  if (hoveredId) {
    hoveredId = null
    egoSet = null
    emit('hover', null)
    draw(performance.now())
  }
}

/* ------------------------------------------------------------------ */
/*  尺寸                                                              */
/* ------------------------------------------------------------------ */

let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null

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

  /**
   * 设备像素比上限 1.5。
   * Retina 屏 devicePixelRatio = 2，827px 宽的画布会变成 1654 真实像素，
   * 每帧全量清屏 + 重绘的像素量是 1.5x 方案的 1.78 倍。
   * 图谱是线稿风格，1.5x 的清晰度足够，但省下的像素填充对低端机是实打实的流畅度。
   */
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  cssW.value = w
  cssH.value = targetH

  c.width = Math.round(w * ratio)
  c.height = Math.round(targetH * ratio)
  c.style.width = `${w}px`
  c.style.height = `${targetH}px`
  ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

  // 尺寸变了力参数也要跟着变，重跑一次入场动画
  buildSimulation()
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
        inView = entries[0]?.isIntersecting ?? true
      },
      { rootMargin: '150px' },
    )
    io.observe(wrapEl.value)
  }
  document.addEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
  pageVisible = document.visibilityState === 'visible'
}

onBeforeUnmount(() => {
  sim?.stop()
  stopIdle()
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
    draw(performance.now())
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
