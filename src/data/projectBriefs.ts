import type { Lang } from '@/composables/useI18n'

interface BriefCopy {
  title: string
  subtitle: string
  summary: string
  highlights: [string, string, string]
}

interface ProjectBrief {
  slug: string
  domain: 'research' | 'web'
  stack: string[]
  copy: Record<Lang, BriefCopy>
}

export const projectBriefs: ProjectBrief[] = [
  {
    slug: 'education-technology',
    domain: 'research',
    stack: ['Python', 'EdNet', 'Knowledge Tracing'],
    copy: {
      zh: {
        title: '智能教育与知识追踪',
        subtitle: '预算约束下的学习序列建模',
        summary: '用学生过去的作答预测下一题的表现，研究训练预算有限时，如何兼顾短历史学生和低频题目。',
        highlights: [
          '从 EdNet 作答序列构造训练和评估数据，保证每次预测只使用当时可见的历史。',
          '搭建全量训练、提前停止和抽样策略的可比较基线，分别检查总体表现、短历史学生和低频题目的表现。',
          '记录训练与数据选择的开销。现阶段的先导实验为下一轮研究提供依据，采样策略的稳定性仍在验证。',
        ],
      },
      en: {
        title: 'Education Technology',
        subtitle: 'Knowledge tracing under a training budget',
        summary: 'Predicts responses from past student interactions and studies how training budgets affect students with short histories and questions with few observations.',
        highlights: [
          'Prepares training and evaluation sequences from EdNet using only the history available at each prediction.',
          'Compares full-data training, early stopping and sampling baselines, with separate checks for short student histories and rare questions.',
          'Tracks both training and data-selection costs. Pilot runs inform the next stage, and the stability of sampling strategies remains under study.',
        ],
      },
    },
  },
  {
    slug: 'eeg-research',
    domain: 'research',
    stack: ['EEG', 'Motor imagery', 'Model evaluation'],
    copy: {
      zh: {
        title: 'EEGResearch',
        subtitle: '脑电解码模型与评估方案',
        summary: '围绕运动想象与连续脑电解码，研究模型如何处理时间结构、电极空间信息和连续记录中的状态。',
        highlights: [
          '考察跨受试者运动想象解码中的时间建模，并用固定训练条件组织模型比较。',
          '为电极布局和空间信息设计对照，区分坐标表述改变、元数据不匹配和实际信号信息损失。',
          '规划连续记录中的状态更新与重置评估，记录数据分工、模型版本和实验依据。目前各条研究线的验证进度不同。',
        ],
      },
      en: {
        title: 'EEGResearch',
        subtitle: 'EEG decoding models and evaluation protocols',
        summary: 'Studies how decoding models handle temporal structure, electrode geometry and state in motor-imagery and continuous EEG.',
        highlights: [
          'Examines temporal modeling for cross-subject motor imagery and organizes comparisons under a fixed training setup.',
          'Designs controls that distinguish changes in coordinate conventions, metadata mismatches and signal information loss.',
          'Plans checks for state updates and resets in continuous recordings, tracking dataset roles, model versions and supporting evidence. The research tracks are at different stages.',
        ],
      },
    },
  },
  {
    slug: 'aurora-x4',
    domain: 'research',
    stack: ['Flight dynamics', 'Control simulation', 'MATLAB'],
    copy: {
      zh: {
        title: 'AURORA-X4',
        subtitle: '倾转旋翼飞行器过渡仿真',
        summary: '在仿真中研究倾转旋翼飞行器如何从悬停过渡到巡航，以及任务条件和模型不确定性如何影响过渡过程。',
        highlights: [
          '用飞行动力学和控制仿真描述从悬停到巡航的过渡场景。',
          '以统一的任务场景规划策略比较，关注任务完成、跟踪误差和约束违反。',
          '当前工作处于模型与仿真阶段，实飞验证尚未开展。',
        ],
      },
      en: {
        title: 'AURORA-X4',
        subtitle: 'Tiltrotor transition simulation',
        summary: 'Uses simulation to study a tiltrotor’s transition from hover to cruise and its sensitivity to mission conditions and model uncertainty.',
        highlights: [
          'Models the transition from hover to cruise with flight dynamics and control simulation.',
          'Plans strategy comparisons under common mission scenarios, tracking completion, tracking error and constraint violations.',
          'The work is at the modeling and simulation stage. Flight testing has yet to take place.',
        ],
      },
    },
  },
  {
    slug: 'engineering-portfolio',
    domain: 'web',
    stack: ['Vue', 'TypeScript', 'Vite', 'GitHub Pages'],
    copy: {
      zh: {
        title: '个人工程作品集',
        subtitle: '双语项目案例与研究网站',
        summary: '将工程案例、研究介绍和公开图集放在同一个网站，方便读者按主题浏览或直接打开某个项目。',
        highlights: [
          '使用 Vue 和 TypeScript 组织首页、项目详情、研究与图集，支持在同一页面切换语言。',
          '用项目叙述、流程图和公开截图说明应用场景与交付过程。',
          '通过 GitHub Actions 构建并部署至 GitHub Pages，为项目详情提供可直接访问的链接。',
        ],
      },
      en: {
        title: 'Engineering Portfolio',
        subtitle: 'Bilingual case studies and research website',
        summary: 'Brings engineering case studies, research summaries and public galleries together for browsing by topic or sharing a direct project link.',
        highlights: [
          'Uses Vue and TypeScript for the home, project, research and gallery views, with language switching on each page.',
          'Documents application context and delivery through case narratives, workflow diagrams and public screenshots.',
          'Builds and deploys to GitHub Pages with GitHub Actions, including direct links to project details.',
        ],
      },
    },
  },
]
