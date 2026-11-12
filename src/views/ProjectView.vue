<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getProject, projects } from '@/data/projects'
import BeforeBuiltAfter from '@/components/BeforeBuiltAfter.vue'
import MermaidDiagram from '@/components/MermaidDiagram.vue'
import LazyImage from '@/components/LazyImage.vue'

const route = useRoute()
const project = computed(() => getProject(route.params.slug as string))

const idx = computed(() => projects.findIndex((p) => p.slug === route.params.slug))
const next = computed(() => projects[(idx.value + 1) % projects.length])
</script>

<template>
  <div v-if="project">
    <!-- header -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 pb-12 pt-8 sm:px-8 sm:pb-16">
        <RouterLink
          to="/#projects"
          class="inline-flex items-center gap-2 font-mono text-[12px] text-ink-faint transition-colors duration-150 hover:text-ink"
        >
          ← 返回项目列表
        </RouterLink>

        <div class="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span class="font-mono text-[11px] tracking-[0.12em] text-ink-faint">
            {{ project.case }} / {{ project.domain }}
          </span>
          <span class="rule hidden flex-1 sm:block" />
        </div>

        <h1 class="mt-5 text-[40px] leading-[1.08] sm:text-[52px]">{{ project.title }}</h1>
        <p class="mt-2 text-[17px] text-ink-muted">{{ project.subtitle }}</p>
        <p class="mt-6 max-w-[62ch] text-[15px] leading-[1.8] text-ink-body">
          {{ project.summary }}
        </p>

        <!-- meta grid -->
        <dl class="mt-10 grid gap-px overflow-hidden rounded-[3px] bg-ink/12 sm:grid-cols-4">
          <div class="bg-base p-4">
            <dt class="eyebrow">Period</dt>
            <dd class="mt-1.5 font-mono text-[13px] text-ink">{{ project.period }}</dd>
          </div>
          <div class="bg-base p-4">
            <dt class="eyebrow">Role</dt>
            <dd class="mt-1.5 font-mono text-[13px] text-ink">{{ project.role }}</dd>
          </div>
          <div class="bg-base p-4">
            <dt class="eyebrow">Organization</dt>
            <dd class="mt-1.5 font-mono text-[13px] text-ink">{{ project.org }}</dd>
          </div>
          <div class="bg-base p-4">
            <dt class="eyebrow">Stack</dt>
            <dd class="mt-1.5 font-mono text-[13px] leading-relaxed text-ink">
              {{ project.stack.slice(0, 3).join(' / ') }}
            </dd>
          </div>
        </dl>

        <!-- facts -->
        <dl class="mt-4 grid gap-px overflow-hidden rounded-[3px] bg-ink/12 sm:grid-cols-4">
          <div
            v-for="f in project.facts"
            :key="f.label"
            class="bg-raised p-4"
          >
            <dt class="eyebrow">{{ f.label }}</dt>
            <dd class="tnum mt-1.5 text-[19px] font-semibold text-ink">{{ f.value }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- cover -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <figure class="overflow-hidden rounded-[15px] border border-ink/12 bg-raised">
          <LazyImage
            :src="project.cover"
            :alt="project.coverCaption"
            ratio="16 / 9"
          />
          <figcaption class="border-t border-ink/10 bg-base px-4 py-2.5 font-mono text-[11px] text-ink-muted">
            {{ project.coverCaption }}
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- before built after -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Before → Built → After</span>
          <span class="rule flex-1" />
        </div>
        <div class="mt-6">
          <BeforeBuiltAfter
            :before="project.bba.before"
            :built="project.bba.built"
            :after="project.bba.after"
          />
        </div>
      </div>
    </section>

    <!-- case sections -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Case Study</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-8 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
          <!-- sticky nav -->
          <nav class="hidden lg:block">
            <div class="sticky top-20">
              <p class="eyebrow">Contents</p>
              <ul class="mt-4 space-y-2.5">
                <li v-for="s in project.sections" :key="s.id">
                  <a
                    :href="`#${s.id}`"
                    class="flex gap-2.5 text-[13px] text-ink-muted transition-colors duration-150 hover:text-ink"
                  >
                    <span class="font-mono text-[11px] text-ink-faint">{{ s.no }}</span>
                    <span>{{ s.title.split('—')[0].trim() }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <!-- body -->
          <div class="prose space-y-12">
            <div v-for="s in project.sections" :key="s.id" :id="s.id" class="scroll-mt-24">
              <div class="flex items-baseline gap-3">
                <span class="font-mono text-[11px] text-ink-faint">{{ s.no }}</span>
                <h2 class="text-[21px] leading-snug">{{ s.title }}</h2>
              </div>
              <div class="mt-3 space-y-3">
                <p v-for="(b, i) in s.body" :key="i" class="text-[15px] leading-[1.8]">
                  {{ b }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- diagrams -->
    <section v-if="project.diagrams.length" class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Architecture &amp; Flow</span>
          <span class="rule flex-1" />
        </div>
        <div class="mt-8 space-y-8">
          <div v-for="d in project.diagrams" :key="d.id">
            <p class="mb-3 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
              FIG. {{ d.title }}
            </p>
            <MermaidDiagram :code="d.code" :id="d.id" />
          </div>
        </div>
      </div>
    </section>

    <!-- gallery -->
    <section v-if="project.gallery.length" class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Screenshots</span>
          <span class="rule flex-1" />
        </div>
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          <figure
            v-for="g in project.gallery"
            :key="g.src"
            class="overflow-hidden rounded-[15px] border border-ink/12 bg-raised"
          >
            <LazyImage :src="g.src" :alt="g.caption" ratio="16 / 10" />
            <figcaption class="border-t border-ink/10 bg-base px-4 py-2.5 font-mono text-[11px] text-ink-muted">
              {{ g.caption }}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- next project -->
    <section>
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8">
        <RouterLink
          :to="`/project/${next.slug}`"
          class="group block rounded-[15px] border border-ink/12 p-6 transition-colors duration-150 hover:bg-raised sm:p-8"
        >
          <p class="eyebrow">Next Case</p>
          <div class="mt-3 flex items-baseline justify-between gap-4">
            <h2 class="text-[24px] leading-tight sm:text-[28px]">{{ next.title }}</h2>
            <span class="font-mono text-[13px] text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </div>
          <p class="mt-1.5 text-[14px] text-ink-muted">{{ next.subtitle }}</p>
        </RouterLink>
      </div>
    </section>
  </div>

  <div v-else class="mx-auto max-w-[1400px] px-5 py-24 sm:px-8">
    <p class="font-mono text-[13px] text-ink-muted">404 — 该项目不存在</p>
    <RouterLink to="/" class="ul mt-3 inline-block font-mono text-[13px]">← 返回首页</RouterLink>
  </div>
</template>
