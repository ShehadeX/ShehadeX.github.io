<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/**
 * 微信二维码弹窗。
 *
 * 触发方式：父组件通过 v-model:open 控制。
 * 交互：
 *   - 点击遮罩 / 关闭按钮 / 按 Esc 关闭
 *   - 打开时锁定 body 滚动
 *   - 焦点移入弹窗，关闭后归还给触发元素（无障碍）
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const panel = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

function close() {
  emit('update:open', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close()
    return
  }
  // 简易焦点陷阱：Tab 在弹窗内循环
  if (e.key === 'Tab' && props.open && panel.value) {
    const focusables = panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables.length) return
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      lastFocused = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => panel.value?.focus())
    } else {
      document.body.style.overflow = ''
      lastFocused?.focus?.()
      lastFocused = null
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wx">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wx-modal-title"
      >
        <!-- 遮罩 -->
        <div
          class="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          @click="close"
        />

        <!-- 面板 -->
        <div
          ref="panel"
          tabindex="-1"
          class="relative w-full max-w-[340px] overflow-hidden rounded-[16px] border border-ink/12 bg-base shadow-[0_28px_70px_-24px_rgba(32,31,29,0.55)] outline-none"
        >
          <div class="flex items-center justify-between border-b border-ink/10 bg-raised px-5 py-3.5">
            <div class="flex items-center gap-2.5">
              <img src="/img/social/wechat.png" alt="" class="h-5 w-5 object-contain" />
              <h3 id="wx-modal-title" class="text-[14px] font-semibold text-ink">添加微信</h3>
            </div>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-muted transition-colors duration-150 hover:bg-ink/8 hover:text-ink"
              aria-label="关闭"
              @click="close"
            >
              <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
          </div>

          <div class="px-6 py-6 text-center">
            <div class="mx-auto w-fit rounded-[10px] border border-ink/10 bg-white p-2.5">
              <img
                src="/img/social/wechat-qr.png"
                alt="微信二维码"
                class="h-[208px] w-[208px] object-contain"
              />
            </div>
            <p class="mt-4 text-[13px] leading-relaxed text-ink-muted">
              微信扫码添加好友<br />
              <span class="text-ink">备注「简历」优先通过</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wx-enter-active,
.wx-leave-active {
  transition: opacity 180ms ease;
}
.wx-enter-active .relative,
.wx-leave-active .relative {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}
.wx-enter-from,
.wx-leave-to {
  opacity: 0;
}
.wx-enter-from .relative,
.wx-leave-to .relative {
  transform: translateY(14px) scale(0.97);
  opacity: 0;
}
</style>
