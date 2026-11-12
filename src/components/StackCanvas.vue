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
 * 技术栈图谱画布。
 *
 * 性能与交互约定（这一版彻底解决「快速消耗 GPU」的问题）：
 *
 *   1. **绝无常驻动画循环**。
 *      入场动画播完（d3-force 收敛）后，立刻 `cancelAnimationFrame`，
 *      此后画布**只在指针移动、悬停变化、尺寸变化时重绘**。
 *      页面完全静止时 GPU 占用为 0。
 *
 *   2. **微动来自指针吸引，不是后台循环**。
 *      指针附近的节点会被"吸"向光标一点点（几十像素内生效），
 *      这是在 `pointermove` 事件里一次性算完的，不是每帧的物理模拟。
 *      用户不移动鼠标 → 什么都不发生。
 *
 *   3. **放射关联**。
 *      悬停节点时，它与所属分类 / 关联项目之间画出发光线，
 *      其余节点淡出，形成放射高亮。
 */

interface Props {
  cats: StackCategory[]
  /** 选中项目时该项目用到的技术 id；null 表示未筛选 */
  activeIds: string[] | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'hover', payload: { id: string; name: string; kind: 'hub' | 'item'; category: string; note: string; projects: string[]; count: number } | null): void
  /** 点击节点：用于持久选中（与悬停区分开） */
  (e: 'select', payload: { id: string; name: string; kind: 'hub' | 'item'; category: string; note: string; projects: string[]; count: number } | null): void
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

