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
 * 箭头是一条带流动光点的虚线轨道，视觉上表达「流程推进」。
 *
 * 结构要点（踩过的坑）：
 *   桌面端网格是 5 列 = 3 段内容 + 2 条箭头列。
 *   **箭头必须是 .bba-flow 的直接子元素**，
 *   如果把箭头放在 .bba-step 内部，三段内容会落进第 1/2/3 列，
 *   而第 2 列只有 2.75rem 宽，Built 会被压扁成一条。
 *   所以模板里用 <template v-for> 同时吐出「段落」和「箭头」两个同级元素。
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
  <div class="bba-flow" :class="{ 'bba-flow--compact': props.compact }">
    <!--
      用 template 包一层，让「段落」和「箭头」成为 .bba-flow 的同级子元素，
      这样桌面端的 5 列网格才会按 内容→箭头→内容→箭头→内容 排列。
    -->
    <template v-for="(s, i) in steps" :key="s.key">
      <div
        class="bba-step"
        :class="[`bba-step--${s.tone}`, { 'is-active': active === s.key }]"
        @mouseenter="active = s.key"
        @mouseleave="active = null"
      >
        <div class="bba-step__head">
          <span class="claude-num">{{ String(i + 1).padStart(2, '0') }}</span>
          <span
            class="bba-key"
            :class="s.tone === 'claude' ? 'text-claude-deep' : 'text-ink-faint'"
          >
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
      </div>

      <!-- 阶段推进的可视化：虚线轨道 + 流向箭头 -->
      <div v-if="i < steps.length - 1" class="bba-arrow" aria-hidden="true">
        <span class="bba-arrow__line" />
        <span class="bba-arrow__head">›</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
/*
 * 横向 Before → Built → After 流程。
 *
 * 桌面端：5 列网格 = 内容 | 箭头 | 内容 | 箭头 | 内容
 * 箭头是独立网格单元，正好落在两段之间的间隙中央。
 */
.bba-flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.bba-step {
  position: relative;
  padding: 1.25rem 1.25rem 1.5rem;
  background: var(--color-base);
  border-top: 1px solid rgb(32 31 29 / 0.1);
  transition: background-color 220ms ease;
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
  display: flex;
  align-items: center;
  width: 100%;
  height: 0.75rem;
}

.bba-arrow__line {
  flex: 1;
  height: 1px;
  position: relative;
  background-image: linear-gradient(
    to right,
    rgb(32 31 29 / 0.35) 0 6px,
    transparent 6px 12px
  );
  background-size: 12px 1px;
  background-repeat: repeat-x;
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
  animation: bba-flow-dot 2.6s linear infinite;
}

@keyframes bba-flow-dot {
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
  flex: none;
}

/*
 * 桌面端：三段横排，箭头是独立的网格列。
 */
@media (min-width: 768px) {
  .bba-flow {
    grid-template-columns:
      minmax(0, 1fr) 2.75rem
      minmax(0, 1fr) 2.75rem
      minmax(0, 1fr);
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

  .bba-arrow {
    align-self: center;
    height: 0.75rem;
  }
}

/* 移动端：竖向堆叠，箭头朝下 */
@media (max-width: 767px) {
  .bba-step {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    padding-bottom: 1rem;
  }

  .bba-arrow {
    flex-direction: column;
    align-items: flex-start;
    padding-left: 1.25rem;
    height: 1.75rem;
  }

  .bba-arrow__line {
    width: 1px;
    flex: none;
    height: 100%;
    background-image: linear-gradient(
      to bottom,
      rgb(32 31 29 / 0.35) 0 6px,
      transparent 6px 12px
    );
    background-size: 1px 12px;
  }

  /* 竖向轨道上的光点改为向下移动 */
  .bba-arrow__line::after {
    top: 0;
    left: -1.5px;
    animation-name: bba-flow-dot-down;
  }

  @keyframes bba-flow-dot-down {
    from {
      transform: translateY(0);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    85% {
      opacity: 1;
    }
    to {
      transform: translateY(calc(100% - 4px));
      opacity: 0;
    }
  }

  .bba-arrow__head {
    display: none;
  }
}
</style>
