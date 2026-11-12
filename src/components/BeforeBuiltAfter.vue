<script setup lang="ts">
interface Props {
  before: string
  built: string
  after: string
  compact?: boolean
}
defineProps<Props>()
</script>

<template>
  <dl class="grid gap-px overflow-hidden rounded-[3px] bg-ink/12" :class="compact ? 'sm:grid-cols-3' : ''">
    <div class="bg-base p-4">
      <dt class="bba-key text-ink-faint">Before</dt>
      <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">{{ before }}</dd>
    </div>
    <div class="bg-base p-4">
      <dt class="bba-key text-ink-faint">Built</dt>
      <dd class="mt-2 text-[13px] leading-relaxed text-ink-body">{{ built }}</dd>
    </div>
    <div class="bg-raised p-4">
      <dt class="bba-key text-ink-faint">After</dt>
      <dd class="mt-2 text-[13px] leading-relaxed text-ink-strong">{{ after }}</dd>
    </div>
  </dl>
</template>
