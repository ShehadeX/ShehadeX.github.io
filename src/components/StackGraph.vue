<script setup lang="ts">
import { computed, ref } from 'vue'
import { stackCategories, stackProjects, allStackItems, usageCount } from '@/data/stack'

/**
 * Obsidian 式技术栈图谱。
 *
 * - 分类节点是枢纽，技术项环绕其分布，边表示归属关系
 * - 选中某个项目时，边切换为「项目 → 该项目使用的技术」，其余节点淡出
 * - 节点半径 = 该技术被多少个项目使用（使用频次越高越大）
 * - 布局确定性计算，无随机数，SSR 与客户端一致
 */

const W = 860
const H = 620
const CX = W / 2
const CY = H / 2

interface Node {
  id: string
  name: string
  x: number
  y: number
  r: number
  kind: 'hub' | 'item'
  category: string
  categoryName: string
  note: string
  projects: string[]
  count: number
}

interface Edge {
  from: string
  to: string
  active: boolean
}

const selectedProject = ref<string | null>(null)
const hovered = ref<string | null>(null)

const layout = computed(() => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const hubR = 196
  const itemR = 104

  stackCategories.forEach((cat, ci) => {
    const a = -Math.PI / 2 + (ci * Math.PI * 2) / stackCategories.length
    const hx = CX + hubR * Math.cos(a)
    const hy = CY + hubR * Math.sin(a)

    nodes.push({
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
    })

    const n = cat.items.length
    cat.items.forEach((it, ii) => {
      // 在枢纽附近 ±1.05 弧度内均匀散开，多层错开避免重叠
      const layer = ii % 2
      const idxInLayer = Math.floor(ii / 2)
      const countInLayer = Math.ceil((n - layer) / 2)
      const spread = 2.1
      const off = (idxInLayer - (countInLayer - 1) / 2) * (spread / Math.max(1, countInLayer - 1 || 1))
      const ang = a + off * 0.85
      const rad = itemR + layer * 46
      const x = CX + rad * Math.cos(ang)
      const y = CY + rad * Math.sin(ang)
      const count = usageCount(it.id)

      nodes.push({
        id: it.id,
        name: it.name,
        x,
        y,
        r: 3.6 + count * 1.15,
        kind: 'item',
        category: cat.id,
        categoryName: cat.name,
        note: it.note,
        projects: it.projects,
        count,
      })
      edges.push({ from: cat.id, to: it.id, active: true })
    })
  })

  return { nodes, edges }
})

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
  stackProjects.find((p) => p.slug === selectedProject.value) ?? null,
)

/** 右侧详情面板 */
const detail = computed(() => {
  const id = hovered.value
  if (!id) return null
  const node = layout.value.nodes.find((n) => n.id === id)
  return node ?? null
})

const itemProjects = computed(() => {
  if (!detail.value) return []
  return detail.value.projects
    .map((slug) => stackProjects.find((p) => p.slug === slug))
    .filter(Boolean)
})

const toggleProject = (slug: string) => {
  selectedProject.value = selectedProject.value === slug ? null : slug
}
</script>

<template>
  <div class="overflow-hidden rounded-[15px] border border-ink/12 bg-base">
    <!-- 头部：项目筛选 -->
    <div class="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-raised px-4 py-3">
      <span class="eyebrow mr-1">Stack Graph</span>
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
        v-for="p in stackProjects"
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
        {{ allStackItems.length }} techs · {{ stackCategories.length }} domains
      </span>
    </div>

    <div class="grid gap-0 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <!-- 图谱 -->
      <div class="relative border-b border-ink/10 lg:border-b-0 lg:border-r">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          class="block h-auto w-full"
          role="img"
          aria-label="技术栈关系图谱"
        >
          <!-- 归属边 -->
          <line
            v-for="(e, i) in layout.edges"
            :key="`e${i}`"
            :x1="layout.nodes.find((n) => n.id === e.from)!.x"
            :y1="layout.nodes.find((n) => n.id === e.from)!.y"
            :x2="layout.nodes.find((n) => n.id === e.to)!.x"
            :y2="layout.nodes.find((n) => n.id === e.to)!.y"
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
              :x2="layout.nodes.find((n) => n.id === e.to)!.x"
              :y2="layout.nodes.find((n) => n.id === e.to)!.y"
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
            v-for="n in layout.nodes"
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
                hovered === n.id ? '#d97757' : 'rgba(32,31,29,0.25)'
              "
              stroke-width="1"
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
              :x="n.x"
              :y="n.y + n.r + 11"
              text-anchor="middle"
              font-size="9.5"
              font-family="ui-monospace, monospace"
              :fill="hovered === n.id ? '#b4553a' : 'rgba(98,95,89,0.95)'"
            >
              {{ n.name }}
            </text>
          </g>
        </svg>

        <p class="border-t border-ink/10 px-4 py-2.5 font-mono text-[10.5px] leading-relaxed text-ink-faint">
          节点大小 = 该技术被多少个项目使用 · 点分类或技术查看详情
        </p>
      </div>

      <!-- 详情面板 -->
      <div class="p-5 sm:p-6">
        <template v-if="detail">
          <div class="flex items-baseline gap-2.5">
            <span class="claude-num">{{ detail.kind === 'hub' ? 'DOMAIN' : 'TECH' }}</span>
            <h3 class="display text-[20px] leading-tight">{{ detail.name }}</h3>
          </div>
          <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ detail.categoryName }}</p>
          <p class="mt-3 text-[13.5px] leading-[1.8] text-ink-body">{{ detail.note }}</p>

          <div v-if="itemProjects.length" class="mt-5">
            <p class="eyebrow">Used in</p>
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
              v-for="it in stackCategories.find((c) => c.id === detail!.id)?.items ?? []"
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
          <p class="eyebrow">Tech Stack</p>
          <p class="mt-3 text-[13.5px] leading-[1.85] text-ink-muted">
            六个领域、{{ allStackItems.length }} 项技术。点上方项目筛选可以只看某个项目用到的部分；
            悬停任意节点查看它的实际用法。
          </p>
          <div class="mt-5 space-y-3">
            <div v-for="c in stackCategories" :key="c.id">
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
