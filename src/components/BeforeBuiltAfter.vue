<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  before: string
  built: string
  after: string
  compact?: boolean
}
const props = withDefaults(defineProps<Props>(), { compact: false })

/**
 * Before → Built → After。
 *
 * 横向三段流程，中间用箭头连接，而不是竖向堆叠的三块。
 * 箭头本身是一条带流动光点的虚线轨道，视觉上表达「流程推进」。
 *
 * 移动端降级为竖向（箭头改为向下），避免窄屏下横向挤压。
 */
const steps = [
  { key: 'before', label: 'Before', tone: 'faint' as const },
  { key: 'built', label: 'Built', tone: 'claude' as const },
  { key: 'after', label: 'After', tone: 'strong' as const },
]

const active = ref<string | null>(null)
</script>

<template>
  <div
    class="bba-flow"
    :class="{ 'bba-flow--compact': props.compact }"
  >
    <div
      v-for="(s, i) in steps"
      :key="s.key"
      class="bba-step"
      :class="[`bba-step--${s.tone}`, { 'is-active': active === s.key }]"
      @mouseenter="active = s.key"
      @mouseleave="active = null"
    >
      <div class="bba-step__head">
        <span class="claude-num">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="bba-key" :class="s.tone === 'claude' ? 'text-claude-deep' : 'text-ink-faint'">
          {{ s.label }}
        </span>
      </div>

      <p
        class="mt-2.5 text-[13.5px] leading-[1.75]"
        :class="
          s.tone === 'claude'
            ? 'text-ink-body'
            : s.tone === 'strong'
              ? 'text-ink-strong'
              : 'text-ink-muted'
        "
      >
        {{ props[s.key as 'before' | 'built' | 'after'] }}
      </p>

      <!-- 阶段推进的可视化：步骤条 + 流向箭头 -->
      <div v-if="i < steps.length - 1" class="bba-arrow" aria-hidden="true">
        <span class="bba-arrow__line" />
        <span class="bba-arrow__head">›</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * 横向 Before → Built → After 流程。
 *
 * 用 grid 的 3 列 + 绝对定位的箭头，
 * 箭头跨在两列的交界处，形成一条连续的推进轨道。
 */
.bba-flow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  counter-reset: bba;
}

/*
 * 阶段条：三段比例依次收窄，暗示「越往后越聚焦」。
 */
.bba-step {
  position: relative;
  padding: 1.25rem 1.25rem 1.5rem;
  background: var(--color-base);
  border-top: 1px solid rgb(32 31 29 / 0.1);
  transition: background-color 220ms ease;
}

.bba-step--claude {
  background: var(--color-base);
}

.bba-step--strong {
  background: var(--color-raised);
}

.bba-step.is-active {
  background: var(--color-raised);
}

.bba-step__head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

/*
 * 箭头：一条虚线轨道 + 箭头头部。
 * 轨道上有一个缓慢移动的光点，表示「流程在推进」。
 */
.bba-arrow {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0;
  height: 0.75rem;
  overflow: hidden;
}

.bba-arrow__line {
  flex: 1;
  height: 1px;
  background-image: linear-gradient(
    to right,
    rgb(32 31 29 / 0.35) 0 6px,
    transparent 6px 12px
  );
  background-size: 12px 1px;
  background-repeat: repeat-x;
  position: relative;
}

/*
 * 流动光点：沿着虚线轨道移动。
 * 用 transform 走合成层，不触发 layout。
 */
.bba-arrow__line::after {
  content: '';
  position: absolute;
  top: -1.5px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--color-claude);
  box-shadow: 0 0 6px 1px rgb(217 119 87 / 0.55);
  animation: bda-flow-dot 2.6s linear infinite;
}

/* 光点沿轨道平移到末端 */
@keyframes bda-flow-dot {
  from {
    transform: translateX(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  to {
    transform: translateX(calc(100% - 4px));
    opacity: 0;
  }
}

.bba-arrow__head {
  font-size: 15px;
  line-height: 1;
  color: var(--color-claude);
  margin-left: -1px;
  padding-left: 3px;
}

@keyframes bba-flow-dot {
  from {
    transform: translateX(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/*
 * 桌面端：三列横排，箭头跨在列与列之间。
 */
@media (min-width: 768px) {
  /*
   * 桌面端用 5 列网格：三段内容 + 两条箭头列。
   * 箭头是独立的网格单元，正好落在两段之间的间隙中央，
   * 不会被下一段的左边框压住。
   */
  .bba-flow {
    grid-template-columns:
      minmax(0, 1fr) 2.75rem
      minmax(0, 1fr) 2.75rem
      minmax(0, 1fr);
    gap: 0;
    background: transparent;
    border-top: none;
  }

  .bba-step {
    border-top: none;
    border-left: 2px solid rgb(32 31 29 / 0.12);
    padding-left: 1.25rem;
    padding-right: 0;
  }

  .bba-step--claude {
    border-left-color: var(--color-claude);
  }

  .bba-step--strong {
    border-left-color: rgb(32 31 29 / 0.3);
  }

  /*
   * 横排时箭头是独立网格单元：垂直居中，横向铺满箭头列。
   */
  .bba-arrow {
    position: static;
    width: 100%;
    height: 0.75rem;
    display: flex;
    align-items: center;
    align-self: center;
    overflow: visible;
  }

  .bba-arrow__line {
    flex: 1;
    position: relative;
  }

  .bba-arrow__head {
    margin-left: -1px;
    padding-left: 3px;
    flex: none;
  }

  .bba-arrow__head {
    padding-left: 2px;
  }
}

/* 移动端：箭头竖向朝下 */
@media (max-width: 767px) {
  .bba-step {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    padding-bottom: 1rem;
  }

  .bba-arrow {
    position: static;
    width: 100%;
    height: 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-left: 1.25rem;
    overflow: visible;
  }

  .bba-arrow__line {
    width: 1px;
    flex: none;
    height: 100%;
    position: relative;
    background-image: linear-gradient(
      to bottom,
      rgb(32 31 29 / 0.35) 0 6px,
      transparent 6px 12px
    );
    background-size: 1px 12px;
  }

  .bba-arrow__head {
    display: none;
  }
}
</style>
