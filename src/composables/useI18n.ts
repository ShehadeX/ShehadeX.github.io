import { ref, computed, watch } from 'vue'

/**
 * 全站语言状态。
 *
 * 需求方是中文母语者，但作品集也面向国际读者（ICLR 投稿、海外求职）。
 * 因此默认中文，提供中/英一键切换，并持久化到 localStorage。
 *
 * 翻译策略是「文案表 + 组件内 t()」：
 * 数据层（projects / research / stack）用 en 字段承载英文版本，
 * 组件内通过 t('some.key') 取当前语言。
 */

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'shehade.lang'

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Lang | null

export const lang = ref<Lang>(stored === 'en' ? 'en' : 'zh')

export const isZh = computed(() => lang.value === 'zh')

export function setLang(next: Lang) {
  lang.value = next
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  }
}

watch(
  lang,
  (v) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = v === 'zh' ? 'zh-CN' : 'en'
    }
  },
  { immediate: true },
)

/* ------------------------------------------------------------------ */
/*  文案表                                                            */
/* ------------------------------------------------------------------ */

type Dict = Record<string, string>

const zh: Dict = {
  'nav.about': '关于',
  'nav.projects': '项目',
  'nav.research': '研究',
  'nav.contact': '联系',

  'hero.eyebrow': 'AI 工程 / 智能体 / 部署',
  'hero.name.cn': '肖致浩',
  'hero.greeting': 'Hi！',
  'hero.tagline': '很高兴认识你，我以 Native-AI 和第一性原理',
  'hero.tagline2': '解决真实计算机问题',
  'hero.school':
    '广东工业大学计算机科学与技术 · 2028 届 · GPA 3.6/5、专业前 5%，三等学业奖学金。',
  'hero.school2':
    '见习机器学习学者、FDE 前沿部署工程师、Agent 智能体开发工程师——把真实需求拆成可追踪的义务实体，用前沿大模型与软件工程把流程真正跑起来。',
  'hero.cta.mail': '发邮件给我',
  'hero.cta.github': 'GitHub',
  'hero.cta.gitee': 'Gitee',

  'hero.m1.num': '5项',
  'hero.m1.title': '交付的生产级系统',
  'hero.m1.desc': 'BidOS 招投标智能体、CGA 老年综合评估系统、MoCA 认知刺激标注系统、中国电信防返贫智能体、PolyMed 用药小程序',
  'hero.m2.num': '3段',
  'hero.m2.title': '实习',
  'hero.m2.desc': '中国科学院深先院、中国电信数智、广电计量',
  'hero.m3.num': '1篇',
  'hero.m3.title': 'ICLR 2027：Dissecting the Score: Calibrated Diagnosis of EEG Foundation Models',
  'hero.m3.desc': '第二作者，EEG Foundation 模型「开盒」分析，正处于 Rebuttal 阶段',

  'hero.profile.focus': '前沿大模型应用与开发、软件工程、深度学习模型构建',
  'hero.profile.stack': 'Flask、Dify、LangGraph、Spring AI、vLLM、Vue、MySQL、OSS',
  'hero.profile.status': '日常实习及升学方向',
  'hero.profile.based': '广州 / 深圳',

  'phl.eyebrow': '开发哲学',
  'phl.t1': '用第一性原理',
  'phl.t2': '拆解问题，',
  'phl.t3': '做 AI 时代的原住民。',
  'phl.p1.t': '先问问题，再选工具',
  'phl.p1.d':
    '拿到需求先拆到不能再拆的最小单元：输入是什么、来源在哪、谁做判断、失败怎么回退。工具是最后一步，而不是第一步——不是为了用模型而用模型，是为了消除某个具体环节的人力成本。',
  'phl.p2.t': '把边界写进系统，而不是写进文档',
  'phl.p2.d':
    '模型能做什么、不能做什么，失败如何恢复、人工在哪个点拍板，都应该是代码与流程里的硬约束。一个能被追溯、被打断、被接管的产品，才是能上线的产品。',
  'phl.p3.t': '以 AI 原住民的方式交付',
  'phl.p3.d':
    '从第一天就把模型当成稳定的工程依赖：结构化输出、工具调用、检索增强、可回放的评测与观测。不是把 AI 贴到旧系统上，而是让系统从架构上就以模型能力为原生积木。',
  'phl.tags': '第一性原理 / AI 原住民 / 工程纪律 / 全链路负责',

  'about.eyebrow': '关于我',
  'about.title': '我在做的三件事',
  'about.c1.t': 'AI 工程系统',
  'about.c1.d':
    '企业招投标智能体、政府场景防返贫风险识别 Agent。关注从需求到交付的完整链路，而不是只做模型调用的那一层。',
  'about.c2.t': '医疗健康软件',
  'about.c2.d':
    '老年综合评估系统、MoCA 认知评估与脑电实时打标。软件要能在真实病房里跑，而不是只在演示环境里跑。',
  'about.c3.t': '神经科学方向的深度学习研究',
  'about.c3.d':
    '以 ICLR 2027 论文为例，尝试把 EEG 解码模型的「黑盒」打开，让能力来源可被量化归因。',
  'about.p1':
    '我的工作方式有两条固定的线。第一条是把模糊需求拆成可追踪的输入、来源、确认与输出；第二条是对模型输出保持边界意识——先定义模型可以做范围、证据要求、失败恢复方式与人工决策点，再谈它能带来多少提效。',

  'cap.eyebrow': '能力矩阵',
  'cap.title': '按 AI 开发流程组织的能力矩阵',

  'proj.eyebrow': '精选项目',
  'proj.title': '精选项目，每项都有可核查的工程证据',
  'proj.filter.all': '全部',
  'proj.cases': '个项目',
  'proj.preview': '查看详情',

  'res.eyebrow': '研究与经历',
  'res.timeline': '经历时间线',
  'res.research': '研究与论文',
  'res.detail': '查看详情 →',

  'contact.eyebrow': 'GitHub 与联系',
  'contact.title': '如果你在做 AI 与软件系统',
  'contact.p1':
    '我在找 AI 工程与后端研发方向的实习与校招机会，也乐于交流 AI 系统的落地方法。',
  'contact.email': '邮件',
  'contact.phone': '电话',
  'contact.location': '所在地',
  'contact.location.v': '广州，中国',
  'contact.status': '状态',
  'contact.status.v': '开放机会',

  'stack.graph': '技术栈图谱',
  'stack.detail': '详情',
  'stack.usedin': '使用于',
  'stack.hint': '节点大小 = 该技术被多少个项目使用 · 点分类或技术查看详情',
  'stack.inventory': '完整技术清单',
  'stack.domain': '领域',
  'stack.tech': '技术',

  'footer.tagline': 'AI Engineering',
  'footer.stack': '本站由 Vue 3 · Tailwind CSS · Mermaid 构建',

  'lang.label': 'EN',
  'lang.title': '切换到英文',
}

