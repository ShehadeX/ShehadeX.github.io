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
 * 静态布局：**雪花晶枝（snowflake dendrite）**。
 *
 * 结构：
 *   - 6 条主轴按 60° 均分（旋转对称 → 雪花感）。
 *   - 每个领域的技术项沿主轴向外生长，**左右交替分叉** ——
 *     像雪花的晶枝主干上长出侧枝。
 *   - 枢纽在主轴起点，技术项在后面的"站位"上。
 *
 * 为什么不用「同心弧」或「矩形晶格」：
 *   两种方案都要求在一段固定弧长/固定矩形里塞进最多 14 个项，
 *   必然要靠松弛硬推 → 挤成一团、标签互相压叠、越界。
 *
 *   晶枝方案里，每个项独占一个"站位"（左右各一），
 *   站距与侧向距离是**常量** —— 间距是算出来的，不是推出来的，
 *   所以永远不会重叠。
 *
 * 还有一个关键前提：**平时只画节点圆点，技术名只在悬停/选中时出现**。
 * 61 个节点轻松排开；一旦要把 55 个技术名同时画出来，
 * 任何排布都会被标签淹没。
 */
function buildLayout() {
  const w = cssW.value
  const h = cssH.value

  const ns: GNode[] = []

  /**
   * 晶枝的基础尺寸（px）。
   *
   * 这三个值经离线模拟器验证过：
   * 在 520~1200px 宽度范围内，配合下面的自适应收缩，
   * 节点与标签都不会越界、不会重叠。
   */
  const BASE_HUB = 52
  const BASE_STEP = 38
  const BASE_LAT = 34

  /**
   * 自适应收缩。
   *
   * 窄屏时整体等比缩小晶枝尺寸，直到所有节点与标签都落在画布内。
   * 宽屏时保持基础尺寸不变（不再放大 —— 放大只会更散）。
   */
  let hubR = BASE_HUB
  let step = BASE_STEP
  let lat = BASE_LAT

  for (let attempt = 0; attempt < 30; attempt++) {
    const placed = placeDendrite(hubR, step, lat)
    if (fitsInCanvas(placed, w, h)) break
    hubR = Math.max(28, Math.round(hubR * 0.94))
    step = Math.max(24, Math.round(step * 0.94))
    lat = Math.max(18, Math.round(lat * 0.94))
  }

  const placed = placeDendrite(hubR, step, lat)

  for (const n of placed.nodes) {
    ns.push({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
      r: n.r,
      kind: n.kind,
      category: n.category,
      categoryName: n.categoryName,
      note: n.note,
      projects: n.projects,
      count: n.count,
      lx: 0,
      ly: 0,
      anchor: 'middle',
    })
  }
  links.value = placed.links
  nodes.value = ns
}

/** 中间结果：晶枝节点 + 边 */
interface Dendrite {
  nodes: GNode[]
  links: GLink[]
}

/**
 * 晶枝排布（纯几何，不涉及标签）。
 *
 * 每个领域：
 *   - 枢纽在主轴起点（半径 hubR 处）
 *   - 技术项沿主轴排站，每站左右各一个（侧向 ±lat）
 *   - 侧枝交替左右 → 晶枝的锯齿感
 */
