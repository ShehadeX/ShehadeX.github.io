<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { StackCategory } from '@/data/stack'

/**
 * 技术栈图谱画布（完全静态）。
 *
 * 性能与交互约定：
 *
 *   1. **没有物理引擎，也没有常驻动画循环**。
 *      布局是**确定性静态计算**出来的 —— 同样的数据永远得到
 *      同样的坐标。页面静止时 CPU 占用为 0，不会有任何后台计算。
 *
 *   2. **只在第一次加载时有一次入场动画**。
 *      节点从中心向外展开到最终位置（约 1 秒），
 *      动画结束后立刻 `cancelAnimationFrame`，彻底停机。
 *
 *   3. **重绘只发生在状态变化时**：
 *      悬停节点变了 / 选中变了 / 尺寸变了。
 *      指针在画布上移动但没碰到节点时，**不重绘**。
 *
 *   4. **放射关联**。
 *      悬停节点时，从它向枢纽、同类技术与共享项目的技术
 *      画出放射状高亮连线，其余元素淡出。
 */

interface Props {
  cats: StackCategory[]
  /** 选中项目时该项目用到的技术 id；null 表示未筛选 */
  activeIds: string[] | null
  /**
   * 填满父容器高度。
   *
   * 右侧图谱在首页是与左栏视觉对齐的（底部同一高度），
   * 所以画布不能自己按视口算高度 —— 要跟着卡片容器一起拉伸。
   */
  fill?: boolean
  /**
   * 持久选中的节点 id。
   *
   * 来自左栏「领域概要」的点击 —— 点了左边的分类，
   * 右边图谱上对应的枢纽节点也要同步高亮并展开放射关联。
   */
  selectedId?: string | null
}

const props = defineProps<Props>()

interface NodePayload {
  id: string
  name: string
  kind: 'hub' | 'item'
  category: string
  categoryName: string
  note: string
  projects: string[]
  count: number
}

const emit = defineEmits<{
  (e: 'hover', payload: NodePayload | null): void
  /** 点击节点：用于持久选中（与悬停区分开） */
  (e: 'select', payload: NodePayload | null): void
}>()

/* ------------------------------------------------------------------ */
/*  数据模型                                                          */
/* ------------------------------------------------------------------ */

interface GNode {
  id: string
  name: string
  r: number
  kind: 'hub' | 'item'
  category: string
  categoryName: string
  note: string
  projects: string[]
  count: number
  /** 最终静态坐标 */
  x: number
  y: number
  /** 入场动画的锚点（起点为画布中心） */
  ax: number
  ay: number
  /** 标签绘制信息（避让后回填） */
  lx: number
  ly: number
  anchor: 'start' | 'end' | 'middle'
}

