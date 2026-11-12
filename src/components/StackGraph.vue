<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { stackCategories, stackProjects, allStackItems, usageCount } from '@/data/stack'
import { stackCategoriesEn, stackProjectsEn } from '@/data/stack.en'
import { t, lang } from '@/composables/useI18n'
import { computed as _c } from 'vue'

/**
 * Obsidian 式技术栈图谱（力导向 + 实时吸附）。
 *
 * 布局不再写死：
 *   - 初始位置由确定性算法生成（无随机数，保证 SSR 与首屏一致）
 *   - 挂载后进入力导向模拟：斥力 + 弹簧 + 向心力，持续微调
 *   - 指针靠近节点时，节点被「吸附」到指针方向并高亮，标签跟随
 *
 * 节点语义：
 *   - 分类是枢纽节点（hub），技术项挂在其周围
 *   - 边 = 分类归属；选中项目后，边 = 项目 → 该项目用到的技术
 *   - 节点半径 = 该技术被多少个项目使用（使用频次越高越大）
 */

const W = 1120
const H = 840
const CX = W / 2
const CY = H / 2

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
  /** 固定位置（枢纽），力导向时不参与位移 */
  fixed?: boolean
  /** 锚点：初始确定性位置，节点始终被弹性拉回锚点附近 */
  ax: number
  ay: number
  /** 呼吸漂移的相位与半径（确定性，按下标推导） */
  ph: number
  driftR: number
  /** 标签的垂直错位量（用于消除重叠） */
  labelDy: number
}

interface Edge {
  from: string
  to: string
  active: boolean
}

const isEn = _c(() => lang.value === 'en')
const cats = _c(() => (isEn.value ? stackCategoriesEn : stackCategories))
const projects_ = _c(() => (isEn.value ? stackProjectsEn : stackProjects))

const selectedProject = ref<string | null>(null)
const hovered = ref<string | null>(null)

/** 指针位置（SVG 坐标系），null 表示不在图上 */
const pointer = ref<{ x: number; y: number } | null>(null)
/** 被指针吸附的节点 id */
const snapped = ref<string | null>(null)

const svgEl = ref<SVGSVGElement | null>(null)

/* ------------------------------------------------------------------ */
/*  初始布局：确定性，按类别均分角度                                   */
/* ------------------------------------------------------------------ */

/**
 * 初始布局：径向树（sector / 弧线排布）。
 *
 * 每个分类占据一个角度扇区，分类下的技术沿着扇区内的弧线分两圈排开，
 * 这样标签之间有稳定的角度间隔，不会像纯随机布局那样互相压叠。
 */
/**
 * 初始布局：径向树 + 按标签宽度分配角度。
 *
 * 关键点：角度不是简单均分，而是根据每个标签的**实际像素宽度**分配。
 * 标签宽的（如 "Element Plus"）占更大的角度份额，窄的（如 "Vue 3"）占更小，
 * 这样同一圈上的标签在弧线上有足够的物理间隔，不会互相压叠。
 */
