<script setup lang="ts">
import type { Project } from '@/data/projects'
import LazyImage from '@/components/LazyImage.vue'

defineProps<{ project: Project; index: number }>()
</script>

<template>
  <article
    class="group relative overflow-hidden rounded-[15px] border border-ink/12 bg-base transition-colors duration-150 hover:border-ink/25"
  >
    <!-- cover -->
    <RouterLink
      :to="`/project/${project.slug}`"
      class="relative block overflow-hidden border-b border-ink/10 bg-raised focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <LazyImage
        :src="project.cover"
        :alt="project.coverCaption"
        :ratio="project.coverRatio || '16 / 10'"
        :fit="project.coverRatio ? 'contain' : 'cover'"
        :class="project.coverRatio ? '' : 'max-h-[300px]'"
        class="transition-transform duration-[420ms] ease-out group-hover:scale-[1.02]"
      />
      <!-- CASE 徽章压在图片左上角 -->
      <span
        class="absolute left-4 top-4 inline-flex h-6 items-center rounded-[3px] bg-overlay px-2.5 font-mono text-[10px] tracking-[0.12em] text-base"
      >
        {{ project.case }}
      </span>
      <span
        class="absolute bottom-3 right-4 inline-flex h-6 items-center rounded-[3px] bg-base/85 px-2.5 font-mono text-[10px] tracking-[0.1em] text-ink-muted backdrop-blur-sm"
      >
        {{ project.domain }}
      </span>
    </RouterLink>

    <!-- body -->
    <div class="flex flex-col p-5 sm:p-7">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-10">
        <RouterLink
          :to="`/project/${project.slug}`"
          class="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <h3 class="display text-[27px] leading-tight">{{ project.title }}</h3>
          <p class="mt-1.5 text-[14.5px] text-ink-muted">{{ project.subtitle }}</p>
          <p class="mt-4 max-w-[46ch] text-[14px] leading-[1.8] text-ink-body">
            {{ project.summary }}
          </p>
          <div class="mt-5 flex flex-wrap gap-1.5">
            <span v-for="t in project.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </RouterLink>

        <!-- BEFORE / BUILT / AFTER -->
        <dl class="grid gap-5 border-t border-ink/10 pt-5 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div v-for="k in (['before', 'built', 'after'] as const)" :key="k">
            <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-claude-deep">
              {{ k }}
            </dt>
            <dd class="mt-1.5 text-[12.5px] leading-[1.7] text-ink-muted">
              {{ project.bba[k] }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="mt-6 flex items-center justify-between gap-4 border-t border-ink/10 pt-4">
        <span class="font-mono text-[11px] text-ink-faint">{{ project.period }}</span>
        <RouterLink
          :to="`/project/${project.slug}`"
          class="inline-flex items-center gap-1.5 font-mono text-[11px] text-claude-deep underline decoration-claude/35 underline-offset-4 transition-colors duration-150 hover:decoration-claude-deep"
        >
          Preview
          <span class="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>
