import { computed } from 'vue'
import { getProject, projects as projectsZh, type Project } from '@/data/projects'
import { getProjectEn } from '@/data/projects.en'
import { lang } from '@/composables/useI18n'

/**
 * 本地化项目访问层。
 *
 * 中文走 projects.ts 主数据，英文走 projects.en.ts 覆盖层；
 * 英文缺失的字段（图片路径、标签、栈、case 编号）自动回落到中文主数据，
 * 因此两套数据永远保持结构一致，不会出现「英文版少一块」。
 */

export interface LocalizedProject extends Omit<Project, 'sections' | 'gallery' | 'diagrams' | 'facts' | 'bba'> {
  bba: { before: string; built: string; after: string }
  facts: { label: string; value: string }[]
  sections: Project['sections']
  gallery: Project['gallery']
  diagrams: Project['diagrams']
}

export function localizeProject(p: Project): LocalizedProject {
  if (lang.value === 'zh') return p as LocalizedProject

  const en = getProjectEn(p.slug)
  if (!en) return p as LocalizedProject

  return {
    ...p,
    subtitle: en.subtitle,
    summary: en.summary,
    coverCaption: en.coverCaption,
    role: en.role,
    org: en.org,
    bba: en.bba,
    facts: en.facts,
    sections: en.sections.map((s, i) => {
      const zh = p.sections[i]
      return {
        id: s.id,
        no: s.no,
        title: s.title,
        body: s.body,
        media: s.media?.map((m, j) => ({
          ...m,
          ...(zh?.media?.[j] ?? {}),
          src: zh?.media?.[j]?.src ?? m.src,
          caption: m.caption,
          note: m.note,
          story: m.story,
          ratio: zh?.media?.[j]?.ratio,
        })),
      }
    }),
    gallery: en.gallery.map((g, i) => ({
      ...(p.gallery[i] ?? {}),
      src: p.gallery[i]?.src ?? g.src,
      caption: g.caption,
      ratio: p.gallery[i]?.ratio,
    })),
    diagrams: p.diagrams.map((d, i) => ({
      ...d,
      title: en.diagrams[i]?.title ?? d.title,
    })),
  }
}

export function useProjects() {
  const all = computed(() => projectsZh.map(localizeProject))
  const bySlug = (slug: string) => {
    const p = getProject(slug)
    return p ? localizeProject(p) : undefined
  }
  return { all, bySlug, zh: projectsZh }
}

/** 语义化别名：首页与详情页都通过它取本地化后的项目列表 */
export const useLocalizedProjects = useProjects