const buildLayout = () => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const HUB_R = 130          // 枢纽半径
  const RING_A = 246         // 第一圈技术半径
  const RING_B = 384         // 第二圈技术半径
  const SECTOR = (Math.PI * 2) / Math.max(1, cats.value.length)
  const HALF = SECTOR / 2 - 0.06 // 扇区半角

  /** 估算标签像素宽度：等宽字体，中日韩字符按全角算 */
  const labelWidth = (name: string) => {
    let w = 0
    for (const ch of name) {
      w += /[\u4e00-\u9fff\uff00-\uffef]/.test(ch) ? 10.2 : 6.1
    }
    return w
  }

  cats.value.forEach((cat, ci) => {
    const bisector = -Math.PI / 2 + ci * SECTOR
    const hx = CX + HUB_R * Math.cos(bisector)
    const hy = CY + HUB_R * Math.sin(bisector)

    nodes.push({
      id: cat.id,
      name: cat.name,
      x: hx,
      y: hy,
      vx: 0,
      vy: 0,
      r: 9,
      kind: 'hub',
      category: cat.id,
      categoryName: cat.name,
      note: cat.caption,
      projects: [...new Set(cat.items.flatMap((i) => i.projects))],
      count: cat.items.length,
      fixed: true,
      ax: hx,
      ay: hy,
      ph: ci * 1.7,
      driftR: 2.5,
      labelDy: 0,
    })

    // 按奇偶分两圈，保证每圈数量均衡
    const rings: { items: typeof cat.items; radius: number; shift: number }[] = [
      { items: cat.items.filter((_, i) => i % 2 === 0), radius: RING_A, shift: 0 },
      { items: cat.items.filter((_, i) => i % 2 === 1), radius: RING_B, shift: 0 },
    ]

    for (const ring of rings) {
      const list = ring.items
      if (!list.length) continue
      const radius = ring.radius

      // 每个标签的「角宽需求」= 标签宽 + 间隙，再换算成角度
      const GAP = 14
      const needs = list.map((it) => (labelWidth(it.name) + GAP) / radius)
      const totalNeed = needs.reduce((a, b) => a + b, 0)

      // 若需求角度超过扇区，就按比例压缩（宁可标签稍挤，也不越出扇区）
      const usable = HALF * 2 * 0.9
      const span = Math.min(usable, totalNeed)
      const scale = totalNeed > 0 ? span / totalNeed : 0

      // 第二圈整体偏移半个槽位，避免两圈标签在同一角度上正面对齐
      const slot = list.length ? span / list.length : 0
      const shift = ring.shift ? slot / 2 : 0

      let cursor = -span / 2
      list.forEach((it, k) => {
        const ang = bisector + cursor + (needs[k]! * scale) / 2 + shift
        cursor += needs[k]! * scale

        const count = usageCount(it.id)
        const x = CX + radius * Math.cos(ang)
        const y = CY + radius * Math.sin(ang)

        nodes.push({
          id: it.id,
          name: it.name,
          x,
          y,
          vx: 0,
          vy: 0,
          r: 3.4 + count * 1.1,
          kind: 'item',
          category: cat.id,
          categoryName: cat.name,
          note: it.note,
          projects: it.projects,
          count,
          ax: x,
          ay: y,
          ph: k * 0.9 + ci * 2.3,
          driftR: 4 + (k % 3) * 2,
          labelDy: 0,
        })
        edges.push({ from: cat.id, to: it.id, active: true })
      })
    }
  })

  /*
   * 标签去重叠（确定性）。
   *
   * 径向排布后仍可能有极窄间距的标签（例如「Pinia」与「Next.js」），
   * 这里按 y 排序扫描，凡是与前一个标签横向相交的，就把当前标签
   * 向上或向下错开 11px，交替进行，形成阶梯式错位而不是全部挤向一侧。
   */
  const items = nodes.filter((n) => n.kind === 'item')
  items.sort((a, b) => a.y - b.y || a.x - b.x)

  const LBL_H = 11
  const placed: { x1: number; x2: number; y: number }[] = []
  for (const n of items) {
    const halfW = labelWidth(n.name) / 2
    let dy = 0
    for (let attempt = 0; attempt < 12; attempt++) {
      const ly = n.y + n.r + 11 + dy
      const hits = placed.some(
        (p) =>
          n.x - halfW < p.x2 + 4 &&
          p.x1 - 4 < n.x + halfW &&
          Math.abs(ly - p.y) < LBL_H,
      )
      if (!hits) {
        placed.push({ x1: n.x - halfW, x2: n.x + halfW, y: ly })
        break
      }
      dy = attempt % 2 === 0 ? -(Math.floor(attempt / 2) + 1) * LBL_H : (Math.floor(attempt / 2) + 1) * LBL_H
    }
    n.labelDy = dy
  }

  return { nodes, edges }
}

/** 可变的节点集合（力导向直接改写坐标） */
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const resetLayout = () => {
  const l = buildLayout()
  nodes.value = l.nodes
  edges.value = l.edges
}

resetLayout()

/* ------------------------------------------------------------------ */
/*  力导向模拟                                                        */
/* ------------------------------------------------------------------ */