interface GLink {
  source: string
  target: string
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

/* ------------------------------------------------------------------ */
/*  静态布局                                                          */
/* ------------------------------------------------------------------ */

/**
 * 静态布局：枢纽沿圆周排布，技术项按扇区分布在各自枢纽周围。
 *
 * 完全确定性 —— 不含任何随机数种子以外的自由度，
 * 同样的输入永远得到同样的输出。刷新页面图谱不会跳动。
 */
function buildLayout() {
  const w = cssW.value
  const h = cssH.value
  const cx = w / 2
  const cy = h / 2
  const base = Math.min(w, h)

  const ns: GNode[] = []
  const ls: GLink[] = []

  const nCat = Math.max(1, props.cats.length)
  /** 枢纽所在圆环的半径 */
  const hubRing = base * 0.33
  /** 每个扇区张开的角度 */
  const wedge = (Math.PI / nCat) * 0.94

  let k = 0
  props.cats.forEach((cat, ci) => {
    const a = -Math.PI / 2 + (ci * Math.PI * 2) / nCat
    const hx = cx + hubRing * Math.cos(a)
    const hy = cy + hubRing * Math.sin(a)

    ns.push({
      id: cat.id,
      name: cat.name,
      x: hx,
      y: hy,
      ax: cx,
      ay: cy,
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

    const items = cat.items
    items.forEach((it, j) => {
      k++
      // 在扇区内均匀铺开，再叠一点确定性抖动避免死板
      const frac = items.length > 1 ? (j + 0.5) / items.length : 0.5
      const ang = a - wedge + frac * wedge * 2 + (seeded(k) - 0.5) * 0.16
      const rad = base * (0.11 + seeded(k + 999) * 0.26)
      ns.push({
        id: it.id,
        name: it.name,
        x: cx + rad * Math.cos(ang),
        y: cy + rad * Math.sin(ang),
        ax: cx,
        ay: cy,
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
    })
  })

  /**
   * 静态松弛：一次性把重叠的节点推开。
   *
   * 这不是物理模拟 —— 是有限次迭代的确定性求解，
   * 算完就结束，页面静止时不会再跑。
   */
  const ITER = 260
  const anchors = ns.map((n) => ({ x: n.x, y: n.y }))
  for (let step = 0; step < ITER; step++) {
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i]!
        const b = ns[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        const min = a.r + b.r + 16
        if (d >= min || d < 0.001) continue
        const push = (min - d) / 2
        const ux = dx / d
        const uy = dy / d
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
      }
    }
    // 拉回锚点 + 限制在画布内
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i]!
      const a = anchors[i]!
      n.x += (a.x - n.x) * 0.035
      n.y += (a.y - n.y) * 0.035
      const m = n.kind === 'hub' ? 46 : 34
      n.x = Math.min(w - m, Math.max(m, n.x))
      n.y = Math.min(h - m, Math.max(m, n.y))
    }
  }

  nodes.value = ns
  links.value = ls
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
 * 依次尝试「右侧、左侧、右侧上移、左侧上移……」取第一个不碰撞的位置。
 */
function layoutLabels() {
  const ns = nodes.value
  const placed: { x1: number; x2: number; y: number }[] = []
  const H = 12

  const sorted = [...ns].sort((a, b) => a.y - b.y || a.x - b.x)

  for (const node of sorted) {
    const w = labelWidth(node.name)

    if (node.kind === 'hub') {
      const x1 = node.x - w / 2
      const x2 = node.x + w / 2
      const baseY = node.y - node.r - 7
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

    const cx = node.x
    const cy = node.y
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

const LABEL = 'rgba(98,95,89,0.95)'
const CLAUDE = '#d97757'
const CLAUDE_DEEP = '#b4553a'

let hoveredId: string | null = null
let activeSet: Set<string> | null = null

/**
 * 放射关联的目标集合。
 *
 * 悬停某个节点时：
 *   - 枢纽 → 它旗下的全部技术
 *   - 技术 → 它的枢纽 + 同类技术 + 共享项目的技术
 */
let radialTargets: Set<string> | null = null
/** 需要画放射连线的对象 id 集合（不含自身） */
let radialLines: string[] = []

function buildRadial(id: string) {
  const targets = new Set<string>([id])
  const lines: string[] = []
  const node = nodes.value.find((n) => n.id === id)
  if (!node) {
    radialTargets = targets
    radialLines = lines
    return
  }

  if (node.kind === 'hub') {
    for (const l of links.value) {
      if (l.source === id) {
        targets.add(l.target)
        lines.push(l.target)
      }
    }
  } else {
    // 所属枢纽
    for (const l of links.value) {
      if (l.target === id) {
        targets.add(l.source)
        lines.push(l.source)
      }
    }
    // 同类技术
    for (const n of nodes.value) {
      if (n.kind === 'item' && n.category === node.category && n.id !== id) {
        targets.add(n.id)
        lines.push(n.id)
      }
    }
    // 共享项目的技术
    for (const n of nodes.value) {
      if (n.kind !== 'item' || n.id === id) continue
      if (targets.has(n.id)) continue
      if (n.projects.some((p) => node.projects.includes(p))) {
        targets.add(n.id)
        lines.push(n.id)
      }
    }
  }

  radialTargets = targets
  radialLines = lines
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

  /** 当前绘制坐标（含入场动画插值） */
  const px = (n: GNode) => n.x
  const py = (n: GNode) => n.y

  /**
   * 生效的高亮节点。
   *
   * 悬停优先（临时预览），否则用持久选中（来自左栏点击）。
   */
  const focusId = hoveredId ?? props.selectedId ?? null
  const hovering = focusId !== null
  const focusSet = hovering ? radialTargets : null

  // ---- 边 ----
  ctx.lineWidth = 1
  for (const l of ls) {
    const a = ns.find((n) => n.id === l.source)
    const b = ns.find((n) => n.id === l.target)
    if (!a || !b) continue
    const related = hovering && focusSet!.has(a.id) && focusSet!.has(b.id)
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

  // ---- 放射关联线（悬停时从焦点节点射出） ----
  if (hovering && focusId) {
    const focus = ns.find((n) => n.id === focusId)
    if (focus) {
      ctx.strokeStyle = 'rgba(217,119,87,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const tid of radialLines) {
        const t = ns.find((n) => n.id === tid)
        if (!t) continue
        ctx.moveTo(px(focus), py(focus))
        ctx.lineTo(px(t), py(t))
      }
      ctx.stroke()
    }
  }

  // ---- 节点 ----
  for (const n of ns) {
    const x = px(n)
    const y = py(n)
    const inFocus = !hovering || focusSet!.has(n.id)
    const dim =
      !inFocus ||
      (activeSet
        ? n.kind === 'hub'
          ? !n.projects.some((p) => activeSet!.has(p))
          : !activeSet.has(n.id)
        : false)
    const isHover = focusId === n.id
    const isNeighbor = hovering && !isHover && focusSet!.has(n.id)

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
        ctx.lineWidth = 1.4
        ctx.stroke()
        ctx.lineWidth = 1
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
    if (hovering && !focusSet!.has(n.id)) continue
    const nx = px(n)
    const ny = py(n)
    if (Math.abs(n.lx - nx) < 12 && Math.abs(n.ly - ny) < 6) continue
    ctx.moveTo(nx, ny)
    ctx.lineTo(n.lx, n.ly - 3)
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
    if (hovering && !focusSet!.has(n.id)) continue
    const hot = hoveredId === n.id
    const neighbor = hovering && !hot && focusSet!.has(n.id)
    ctx.textAlign = n.anchor === 'middle' ? 'center' : n.anchor
    ctx.fillStyle = hot || neighbor ? CLAUDE_DEEP : LABEL
    ctx.fillText(n.name, n.lx, n.ly)
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
    const d = Math.hypot(n.x - x, n.y - y)
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

  /**
   * 只有命中/未命中**发生变化**时才重绘。
   *
   * 指针在空白处移动不触发任何绘制 ——
   * 静态图谱不需要逐帧跟随光标。
   */
  if (hid !== hoveredId) {
    hoveredId = hid
    if (hov) {
      buildRadial(hov.id)
      emit('hover', {
        id: hov.id,
        name: hov.name,
        kind: hov.kind,
        category: hov.category,
        categoryName: hov.categoryName,
        note: hov.note,
        projects: hov.projects,
        count: hov.count,
      })
    } else {
      buildRadial(props.selectedId ?? '')
      emit('hover', null)
    }
    draw()
  }

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
    category: hov.category,
    categoryName: hov.categoryName,
    note: hov.note,
    projects: hov.projects,
    count: hov.count,
  })
}

const onPointerLeave = () => {
  if (!hoveredId) return
  hoveredId = null
  buildRadial(props.selectedId ?? '')
  emit('hover', null)
  draw()
}

/* ------------------------------------------------------------------ */
/*  入场动画（只在第一次加载时跑一次）                                  */
/* ------------------------------------------------------------------ */

const ENTER_DUR = 1000
let rafId: number | null = null
/** 入场进度 0–1；1 表示已停机 */
const enterProgress = ref(0)

/** 缓出三次方：起步快、收尾慢 */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function startEntrance() {
  const ns = nodes.value
  if (!ns.length) return

  const t0 = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / ENTER_DUR)
    const e = easeOut(t)
    enterProgress.value = e
    // 用最终坐标与起点（画布中心）插值 —— 节点从中心向外展开
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i]!
      const fx = finalPos.value[i]?.x ?? n.x
      const fy = finalPos.value[i]?.y ?? n.y
      n.x = n.ax + (fx - n.ax) * e
      n.y = n.ay + (fy - n.ay) * e
    }
    draw()

    if (t < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      // 动画结束 —— 彻底停机，不再有 rAF
      rafId = null
      enterProgress.value = 1
      for (let i = 0; i < ns.length; i++) {
        const n = ns[i]!
        const f = finalPos.value[i]
        if (f) {
          n.x = f.x
          n.y = f.y
        }
      }
      layoutLabels()
      draw()
    }
  }
  rafId = requestAnimationFrame(step)
}

