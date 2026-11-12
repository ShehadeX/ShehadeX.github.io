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
   * 画布高度（px）。
   *
   * 固定值 —— 不做任何动态计算。
   * 父容器（卡片）用 flex 把它撑到与左栏等高，
   * 画布本身留白居中即可，节点布局不受容器影响。
   */
  height?: number
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
  /** 静态坐标 */
  x: number
  y: number
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

/* ------------------------------------------------------------------ */
/*  画布                                                              */
/* ------------------------------------------------------------------ */

const wrapEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

/**
 * 固定画布高度。
 *
 * About 区的两栏都是 760px 高，
 * 卡片头（项目筛选条）约占 48px，
 * 所以画布区约 700px —— 与左栏底部对齐。
 */
const FIXED_H = 700

const cssW = ref(900)
const cssH = ref(FIXED_H)

/** 窄屏：标签放不下，只显示分类名 */
const isNarrow = computed(() => cssW.value < 560)

let ctx: CanvasRenderingContext2D | null = null

/* ------------------------------------------------------------------ */
/*  静态布局                                                          */
/* ------------------------------------------------------------------ */

/**
 * 静态布局：**雪花晶簇（snowflake）**。
 *
 * 结构：
 *   - 6 个领域瓣按 60° 均分方向排布（旋转对称）。
 *   - 每个领域的技术项组成一个**旋转的矩形晶格**（晶簇），
 *     晶格间距固定，节点之间保证不重叠、不压字。
 *   - 晶簇沿瓣方向向外生长，长短不一的列形成晶体阶梯感。
 *
 * 为什么不用「同心弧 + 松弛」：
 *   同心弧要把 n 个点塞进 46° 的窄扇区，
 *   弧长不够 → 必然靠松弛硬推 → 挤成一团、标签压叠。
 *   改成矩形晶格后，间距是**算出来的**而不是推出来的，
 *   每一项都有自己独立的格子，永远不会重叠。
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
  /** 每个领域占的角度 */
  const sector = (Math.PI * 2) / nCat

  /**
   * 晶格间距（px）。
   *
   * 节点圆心距 —— 标签宽约 40~70px、字高 12px，
   * 这个间距保证上下两行的标签不会互相压叠。
   */
  const GAP = base * 0.072
  /** 枢纽到中心的距离 */
  const hubD = base * 0.125

  props.cats.forEach((cat, ci) => {
    const a = -Math.PI / 2 + ci * sector
    /** 径向单位向量（瓣的生长方向） */
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    /** 切向单位向量（晶格的横向） */
    const tx = -uy
    const ty = ux

    const hx = cx + ux * hubD
    const hy = cy + uy * hubD

    ns.push({
      id: cat.id,
      name: cat.name,
      x: hx,
      y: hy,
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

    /**
     * 技术项排布：旋转矩形晶格。
     *
     * 先按「被项目用得最多」排序 —— 用得多的放在靠内的列，
     * 这与放射关联的语义一致：靠近枢纽的是这个领域的核心。
     */
    const items = [...cat.items].sort(
      (p, q) => q.projects.length - p.projects.length || p.name.localeCompare(p.name),
    )
    const n = items.length
    if (n === 0) return

    /**
     * 晶格形状：尽量接近正方形。
     *
     * rows = 列数（径向方向），cols = 行数（切向方向）…
     * 这里让「列」沿径向生长，每列的高度尽量均分，
     * 于是晶簇外形像晶体生长出来的阶梯，而不是一个方块。
     */
    const cols = Math.ceil(Math.sqrt(n))
    const baseH = Math.floor(n / cols)
    const extra = n % cols

    /** 每一列（径向列）上的节点数 */
    const colH: number[] = []
    for (let c = 0; c < cols; c++) colH.push(baseH + (c < extra ? 1 : 0))
    const maxH = Math.max(...colH)

    /**
     * 晶簇中心（径向坐标）。
     *
     * 以枢纽为中心向两侧生长 —— 这样晶簇自然包住枢纽，
     * 中心不会留出一圈空白环。
     */
    const uCenter = hubD
    /** 切向：所有列顶对齐，形成阶梯 */
    const vTop = -((maxH - 1) * GAP) / 2

    let idx = 0
    for (let c = 0; c < cols; c++) {
      const h = colH[c]!
      /** 该列的径向偏移 */
      const du = (c - (cols - 1) / 2) * GAP
      for (let rr = 0; rr < h; rr++) {
        const it = items[idx]!
        idx++
        /** 该节点的切向偏移 */
        const dv = vTop + rr * GAP

        /**
         * 晶格坐标 → 画布坐标。
         *
         * 算完后再做一次**边界收敛**：把越界的节点沿
         * 「指向中心」的方向拉回来，而不是平移 —— 保持晶格的
         * 相对结构不变，只压缩外扩的幅度。
         */
        let px = cx + ux * (uCenter + du) + tx * dv
        let py = cy + uy * (uCenter + du) + ty * dv
        /** 边距：下方要放标签，所以留更多 */
        const mx = 52
        const myTop = 30
        const myBot = 40
        if (px < mx) px = mx
        if (px > w - mx) px = w - mx
        if (py < myTop) py = myTop
        if (py > h - myBot) py = h - myBot

        ns.push({
          id: it.id,
          name: it.name,
          x: px,
          y: py,
          r: 3.4 + it.projects.length * 1.1,
          kind: 'item',
          category: cat.id,
          categoryName: cat.name,
          note: it.note,
          projects: it.projects,
          count: it.projects.length,
          lx: 0,
          ly: 0,
          anchor: 'middle',
        })
        ls.push({ source: cat.id, target: it.id })
      }
    }
  })

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
      if (y > cssH.value - 4) y = cssH.value - 4
      if (y < 10) y = 10
      /** 枢纽名也可能超宽，水平收敛进画布 */
      let lx = node.x
      const half = w / 2
      if (lx - half < 4) lx = 4 + half
      if (lx + half > cssW.value - 4) lx = cssW.value - 4 - half
      placed.push({ x1: lx - half, x2: lx + half, y })
      node.lx = lx
      node.ly = y
      node.anchor = 'middle'
      continue
    }

    const cx = node.x
    const cy = node.y
    const rightX = cx + node.r + 4
    const leftX = cx - node.r - 4
    const baseY = cy + 3.4

    /**
     * 晶格里的技术项：标签统一挂在节点**正下方居中**。
     *
     * 晶格间距 GAP 已经保证上下两行至少隔开 GAP 像素，
     * 而标签高度只有 12px —— 所以正下方永远放得下，
     * 不需要左右翻来翻去地避让（那样反而会横跨到隔壁格子）。
     */
    if (node.anchor === 'middle') {
      /**
       * 标签整体必须落在画布内。
       *
       * 居中锚点下，标签左右各占 w/2。
       * 靠边的节点如果直接居中，一半标签会跑到画布外被裁掉，
       * 所以这里把标签整体**平移**回可视区（不移动节点本身，
       * 节点位置是布局算出来的，不该被标签反向影响）。
       */
      let lx = cx
      const half = w / 2
      if (lx - half < 4) lx = 4 + half
      if (lx + half > cssW.value - 4) lx = cssW.value - 4 - half

      /** 默认挂在节点下方；下方放不下就翻到上方 */
      let y = cy + node.r + 9
      if (y > cssH.value - 4) y = cy - node.r - 4

      placed.push({ x1: lx - half, x2: lx + half, y })
      node.lx = lx
      node.ly = y
      node.anchor = 'middle'
      continue
    }

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

    /**
     * 标签必须完整落在画布内。
     *
     * 避让算法只管"不互相重叠"，不管"会不会超出画布"——
     * 贴边的节点标签会被裁掉，所以这里做一次边界收敛：
     * 右侧放不下就翻到左侧，上下同理。
     */
    const maxX = cssW.value
    if (chosen.x2 > maxX - 4) {
      const flipX = cx - node.r - 4 - w
      if (flipX > 4) {
        chosen.x1 = flipX
        chosen.x2 = flipX + w
        chosen.anchor = 'end'
      }
    }
    if (chosen.y > cssH.value - 4) chosen.y = cssH.value - 4
    if (chosen.y < 10) chosen.y = 10

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

  /** 当前绘制坐标 = 静态位置 + 指针吸附偏移 */
  const px = (n: GNode) => n.x + (offsets.get(n.id)?.x ?? 0)
  const py = (n: GNode) => n.y + (offsets.get(n.id)?.y ?? 0)

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
    const off = offsets.get(n.id)
    const nx = px(n)
    const ny = py(n)
    const lx = n.lx + (off?.x ?? 0)
    const ly = n.ly + (off?.y ?? 0)
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
    if (hovering && !focusSet!.has(n.id)) continue
    const hot = hoveredId === n.id
    const neighbor = hovering && !hot && focusSet!.has(n.id)
    const off = offsets.get(n.id)
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
    const off = offsets.get(n.id)
    const d = Math.hypot(n.x + (off?.x ?? 0) - x, n.y + (off?.y ?? 0) - y)
    if (d < range && d < bestDist) {
      bestDist = d
      best = n
    }
  }
  return best
}

