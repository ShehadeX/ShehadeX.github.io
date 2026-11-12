import { computed, ref } from 'vue'

/**
 * 技术栈图谱的共享交互状态。
 *
 * 为什么用模块级单例而不是 props 透传：
 *   图谱在右栏、���术选型在左栏，两者需要联动（选中节点 → 左栏展示对应技术）。
 *   如果用 props，需要 HomeView → StackGraph → StackCanvas 一路向下透传，
 *   再反向 emit 上来，链路太长且容易断。
 *   这里用模块级 ref 做单例，任何组件都能读写同一份状态。
 */

export interface StackSelection {
  id: string
  name: string
  kind: 'hub' | 'item'
  /** 所属分类名称（画布抛出） */
  category: string
  note: string
  projects: string[]
  count: number
}

/** 图谱顶部筛选的项目 slug；null = 未筛选 */
const selectedProject = ref<string | null>(null)

/** 画布上被点击选中的节点（持久选择） */
const selectedNode = ref<StackSelection | null>(null)

/** 画布上正在悬停的节点（临时，鼠标移开即清空） */
const hoveredNode = ref<StackSelection | null>(null)

export function useStackSelection() {
  /**
   * 当前生效的焦点节点。
   *
   * 优先级：点击选中的节点 > 悬停中的节点 > null。
   * 点击是「用户的选择」，悬停只是临时预览，所以点击优先。
   *
   * 做成 computed 而不是普通函数 —— 这样模板里读 focused.value
   * 能正确建立响应式依赖，悬停或点击变化时自动更新。
   */
  const focusedNode = computed(() => selectedNode.value ?? hoveredNode.value)

  /** 切换项目筛选时清掉节点选择，避免两套筛选互相打架 */
  const setProject = (slug: string | null) => {
    selectedProject.value = slug
    selectedNode.value = null
  }

  /** 点击同一个节点 = 取消选择 */
  const toggleNode = (node: StackSelection | null) => {
    if (!node) {
      selectedNode.value = null
      return
    }
    selectedNode.value = selectedNode.value?.id === node.id ? null : node
  }

  const clearAll = () => {
    selectedProject.value = null
    selectedNode.value = null
  }

  return {
    selectedProject,
    selectedNode,
    hoveredNode,
    focusedNode,
    setProject,
    toggleNode,
    clearAll,
  }
}