/** 静态布局的最终坐标（入场动画的终点） */
const finalPos = shallowRef<{ x: number; y: number }[]>([])

/* ------------------------------------------------------------------ */
/*  尺寸                                                              */
/* ------------------------------------------------------------------ */

let ro: ResizeObserver | null = null
/** 尺寸变化去抖计时器 */
let resizeTimer: number | null = null

function measure() {
  const el = wrapEl.value
  const c = canvasEl.value
  if (!el || !c) return
  const w = Math.round(el.clientWidth)
  if (w < 10) return

  /**
   * 画布高度上限受视口高度约束。
   *
   * 如果画布比视口还高，锁定后图谱就得内部滚动 ——
   * 那正是之前那种异步滑动。所以这里把高度压到视口内。
   */
  const vh = window.innerHeight
  const maxH = Math.max(420, vh - 190)
  const desired =
    w < 560
      ? Math.round(Math.max(520, Math.min(720, w * 1.5)))
      : Math.round(Math.max(560, Math.min(820, w * 0.92)))
  let targetH = Math.round(Math.min(desired, maxH))

  /**
   * 填满模式：画布高度 = 容器可用高度。
   *
   * 容器被 flex 拉成和左栏等高，取它的 clientHeight，
   * 两栏底部就齐平了。
   */
  if (props.fill) {
    const hostH = el.clientHeight
    if (hostH > 120) targetH = hostH
  }

  /**
   * 设备像素比上限 1.5。
   * Retina 屏 devicePixelRatio = 2，全量清屏 + 重绘的像素量会翻近 2 倍。
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

  buildLayout()
  finalPos.value = nodes.value.map((n) => ({ x: n.x, y: n.y }))
  layoutLabels()
  draw()
}

/* ------------------------------------------------------------------ */
/*  生命周期                                                          */
/* ------------------------------------------------------------------ */

onMounted(() => {
  measure()
  // 记录静态终态，供入场动画使用
  finalPos.value = nodes.value.map((n) => ({ x: n.x, y: n.y }))

  if (wrapEl.value && 'ResizeObserver' in window) {
    /**
     * 尺寸变化去抖。
     *
     * 关键：ResizeObserver 会在布局稳定后**再触发一次**，
     * 如果每次都重跑布局 + 重绘，就会造成「持续计算」。
     * 这里用 120ms 去抖把连续触发合并成一次，
     * 且重跑的是**静态布局**（有限次迭代，算完即止），不是物理引擎。
     */
    ro = new ResizeObserver(() => {
      if (resizeTimer !== null) clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null
        measure()
      }, 120)
    })
    ro.observe(wrapEl.value)
  }

  // 入场动画：只在挂载后跑一次
  setTimeout(() => {
    if (enterProgress.value === 0) startEntrance()
  }, 60)
})