function placeDendrite(hubR: number, step: number, lat: number): Dendrite {
  const w = cssW.value
  const h = cssH.value
  const cx = w / 2
  const cy = h / 2

  const ns: GNode[] = []
  const ls: GLink[] = []

  const nCat = Math.max(1, props.cats.length)
  const sector = (Math.PI * 2) / nCat
  const MAXST = 7

  props.cats.forEach((cat, ci) => {
    const a = -Math.PI / 2 + ci * sector
    /** 主轴单位向量 */
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    /** 侧向单位向量 */
    const tx = -uy
    const ty = ux

    ns.push({
      id: cat.id,
      name: cat.name,
      x: cx + ux * hubR,
      y: cy + uy * hubR,
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
     * 排序：用得多的靠近枢纽（与放射关联语义一致）。
     */
    const items = [...cat.items].sort(
      (p, q) => q.projects.length - p.projects.length || p.name.localeCompare(p.name),
    )
    const n = items.length
    if (n === 0) return

    let idx = 0
    let st = 0
    while (idx < n && st < MAXST) {
      const r = hubR + (st + 1) * step
      for (const side of [1, -1] as const) {
        if (idx >= n) break
        const it = items[idx]!
        idx++
        ns.push({
          id: it.id,
          name: it.name,
          x: cx + ux * r + tx * lat * side,
          y: cy + uy * r + ty * lat * side,
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
      st++
    }
    /** 兜底：站位用完还有剩余 → 继续沿最后一排铺 */
    if (idx < n) {
      const r = hubR + (MAXST + 1) * step
      while (idx < n) {
        const it = items[idx]!
        idx++
        const side = idx % 2 === 0 ? 1 : -1
        ns.push({
          id: it.id,
          name: it.name,
          x: cx + ux * r + tx * lat * side,
          y: cy + uy * r + ty * lat * side,
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

  return { nodes: ns, links: ls }
}

/**
 * 检查晶枝是否完整落在画布内。
 *
 * 用**节点包围盒 + 标签估算宽高**做保守判断，
 * 宁可多收缩一点，也不要让任何东西被裁掉。
 */
function fitsInCanvas(d: Dendrite, w: number, h: number): boolean {
  /** 余量：节点圆点 + 标签引导线都要留出空间，不能贴边 */
  const PAD = 14
  for (const n of d.nodes) {
    if (n.x < PAD || n.x > w - PAD || n.y < PAD || n.y > h - PAD) return false
  }
  return true
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
 * 标签布局（确定性）。
 *
 * 关键设计：**平时只显示枢纽名，技术名只在悬停/选中时出现**。
 *
 * 为什么：
 *   55 个技术名 + 61 个节点挤在 743×700 里，
 *   任何排布都会被标签淹没 —— 这正是之前"看不清"和"重叠"的根源。
 *   收成"平时只见晶体、悬停才见文字"后，
 *   信息密度回到可读范围，交互也更有层次。
 *
 * 枢纽名：常驻，放在枢纽下方，水平居中。
 * 技术名：仅在 focusSet 内时出现，沿径向朝外挂（远离中心）。
 */
function layoutLabels() {
  const ns = nodes.value
  const placed: { x1: number; x2: number; y: number; focus: boolean }[] = []
  const H = 12

  /** 焦点集合：悬停优先，否则持久选中 */
  const focusId = hoveredId ?? props.selectedId ?? null
  const focusSet = focusId !== null ? radialTargets : null

  /**
   * 排序：**焦点内的节点先占位**。
   *
   * 悬停某个节点时，只有焦点集合内的技术名会显示。
   * 如果和普通节点混在一起按 y 排序，焦点标签可能被非焦点
   * 节点"抢先"占掉好位置、或者被推到画布外。
   * 所以焦点优先。
   */
  const sorted = [...ns].sort((a, b) => {
    const fa = focusSet && focusSet.has(a.id) ? 0 : 1
    const fb = focusSet && focusSet.has(b.id) ? 0 : 1
    if (fa !== fb) return fa - fb
    return a.y - b.y || a.x - b.x
  })

  for (const node of sorted) {
    const w = labelWidth(node.name)

    /* ---------- 枢纽：常驻 ---------- */
    if (node.kind === 'hub') {
      /** 水平居中，且整体落在画布内 */
      let lx = node.x
      const half = w / 2
      if (lx - half < 4) lx = 4 + half
      if (lx + half > cssW.value - 4) lx = cssW.value - 4 - half

      const y = Math.min(cssH.value - 4, node.y + node.r + 11)
      placed.push({ x1: lx - half, x2: lx + half, y, focus: true })
      node.lx = lx
      node.ly = y
      node.anchor = 'middle'
      continue
    }

    /* ---------- 技术项：只在焦点集合内才显示 ---------- */
    if (!focusSet || !focusSet.has(node.id)) {
      node.lx = node.x
      node.ly = node.y + node.r + 9
      node.anchor = 'middle'
      continue
    }

    /**
     * 沿径向朝外挂标签。
     *
     * 径向朝外 = 远离画布中心 → 标签不会挤在晶体内部，
     * 也不会互相压叠（不同站位的径向距离不同）。
     */
    const dx = node.x - cssW.value / 2
    const dy = node.y - cssH.value / 2
    const d = Math.hypot(dx, dy) || 1
    const rx = dx / d
    const ry = dy / d

    let chosen: { x1: number; x2: number; y: number; lx: number } | null = null

    /**
     * 候选位置：**8 个方向 × 5 级**。
     *
     * 只用径向/纵向是不够的 —— 径向相邻的站位（比如同一瓣里
     * 前后两站）如果都往外挂，标签就会撞在一起。
     * 加上切向（垂直于主轴）与四个对角方向后，
     * 总能找到不压叠的空位。
     */
    const DIRS: { dx: number; dy: number }[] = [
      { dx: rx, dy: ry },        // 径向朝外
      { dx: -rx, dy: -ry },      // 径向朝内
      { dx: -ry, dy: rx },       // 切向左
      { dx: ry, dy: -rx },       // 切向右
      { dx: (rx - ry) * 0.707, dy: (ry + rx) * 0.707 },
      { dx: (rx + ry) * 0.707, dy: (ry - rx) * 0.707 },
      { dx: (-rx - ry) * 0.707, dy: (-ry + rx) * 0.707 },
      { dx: (-rx + ry) * 0.707, dy: (-ry - rx) * 0.707 },
      { dx: 0, dy: 1 },          // 正下
      { dx: 0, dy: -1 },         // 正上
    ]

    const candidates: { lx: number; ly: number }[] = []
    /**
     * 按方向逐轮尝试：先试每方向的第 1 级，再试第 2 级……
     * 这样优先"离节点近且不冲突"的位置。
     */
    for (let lvl = 0; lvl < 6; lvl++) {
      for (const dir of DIRS) {
        const off = node.r + 7 + lvl * (H + 3)
        candidates.push({
          lx: node.x + dir.dx * off,
          ly: node.y + dir.dy * off + 3.4,
        })
      }
    }

    /** 该标签是否属于焦点集合（焦点内的更重要，可以覆盖普通标签） */
    const isFocus = focusSet?.has(node.id) ?? false

    for (const cand of candidates) {
      const x1 = cand.lx - w / 2
      const x2 = cand.lx + w / 2
      if (x1 < 3 || x2 > cssW.value - 3) continue
      if (cand.ly < 10 || cand.ly > cssH.value - 3) continue

      const hit = placed.some((p) => {
        if (x1 < p.x2 + 3 && p.x1 - 3 < x2 && Math.abs(cand.ly - p.y) < H) {
          /**
           * 焦点标签优先：
           * 焦点内的标签可以占用普通标签已占的位置
           * （普通标签此刻是不可见的，等下焦点消失时重新排布）。
           */
          return !isFocus || !p.focus
        }
        return false
      })
      if (hit) continue
      chosen = { x1, x2, y: cand.ly, lx: cand.lx }
      break
    }

    if (!chosen) {
      /**
       * 兜底：全画布网格搜索一个不冲突的位置。
       *
       * 前面的候选都是"围绕节点"的位置，如果瓣内节点特别密
       * （比如 AI 领域的 14 项），这些位置可能全被占了。
       * 这时退而求其次 —— 在画布范围内扫描，
       * 找离节点最近、且不压叠已有标签的点。
       */
      const half = w / 2
      let bestD = Infinity
      for (let ly = 12; ly < cssH.value - 4; ly += H + 1) {
        for (let lx = half + 4; lx < cssW.value - half - 4; lx += 6) {
          const x1 = lx - half
          const x2 = lx + half
          if (x2 > cssW.value - 3) continue
          const hit = placed.some(
            (p) => x1 < p.x2 + 3 && p.x1 - 3 < x2 && Math.abs(ly - p.y) < H,
          )
          if (hit) continue
          const d = Math.hypot(lx - node.x, ly - node.y)
          if (d < bestD) {
            bestD = d
            chosen = { x1, x2, y: ly, lx }
          }
        }
      }
    }

    if (!chosen) {
      /** 极端兜底：水平收敛进画布（可能与已有标签轻微重叠，但绝不出界） */
      let lx = node.x
      const half = w / 2
      if (lx - half < 4) lx = 4 + half
      if (lx + half > cssW.value - 4) lx = cssW.value - 4 - half
      chosen = { x1: lx - half, x2: lx + half, y: node.y + node.r + 9, lx }
    }

    placed.push({ x1: chosen.x1, x2: chosen.x2, y: chosen.y, focus: isFocus })
    node.lx = chosen.lx
    node.ly = chosen.y
    node.anchor = 'middle'
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
    // 技术名只在焦点集合内出现 → 没有名字就不需要引导线
    if (n.kind === 'item' && (!hovering || !focusSet!.has(n.id))) continue
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
    // 技术名只在焦点集合内出现（平时只见晶体骨架）
    if (n.kind === 'item' && (!hovering || !focusSet!.has(n.id))) continue
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