let raf = 0
let running = false
let last = 0

/** 物理参数 */
/*
 * 物理参数（弹性锚定 + 轻量斥力）。
 *
 * 不用纯自由力导向：那样节点会被斥力一路推到画布边界，标签互相压叠。
 * 这里给每个节点一个确定性锚点（ax/ay），力只负责让节点在锚点附近
 * 微微漂移并互相避让 —— 有动态感，但布局始终稳定可读。
 */
const ANCHOR_PULL = 0.055   // 拉回锚点的强度
const REPULSION_RANGE = 58 // 互斥作用半径（像素）
const DAMPING = 0.9
const MAX_STEP = 1.1

function step(dt: number) {
  const ns = nodes.value
  const n = ns.length
  if (!n) return

  // 局部互斥：只对近距离节点生效，避免把布局整体推散
  for (let i = 0; i < n; i++) {
    const a = ns[i]!
    for (let j = i + 1; j < n; j++) {
      const b = ns[j]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy)
      if (d > REPULSION_RANGE || d < 0.01) continue
      const overlap = (REPULSION_RANGE - d) / REPULSION_RANGE
      const fx = (dx / d) * overlap * 0.12
      const fy = (dy / d) * overlap * 0.12
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  // 弹性锚定：始终把节点拉回自己的锚点附近。
  // 锚点本身带一个缓慢的呼吸漂移（图案内已有的 drift 动效风格），
  // 让整张图始终有生命感，而不是静止的图片。
  const t = performance.now() / 1000
  for (const node of ns) {
    if (node.fixed) {
      node.vx = 0
      node.vy = 0
      // 枢纽也跟着轻微呼吸，避免中心节点显得死板
      node.x = node.ax + Math.cos(t * 0.3 + node.ph) * node.driftR
      node.y = node.ay + Math.sin(t * 0.26 + node.ph) * node.driftR
      continue
    }
    const tx = node.ax + Math.cos(t * 0.45 + node.ph) * node.driftR
    const ty = node.ay + Math.sin(t * 0.38 + node.ph * 1.3) * node.driftR
    node.vx += (tx - node.x) * ANCHOR_PULL
    node.vy += (ty - node.y) * ANCHOR_PULL
  }

  // 指针吸附：指针附近的节点朝指针靠拢并高亮
  if (pointer.value) {
    const p = pointer.value
    let best: Node | null = null
    let bestDist = Infinity
    for (const node of ns) {
      const d = Math.hypot(node.x - p.x, node.y - p.y)
      if (d < 120 && d < bestDist) {
        bestDist = d
        best = node
      }
    }
    snapped.value = best?.id ?? null
    if (best) {
      const dx = p.x - best.x
      const dy = p.y - best.y
      const d = Math.hypot(dx, dy) || 1
      const target = best.r + 24
      const pull = (d - target) * 0.08
      best.vx += (dx / d) * pull
      best.vy += (dy / d) * pull
    }
  }

  // 积分 + 阻尼
  for (const node of ns) {
    if (node.fixed) continue
    node.vx *= DAMPING
    node.vy *= DAMPING
    node.vx = Math.max(-MAX_STEP, Math.min(MAX_STEP, node.vx))
    node.vy = Math.max(-MAX_STEP, Math.min(MAX_STEP, node.vy))
    node.x += node.vx * dt
    node.y += node.vy * dt
    // 锚点附近的软边界：偏离锚点太远时拉回
    const m = node.r + 16
    node.x = Math.max(m, Math.min(W - m, node.x))
    node.y = Math.max(m, Math.min(H - m, node.y))
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
  start()
})

onBeforeUnmount(() => {
  stop()
})

// 切换语言 / 数据源变化时重置布局
watch(cats, () => {
  resetLayout()
})

/* ------------------------------------------------------------------ */
/*  交互                                                              */
/* ------------------------------------------------------------------ */

const toSvgPoint = (evt: MouseEvent) => {
  const el = svgEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  // viewBox 等比缩放，换算回 SVG 用户坐标
  const scale = W / r.width
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

/** 选中项目时，额外生成「项目 → 技术」的边 */
const projectEdges = computed<Edge[]>(() => {
  if (!selectedProject.value) return []
  return allStackItems
    .filter((i) => i.projects.includes(selectedProject.value as string))
    .map((i) => ({ from: `__p__${i.id}`, to: i.id, active: true }))
})

/** 选中项目时，被该项目使用的技术集合 */
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

const currentProject = computed(() =>
  projects_.value.find((p) => p.slug === selectedProject.value) ?? null,
)

/** 右侧详情面板 */
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

/** 节点坐标的响应式读取（力导向会改写 nodes.value 的元素） */
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

    <div class="grid gap-0 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <!-- 图谱 -->
      <div class="relative border-b border-ink/10 lg:border-b-0 lg:border-r">
        <svg
          ref="svgEl"
          :viewBox="`0 0 ${W} ${H}`"
          class="block h-auto w-full touch-none select-none"
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
            stroke="rgba(32,31,29,0.16)"
            stroke-width="1"
          />

          <!-- 项目 → 技术 边 -->
          <g v-if="selectedProject">
            <line
              v-for="(e, i) in projectEdges"
              :key="`p${i}`"
              :x1="CX"
              :y1="CY"
              :x2="nodeById(e.to)?.x"
              :y2="nodeById(e.to)?.y"
              stroke="rgba(217,119,87,0.5)"
              stroke-width="1.4"
            />
            <circle :cx="CX" :cy="CY" r="11" fill="#d97757" />
            <text
              :x="CX"
              :y="CY + 3.5"
              text-anchor="middle"
              font-size="9"
              font-family="ui-monospace, monospace"
              fill="#ECE9E0"
            >
              {{ currentProject?.name.slice(0, 4) }}
            </text>
          </g>

          <!-- 节点 -->
          <g
            v-for="n in nodes"
            :key="n.id"
            class="cursor-pointer"
            :opacity="isDim(n) ? 0.22 : 1"
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
              :stroke="
                hovered === n.id || snapped === n.id ? '#d97757' : 'rgba(32,31,29,0.25)'
              "
              :stroke-width="hovered === n.id || snapped === n.id ? 1.8 : 1"
            />
            <!-- 命中区域放大，方便悬停 -->
            <circle :cx="n.x" :cy="n.y" :r="Math.max(n.r + 6, 12)" fill="transparent" />

            <text
              v-if="n.kind === 'hub'"
              :x="n.x"
              :y="n.y + 3.5"
              text-anchor="middle"
              font-size="10"
              font-family="ui-monospace, monospace"
              fill="#ECE9E0"
            >
              {{ n.count }}
            </text>
            <text
              v-if="n.kind === 'hub'"
              :x="n.x"
              :y="n.y - n.r - 7"
              text-anchor="middle"
              font-size="10.5"
              font-family="ui-monospace, monospace"
              fill="rgba(32,31,29,0.9)"
              stroke="#ECE9E0"
              stroke-width="3"
              paint-order="stroke"
              stroke-linejoin="round"
            >
              {{ n.name }}
            </text>
            <text
              :x="n.x"
              :y="n.y + n.r + 11 + n.labelDy"
              text-anchor="middle"
              font-size="9.5"
              font-family="ui-monospace, monospace"
              :fill="
                hovered === n.id || snapped === n.id ? '#b4553a' : 'rgba(98,95,89,0.95)'
              "
              stroke="#ECE9E0"
              stroke-width="2.6"
              paint-order="stroke"
              stroke-linejoin="round"
            >
              {{ n.name }}
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
              v-for="it in allStackItems.filter((i) =>
                i.projects.includes(currentProject!.slug),
              )"
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
            {{ isEn
              ? `${cats.length} domains, ${allStackItems.length} technologies. Use the project filter above to narrow the view, or hover any node to see how it is actually used.`
              : `${cats.length} 个领域、${allStackItems.length} 项技术。点上方项目筛选可以只看某个项目用到的部分；悬停任意节点查看它的实际用法。` }}
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