/**
 * 指针移动。
 *
 * 只做两件事：
 *   1. 算一次吸附偏移（纯计算，O(节点数)）
 *   2. **命中变化时**才重绘 + 发事件
 *
 * 指针在空白处移动 → 只更新吸附，不重绘整张图。
 * 吸附的最大位移只有 7px，肉眼看不出来，
 * 但节点会微微"跟手"，这是唯一的动态反馈。
 */
const onPointerMove = (evt: PointerEvent | MouseEvent) => {
  const c = canvasEl.value
  if (!c) return
  const r = c.getBoundingClientRect()
  const x = evt.clientX - r.left
  const y = evt.clientY - r.top

  pointer = { x, y }

  const hov = pickNode(x, y, 18)
  const hid = hov?.id ?? null

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
    computeSnap()
    draw()
    const want = hid ? 'pointer' : 'default'
    if (c.style.cursor !== want) c.style.cursor = want
  }
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
  pointer = null
  offsets.clear()
  if (!hoveredId) return
  hoveredId = null
  buildRadial(props.selectedId ?? '')
  emit('hover', null)
  draw()
}

/* ------------------------------------------------------------------ */
/*  指针吸附                                                          */
/* ------------------------------------------------------------------ */

/**
 * 细微的指针吸附。
 *
 * 指针附近的节点会被"吸"向光标一点点（最多几像素），
 * 只是在静态布局上做一点点偏移 —— 不改变结构，不重新布局。
 *
 * 关键：**不用动画循环**。
 * 吸附量在 pointermove 事件里一次性算完并画一帧，
 * 事件频率就是浏览器给的频率（通常 ≤ 60Hz），
 * 没有任何后台 rAF 在跑。
 */