onBeforeUnmount(() => {
  // 停机：确保没有残留的动画循环
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (resizeTimer !== null) clearTimeout(resizeTimer)
  ro?.disconnect()
})

// 数据源变化 → 重算静态布局
watch(
  () => props.cats,
  () => {
    buildLayout()
    finalPos.value = nodes.value.map((n) => ({ x: n.x, y: n.y }))
    layoutLabels()
    draw()
  },
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

/**
 * 持久选中变化 → 重绘。
 *
 * 左栏点了某个领域，右边图谱上对应的枢纽节点要立刻高亮并展开放射关联。
 * 这里只重绘一帧，不启动任何动画循环。
 */
watch(
  () => props.selectedId,
  () => {
    if (!hoveredId) buildRadial(props.selectedId ?? '')
    draw()
  },
)
</script>

<template>
  <!--
    外层 wrapEl 是画布的测量基准。
    fill 模式下它取父容器高度（父容器由 flex 拉成与左栏等高），
    画布绝对定位铺满，避免「画布决定容器高度、容器又决定画布高度」的循环。
  -->
  <div
    ref="wrapEl"
    class="relative w-full overflow-hidden"
    :class="fill ? 'h-full' : ''"
  >
    <canvas
      ref="canvasEl"
      class="block w-full touch-none select-none"
      :class="fill ? 'absolute inset-0' : ''"
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
