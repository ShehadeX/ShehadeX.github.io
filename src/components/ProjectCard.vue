<script setup lang="ts">
import type { Project } from '@/data/projects'
import LazyImage from '@/components/LazyImage.vue'

defineProps<{ project: Project; index: number }>()
</script>

<template>
  <article class="group">
    <RouterLink
      :to="`/project/${project.slug}`"
      class="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <!-- cover -->
      <div
        class="relative overflow-hidden rounded-[15px] border border-ink/12 bg-raised"
      >
        <LazyImage
          :src="project.cover"
          :alt="project.coverCaption"
          :ratio="project.coverRatio || '16 / 10'"
          :fit="project.coverRatio ? 'contain' : 'cover'"
          class="transition-transform duration-[420ms] ease-out group-hover:scale-[1.02]"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-overlay/25 to-transparent opacity-0 transition-opacity duration-[420ms] ease-out group-hover:opacity-100"
        />
      </div>

      <!-- body -->
      <div class="mt-5 flex items-start gap-4">
        <span class="claude-num mt-1">0{{ index + 1 }}</span>
        <div class="min-w-0 flex-1">
          <h3 class="display text-[22px] leading-tight">{{ project.title }}</h3>
          <p class="mt-1 text-[14px] text-ink-muted">{{ project.subtitle }}</p>
          <p class="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-ink-body">
            {{ project.summary }}
          </p>

          <div class="mt-4 flex flex-wrap gap-1.5">
            <span v-for="t in project.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>

        <span
          class="mt-1 shrink-0 font-mono text-[12px] text-ink-faint transition-transform duration-[200ms] ease-out group-hover:translate-x-0.5 group-hover:text-ink"
        >
          →
        </span>
      </div>
    </RouterLink>
  </article>
</template>