/** 确定性伪随机：布局每次加载完全一致 */
const seeded = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
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
      })
      ls.push({ source: cat.id, target: it.id })
    }
  })
  return { ns, ls }
}

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
      // 入场期间每 3 帧排一次标签，避免抖动过密
      tickCount++
      if (tickCount % 3 === 0) layoutLabels()
      draw()
    })
    .on('end', () => {
      /**
       * 入场结束 —— 彻底停机。
       *
       * 这里不再启动任何常驻 rAF：之后画布只在
       * 「指针移动 / 悬停变化 / 尺寸变化」时重绘。
       */
      layoutLabels()
      draw()
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
 * 依次尝试「右侧、左侧、右侧上移、左侧上移……」取第一个不碰撞的位置。
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
/*  指针吸引                                                          */
/* ------------------------------------------------------------------ */

interface Offset {
  x: number
  y: number
}

/** 当前指针位置（画布坐标），null 表示不在画布上 */
let pointer: { x: number; y: number } | null = null

/** 吸引半径（px）与最大位移（px） */
const ATTRACT_R = 120
const ATTRACT_MAX = 26

/**
 * 指针对节点的吸引位移。
 *
 * 指针附近的节点被"吸"向光标，越近吸得越强，但位移上限 ATTRACT_MAX，
 * 保证布局不会被拉散。
 *
 * 这里是纯函数：给定指针位置直接算出每个节点的偏移，
 * 在 pointermove 里一次性算完并绘制一次 —— 没有后台循环。
 */
const offsets = new Map<string, Offset>()

function computeAttraction() {
  offsets.clear()
  if (!pointer) return
  const px = pointer.x
  const py = pointer.y
  for (const n of nodes.value) {
    const nx = n.x ?? 0
    const ny = n.y ?? 0
    const dx = px - nx
    const dy = py - ny
    const d = Math.hypot(dx, dy)
    if (d >= ATTRACT_R || d < 0.001) continue
    // 强度：距离越近越强（平方衰减，中心处最强）
    const t = 1 - d / ATTRACT_R
    const pull = t * t * ATTRACT_MAX
    offsets.set(n.id, { x: (dx / d) * pull, y: (dy / d) * pull })
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

function draw() {
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

  /** 节点当前绘制位置 = 静态位置 + 指针吸引偏移 */
  const px = (n: GNode) => (n.x ?? 0) + (offsets.get(n.id)?.x ?? 0)
  const py = (n: GNode) => (n.y ?? 0) + (offsets.get(n.id)?.y ?? 0)

  const hovering = hoveredId !== null

  // ---- 边 ----
  ctx.lineWidth = 1
  for (const l of ls) {
    const a = l.source as GNode
    const b = l.target as GNode
    if (typeof a === 'string' || typeof b === 'string') continue
    const related = hovering && egoSet!.has(a.id) && egoSet!.has(b.id)
    const dim =
      (hovering && !related) ||
      (activeSet && !activeSet.has(a.id) && !activeSet.has(b.id))
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
      (activeSet
        ? n.kind === 'hub'
          ? !n.projects.some((p) => activeSet!.has(p))
          : !activeSet.has(n.id)
        : false)
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
    const nx = px(n)
    const ny = py(n)
    const lx = n.lx + (offsets.get(n.id)?.x ?? 0)
    const ly = n.ly + (offsets.get(n.id)?.y ?? 0)
    if (Math.abs(lx - nx) < 12 && Math.abs(ly - ny) < 6) continue
    ctx.moveTo(nx, ny)
    ctx.lineTo(lx, ly - 3)
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
    if (hovering && !egoSet!.has(n.id)) continue
    const off = offsets.get(n.id)
    const hot = hoveredId === n.id
    const neighbor = hovering && !hot && egoSet!.has(n.id)
    ctx.textAlign = n.anchor === 'middle' ? 'center' : n.anchor
    ctx.fillStyle = hot || neighbor ? CLAUDE_DEEP : LABEL
    ctx.fillText(n.name, n.lx + (off?.x ?? 0), n.ly + (off?.y ?? 0))
  }

  ctx.globalAlpha = 1
}

/* ------------------------------------------------------------------ */
/*  指针交互                                                          */
/* ------------------------------------------------------------------ */

const pickNode = (x: number, y: number, range: number) => {
  let best: GNode | null = null
  let bestDist = Infinity
  for (const n of nodes.value) {
    const ox = offsets.get(n.id)?.x ?? 0
    const oy = offsets.get(n.id)?.y ?? 0
    const d = Math.hypot((n.x ?? 0) + ox - x, (n.y ?? 0) + oy - y)
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

  pointer = { x, y }

  const hov = pickNode(x, y, 18)
  const hid = hov?.id ?? null
  const hoverChanged = hid !== hoveredId

  if (hoverChanged) {
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
  }

  // 指针吸引：一次性算完 + 画一帧
  computeAttraction()
  draw()

  const want = hid ? 'pointer' : 'default'
  if (c.style.cursor !== want) c.style.cursor = want
}

const onClick = (evt: MouseEvent) => {
  const c = canvasEl.value
  if (!c) return
  const r = c.getBoundingClientRect()
  const x = evt.clientX - r.left
  const y = evt.clientY - r.top
  const hov = pickNode(x, y, 18)
  if (!hov) {
    emit('select', null)
    return
  }
  emit('select', {
    id: hov.id,
    name: hov.name,
    kind: hov.kind,
    category: hov.categoryName,
    note: hov.note,
    projects: hov.projects,
    count: hov.count,
  })
}

const onPointerLeave = () => {
  pointer = null
  offsets.clear()
  if (hoveredId) {
    hoveredId = null
    egoSet = null
    emit('hover', null)
  }
  draw()
}

/* ------------------------------------------------------------------ */
/*  尺寸                                                              */
/* ------------------------------------------------------------------ */

let ro: ResizeObserver | null = null

function measure() {
  const el = wrapEl.value
  const c = canvasEl.value
  if (!el || !c) return
  const w = Math.round(el.clientWidth)
  if (w < 10) return

  /**
   * 画布高度上限受视口高度约束。
   *
   * 右侧图谱在桌面端是 sticky 锁定的（页面滚动时它固定不动）。
   * 如果画布比视口还高，sticky 就会变成「图谱内部自己滚动」，
   * 那正是之前那种异步滑动。所以这里把高度压到视口内，
   * 保证锁定后整张图完整可见、无需内部滚动。
   */
  const vh = window.innerHeight
  const maxH = Math.max(420, vh - 190)
  const desired =
    w < 560
      ? Math.round(Math.max(520, Math.min(720, w * 1.5)))
      : Math.round(Math.max(560, Math.min(820, w * 0.92)))
  const targetH = Math.round(Math.min(desired, maxH))

  /**
   * 设备像素比上限 1.5。
   * Retina 屏 devicePixelRatio = 2，全量清屏 + 重绘的像素量会翻近 2 倍。
   * 线稿风格 1.5x 已足够，省下的填充量对流畅度是实打实的。
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
})

onBeforeUnmount(() => {
  // 停机：确保没有残留的模拟循环
  sim?.stop()
  ro?.disconnect()
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
      @click="onClick"
    />
  </div>
</template>