interface Offset {
  x: number
  y: number
}

/** 当前指针位置（画布坐标），null 表示不在画布上 */
let pointer: { x: number; y: number } | null = null

/** 吸附半径（px） */
const SNAP_R = 90
/** 最大吸附位移（px）—— 刻意做得很小，只是"有感觉" */
const SNAP_MAX = 7

/** 每个节点的吸附偏移 */
const offsets = new Map<string, Offset>()

function computeSnap() {
  offsets.clear()
  if (!pointer) return
  const px = pointer.x
  const py = pointer.y
  for (const n of nodes.value) {
    const dx = px - n.x
    const dy = py - n.y
    const d = Math.hypot(dx, dy)
    if (d >= SNAP_R || d < 0.001) continue
    // 平方衰减：越近吸得越强
    const t = 1 - d / SNAP_R
    const pull = t * t * SNAP_MAX
    offsets.set(n.id, { x: (dx / d) * pull, y: (dy / d) * pull })
  }
}

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
   * 画布高度：**固定常量**，不读父容器、不看视口。
   *
   * 之前高度是动态算出来的（读父容器 clientHeight / 视口高度），
   * 这带来一个连锁反应：
   *   左栏内容变高 → 父容器变高 → 画布重测 → 重新布局 → 节点跳动
   *
   * 而且 ResizeObserver 会在布局稳定后再触发一次，
   * 动态高度下这条链路会反复触发。
   *
   * 改成固定高度后：
   *   - 画布尺寸永远不变，节点位置永远不变
   *   - 只有宽度变化（窗口缩放）才重新布局
   *   - 左栏随便怎么变都不影响右栏
   */
  const targetH = props.height ?? FIXED_H

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
  layoutLabels()
  draw()
}

/* ------------------------------------------------------------------ */
/*  生命周期                                                          */
/* ------------------------------------------------------------------ */

onMounted(() => {
  measure()

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
})

onBeforeUnmount(() => {
  if (resizeTimer !== null) clearTimeout(resizeTimer)
  ro?.disconnect()
})

// 数据源变化 → 重算静态布局
watch(
  () => props.cats,
  () => {
    buildLayout()
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
    画布高度是固定常量，容器高度与之无关 ——
    所以这里不需要绝对定位，也不存在"容器决定画布、画布决定容器"的循环。
  -->
  <div ref="wrapEl" class="relative flex w-full items-center justify-center overflow-hidden">
    <canvas
      ref="canvasEl"
      class="block touch-none select-none"
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