const en: Dict = {
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.research': 'Research',
  'nav.contact': 'Contact',

  'hero.eyebrow': 'AI ENGINEERING / AGENT / DEPLOYMENT',
  'hero.name.cn': 'Xiaozhihao',
  'hero.greeting': 'Hi!',
  'hero.tagline': 'Nice to meet you. I work with Native-AI thinking',
  'hero.tagline2': 'and first principles to solve real computing problems',
  'hero.school':
    'B.S. Computer Science, Guangdong University of Technology · Class of 2028 · GPA 3.6/5, top 5%, Third-Class Academic Scholarship.',
  'hero.school2':
    'Trainee machine learning researcher, forward-deployment engineer (FDE) and agent developer — decomposing real requirements into traceable obligation entities, then actually running the workflow with frontier models and software engineering.',
  'hero.cta.mail': 'Email me',
  'hero.cta.github': 'GitHub',
  'hero.cta.gitee': 'Gitee',

  'hero.m1.num': '5',
  'hero.m1.title': 'production systems shipped',
  'hero.m1.desc': 'BidOS bidding agent, CGA geriatric assessment, MoCA cognitive stimulation tagging, China Telecom anti-poverty agent, PolyMed medication mini-app',
  'hero.m2.num': '3',
  'hero.m2.title': 'internships',
  'hero.m2.desc': 'SIAT · China Telecom · GRGT',
  'hero.m3.num': '1',
  'hero.m3.title': 'ICLR 2027: Dissecting the Score — Calibrated Diagnosis of EEG Foundation Models',
  'hero.m3.desc': 'Second author. Opening the black box of EEG foundation models. Currently in rebuttal.',

  'hero.profile.focus': 'Frontier model application & development, software engineering, deep learning model construction',
  'hero.profile.stack': 'Flask, Dify, LangGraph, Spring AI, vLLM, Vue, MySQL, OSS',
  'hero.profile.status': 'Internships and postgraduate study',
  'hero.profile.based': 'Guangzhou / Shenzhen',

  'phl.eyebrow': 'Development Philosophy',
  'phl.t1': 'First principles,',
  'phl.t2': 'decomposed problems,',
  'phl.t3': 'and native AI citizenship.',
  'phl.p1.t': 'Ask the question before picking the tool',
  'phl.p1.d':
    'Decompose a requirement into the smallest unit that cannot be split further: what the inputs are, where each comes from, who makes the judgement, and how a failure rolls back. The tool comes last — not to use a model, but to remove human cost at one specific step.',
  'phl.p2.t': 'Write the boundaries into the system, not the docs',
  'phl.p2.d':
    'What a model may and may not do, how it recovers from failure, and where a human takes over must be hard constraints in code and workflow. A product that can be traced, interrupted and taken over is a product that can ship.',
  'phl.p3.t': 'Ship as an AI-native engineer',
  'phl.p3.d':
    'Treat the model as a dependable engineering dependency from day one: structured outputs, tool calling, retrieval augmentation, replayable evaluation and observability. Not AI bolted onto an old system — a system whose building blocks are model capabilities from the start.',
  'phl.tags': 'First Principles / AI-native / Engineering Discipline / End-to-End Ownership',

  'about.eyebrow': 'About Me',
  'about.title': 'Three things I work on',
  'about.c1.t': 'AI engineering systems',
  'about.c1.d':
    'Enterprise bidding agents and a government anti-poverty risk agent. Focused on the complete path from requirement to delivery, not just the model-call layer.',
  'about.c2.t': 'Healthcare software',
  'about.c2.d':
    'A geriatric assessment system and a MoCA cognitive assessment with real-time EEG tagging. Software that has to run in a real ward, not only in a demo.',
  'about.c3.t': 'Deep learning research in neuroscience',
  'about.c3.d':
    'Taking the ICLR 2027 paper as a case study: opening the black box of EEG decoding models so their capabilities can be attributed quantitatively.',
  'about.p1':
    'Two fixed lines run through how I work. First, I decompose ambiguous requirements into traceable inputs, sources, confirmations and outputs. Second, I keep boundaries around model output — defining what the model may do, what evidence it needs, how it recovers, and where humans decide, before talking about how much efficiency it buys.',

  'cap.eyebrow': 'My Capabilities',
  'cap.title': 'A capability matrix organised by the AI delivery pipeline',

  'proj.eyebrow': 'Selected Projects',
  'proj.title': 'Selected work, each backed by checkable engineering evidence',
  'proj.filter.all': 'All',
  'proj.cases': 'cases',
  'proj.preview': 'Preview',

  'res.eyebrow': 'Research & Experience',
  'res.timeline': 'Experience Timeline',
  'res.research': 'Research & Publications',
  'res.detail': 'Read more →',

  'contact.eyebrow': 'GitHub & Contact',
  'contact.title': 'If you are building AI and software systems',
  'contact.p1':
    'I am looking for internships and campus hiring in AI engineering and backend roles, and always happy to talk about how AI systems land in production.',
  'contact.email': 'Email',
  'contact.phone': 'Phone',
  'contact.location': 'Location',
  'contact.location.v': 'Guangzhou, China',
  'contact.status': 'Status',
  'contact.status.v': 'Open to opportunities',

  'stack.graph': 'Stack Graph',
  'stack.detail': 'Detail',
  'stack.usedin': 'Used in',
  'stack.hint': 'Node size = how many projects use the tech · click a domain or tech for detail',
  'stack.inventory': 'Full Stack Inventory',
  'stack.domain': 'Domain',
  'stack.tech': 'Tech',

  'footer.tagline': 'AI Engineering',
  'footer.stack': 'Built with Vue 3 · Tailwind CSS · Mermaid',

  'lang.label': '中',
  'lang.title': 'Switch to Chinese',
}

const dicts: Record<Lang, Dict> = { zh, en }

/** 取当前语言的文案；缺失时回退到 key，便于发现漏翻。 */
export function t(key: string): string {
  const d = dicts[lang.value]
  return d[key] ?? dicts.zh[key] ?? key
}

/** 批量取文案，返回 reactive 对象（用于模板里解构） */
export function useI18n() {
  return {
    t,
    lang,
    isZh,
    setLang,
    /** 在模板里做语言切换（配合 <component :is> 或 v-if） */
    pick: (zhText: string, enText: string) => (lang.value === 'zh' ? zhText : enText),
  }
}
