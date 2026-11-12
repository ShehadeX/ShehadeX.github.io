<script setup lang="ts">
import ProjectCard from '@/components/ProjectCard.vue'
import { asset } from '@/utils/asset'
import ParallaxBackdrop from '@/components/ParallaxBackdrop.vue'
import StackGraph from '@/components/StackGraph.vue'
import { stackCategories, allStackItems } from '@/data/stack'
import { stackCategoriesEn } from '@/data/stack.en'
import {
  projectFiltersEn,
  capabilitiesEn,
  timelineEn,
  researchEn,
} from '@/data/home.en'
import { useLocalizedProjects } from '@/composables/useLocalizedProjects'
import { t, lang } from '@/composables/useI18n'
import { computed, ref } from 'vue'

const { all: projects } = useLocalizedProjects()

/** 切换语言时重新取本地化数据 */
const zhOnly = {
  projectFilters: [
    { key: 'all', label: 'All Cases' },
    { key: 'AI SYSTEMS', label: 'AI Systems' },
    { key: 'MEDICAL SOFTWARE', label: 'Medical' },
    { key: 'NEURO / SIGNAL', label: 'Neuro / Signal' },
    { key: 'AI AGENT', label: 'Agent' },
    { key: 'HEALTHCARE', label: 'Healthcare' },
  ],
  capabilities: [
    {
      key: 'AI Agent',
      desc: 'ReactAgent / LangGraph / Spring AI Agent Framework，工具注册、模型选工具、上下文总结与证据绑定推理输出。',
      items: ['Agent 编排', 'MCP Tools', 'RAG', '多模态 VL'],
    },
    {
      key: 'Full-stack',
      desc: 'Vue 3 + TypeScript 前端，Flask / Spring Boot 后端，MySQL / SQLite 持久化，Docker 与 ECS 部署运维。',
      items: ['Vue 3', 'Spring Boot', 'Flask', 'Docker'],
    },
    {
      key: 'Deep Learning',
      desc: '脑电信号采集与事件打标、认知评估范式设计，实验室真实数据上的信号处理与模型解码。',
      items: ['脑电打标', '实验范式', '信号处理', '模型解码'],
    },
    {
      key: 'Deployment',
      desc: '本地端到端成稿与模型服务部署，量化模型本地化，敏感数据不出内网，兼顾成本与响应性能。',
      items: ['量化部署', '性能调优', '成本控制', '内网合规'],
    },
  ],
  timeline: [
    {
      period: '2026.07.16 – 至今',
      org: '中国科学院深圳先进技术研究院 · 神经接口实验室',
      role: '科研软件开发实习生',
      logo: '/img/logos/siat.png',
      points: [
        '与深圳第二人民医院神经接口科合作采集患者 SEEG 数据，覆盖认知任务、MI 运动想象与 Seize 癫痫任务',
        '把 MoCA 阿兹海默认知系统从实验室推向病房，通过真实患者测试迭代实验范式，降低非刺激因素干扰',
        '以第二作者合作完成 ICLR 2027 论文：Stage1 冻结 4 个 backbone、8 个数据集构建 adapter，Stage2 用时间/空间/频域/微事件扰动实现模型「开盒」',
        '打标软件已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院测试 20+ 患者数据并申请软著',
      ],
    },
    {
      period: '2026.07.06 – 2026.07.31',
      org: '中国电信数智科技有限公司 · 海南分公司研发中心',
      role: 'AI 应用研发实习生',
      logo: '/img/logos/mark-chinatelecom.png',
      points: [
        '设计海南省「防返贫」大模型原型，负责功能研发与测试',
        '基于 Spring AI 对接内网模型服务，ReactAgent 编排工具注册、模型选工具与上下文总结',
        '调用本地部署 Qwen VL 处理多模态农户材料，输出 schema 约束返回值，保证决策阶段不丢数据、不误判',
        '以 Dify 串联材料识别、字段归一化、规则初判与报告生成，全部数据在内网闭环',
      ],
    },
    {
      period: '2026.04.01 – 2026.12.01',
      org: '广电计量集团 · 广州总部计量事业部',
      role: '实习生',
      logo: '/img/logos/mark-grgt.png',
      points: [
        '全链路全栈开发：拆解业务需求、开发并测试全套代码、部署生产与后续调优',
        '用 python-docx 抽取结构化信息并调用 LLM 标注原始格式，把「复制粘贴」变成代码化的一次成稿',
        '分析 23 份历史人工稿件构建材料图谱与知识库一二级分类，生成时按项目精准召回资质、法律与业绩信息',
        '用 JSON 定义 OOXML 格式的 harness、企业主体提示词注入与负面提示词抑制模型幻觉',
        '最终以 Docker 打包并通过 K8s 交付甲方主机，保留开发手稿、维护注释与测试入口',
      ],
    },
    {
      period: '2025.09 – 2026.02',
      org: '大云屋工作室众创平台',
      role: '软件开发组成长',
      points: [
        '带领多个项目并行推进，排布成员任务，管理实验室服务器',
        '对接多位导师，承接横向开发、纵向研究与产教融合任务',
        '参与协商会议与合同签订',
      ],
    },
  ],
  research: [
    {
      title: 'Dissecting the Score — ICLR 2027',
      desc: '以神经生理学为共同参照的跨架构诊断基准：固定 adapter / 骨干 / readout，对输入施加八种预注册协议，揭示标量分数掩盖的重复性模式——预测依赖粗结构、对细结构响应微弱。',
      tag: 'Under Review',
      to: '/research',
      accent: true,
    },
    {
      title: '软件著作权 · 脑电事件打标软件',
      desc: '已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院完成临床测试并提交登记申请，20ms 级实时打标，43 个精细化打标点。',
      tag: 'Filed',
      to: '/project/moca',
      accent: false,
    },
    {
      title: '开源与工程实践',
      desc: '基于芋道（yudao）微服务体系搭建老年综合评估平台，沉淀量表引擎与多模块 AI 能力到工程主干。',
      tag: 'Engineering',
      to: '/project/cga-smart',
      accent: false,
    },
    {
      title: '脑电数据的跨域情绪识别算法',
      desc: '组长与开发者。从冻结骨干到部分解冻、全量训练与更换下游分类头多轮尝试，引入 SEED 等数据集补全小样本训练量，三折 BACC 从 65.3% 提升到 78.6%。',
      tag: 'Research',
      to: '/project/moca',
      accent: false,
    },
  ],
}

const isEn = computed(() => lang.value === 'en')
const projectFilters = computed(() => (isEn.value ? projectFiltersEn : zhOnly.projectFilters))
const capabilities = computed(() => (isEn.value ? capabilitiesEn : zhOnly.capabilities))
const timeline = computed(() => (isEn.value ? timelineEn : zhOnly.timeline))
const research = computed(() => (isEn.value ? researchEn : zhOnly.research))
const stackCats = computed(() => (isEn.value ? stackCategoriesEn : stackCategories))

const activeFilter = ref('all')

const filteredProjects = computed(() =>
  activeFilter.value === 'all'
    ? projects.value
    : projects.value.filter((p: { domain: string }) => p.domain === activeFilter.value),
)

const internships = [
  { name: '中国科学院深圳先进技术研究院', src: '/img/logos/siat.png' },
  { name: '中国电信数智科技有限公司', src: '/img/logos/mark-chinatelecom.png' },
  { name: '广电计量集团', src: '/img/logos/mark-grgt.png' },
]

</script>

<template>
  <div>
    <!-- ============ HERO ============ -->
    <section class="relative overflow-hidden border-b border-ink/10">
      <div class="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <div class="pointer-events-none absolute inset-0 noise opacity-40" />
      <!-- Claude 风格暖橙光晕 -->
      <div
        class="drift gpu pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-3xl"
        style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 68%)"
      />
      <div
        class="drift gpu pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full opacity-[0.10] blur-3xl"
        style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 70%); animation-delay: -9s"
      />

      <div class="relative mx-auto max-w-[1400px] px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
        <!-- intro + avatar -->
        <div
          class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-stretch lg:gap-14"
        >
          <!-- prose intro -->
          <div class="flex flex-col">
            <p class="font-mono text-[11px] tracking-[0.14em] text-ink-faint rise rise-1">
              {{ t('hero.eyebrow') }}
            </p>

            <h1 class="mt-5 text-[42px] leading-[1.06] sm:text-[62px]">
              <span class="display rise rise-2">I'm </span>
              <span class="marker marker-reveal text-claude rise rise-2">{{ t('hero.name.cn') }}</span>
              <span class="display rise rise-2"> Shehade</span>
            </h1>

            <p class="mt-7 max-w-[20ch] text-[23px] leading-[1.4] text-ink sm:text-[27px]">
              <span class="rise rise-3">{{ t('hero.tagline') }}</span>
            </p>

            <p class="mt-6 max-w-[52ch] text-[15px] leading-[1.85] text-ink-muted">
              <img
                src="/img/logos/gdut.png"
                alt="广东工业大学"
                class="mr-2 inline-block h-6 w-6 -translate-y-0.5 object-contain align-middle"
              />
              {{ t('hero.school') }}
              {{ t('hero.school2') }}
            </p>

            <!-- 三个关键点：置于左栏，与右侧头像/profile 栏底部对齐 -->
            <div
              class="mt-8 grid gap-x-7 gap-y-6 border-t border-ink/12 pt-7 sm:grid-cols-3"
            >
              <div>
                <p class="display tnum text-[40px] leading-none text-ink">5</p>
                <p class="mt-2 text-[14.5px] font-semibold text-ink">
                  {{ t('hero.m1.title') }}
                </p>
                <p class="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                  {{ t('hero.m1.desc') }}
                </p>
              </div>
              <div>
                <p class="display tnum text-[40px] leading-none text-ink">3</p>
                <p class="mt-2 text-[14.5px] font-semibold text-ink">{{ t('hero.m2.title') }}</p>
                <p class="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                  {{ t('hero.m2.desc') }}
                </p>
                <div class="mt-3 flex items-center gap-2.5">
                  <img
                    v-for="l in internships"
                    :key="l.src"
                    :src="l.src"
                    :alt="l.name"
                    class="h-7 w-auto max-w-[54px] shrink-0 object-contain object-left"
                  />
                </div>
              </div>
              <div>
                <p class="display tnum text-[40px] leading-none text-ink">ICLR</p>
                <p class="mt-2 text-[14.5px] font-semibold text-ink">
                  {{ t('hero.m3.title') }}
                </p>
                <p class="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                  {{ t('hero.m3.desc') }}
                </p>
              </div>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-3 lg:mt-auto lg:pt-8">
              <a
                href="mailto:2912698300@qq.com"
                class="inline-flex h-10 items-center rounded-[3px] bg-claude px-5 font-mono text-[12px] text-base text-white transition-colors duration-150 hover:bg-claude-deep"
              >
                {{ t('hero.cta.mail') }}
              </a>
              <a
                href="https://github.com/ShehadeX"
                target="_blank"
                rel="noopener"
                class="inline-flex h-10 items-center rounded-[3px] border border-ink/20 px-5 font-mono text-[12px] text-ink transition-colors duration-150 hover:bg-raised"
              >
                GitHub ↗
              </a>
              <a
                href="https://gitee.com/ShehadeX"
                target="_blank"
                rel="noopener"
                class="inline-flex h-10 items-center rounded-[3px] border border-ink/20 px-5 font-mono text-[12px] text-ink transition-colors duration-150 hover:bg-raised"
              >
                Gitee ↗
              </a>
            </div>
          </div>

          <!-- avatar -->
          <div class="relative flex flex-col lg:justify-self-end lg:justify-between">
            <!-- 橙色手绘感光晕 -->
            <div
              class="drift gpu pointer-events-none absolute -inset-6 -z-10 rounded-[28px] opacity-[0.18] blur-2xl"
              style="background: radial-gradient(circle at 62% 38%, #d97757 0%, rgba(217,119,87,0) 62%)"
            />
            <div
              class="gpu overflow-hidden rounded-[15px] border border-ink/15 bg-raised shadow-[0_18px_48px_-24px_rgba(32,31,29,0.45)]"
            >
              <img
                :src="asset('/img/profile/avatar.webp')"
                alt="肖致浩"
                width="1024"
                height="1024"
                class="aspect-square w-full object-cover"
              />
              <div class="flex items-center justify-between gap-3 border-t border-ink/12 bg-base px-4 py-3">
                <div class="min-w-0">
                  <p class="font-mono text-[11px] text-ink-muted">肖致浩 / Xiaozhihao Shehade</p>
                  <p class="mt-1 font-mono text-[10.5px] text-ink-faint">@ShehadeX</p>
                </div>
                <span class="star shrink-0 text-[15px]" aria-hidden="true">✳</span>
              </div>
            </div>

            <!-- profile 字段 -->
            <dl class="mt-5 divide-y divide-ink/10 border-y border-ink/12 lg:mt-8">
              <div class="flex items-baseline gap-4 py-3">
                <dt class="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  focus
                </dt>
                <dd class="text-[13.5px] text-ink">{{ t('hero.profile.focus') }}</dd>
              </div>
              <div class="flex items-baseline gap-4 py-3">
                <dt class="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  stack
                </dt>
                <dd class="text-[13.5px] text-ink">{{ t('hero.profile.stack') }}</dd>
              </div>
              <div class="flex items-baseline gap-4 py-3">
                <dt class="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  status
                </dt>
                <dd class="flex items-center gap-2 text-[13.5px] text-ink">
                  <span class="pulse-dot h-1.5 w-1.5 rounded-full bg-claude" />
                  {{ t('hero.profile.status') }}
                </dd>
              </div>
              <div class="flex items-baseline gap-4 py-3">
                <dt class="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  based
                </dt>
                <dd class="text-[13.5px] text-ink">{{ t('hero.profile.based') }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- 开发哲学 -->
        <div class="mt-16 border-t border-ink/12 pt-10 sm:mt-20 sm:pt-12">
          <div class="flex items-baseline gap-4">
            <span class="claude-num">PHL</span>
            <span class="eyebrow">{{ t('phl.eyebrow') }}</span>
            <span class="rule flex-1" />
          </div>

          <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <h2
              class="text-[32px] leading-[1.16] sm:text-[42px] lg:text-[46px]"
            >
              <span class="display">{{ t('phl.t1') }}</span><br />
              <span class="display">{{ t('phl.t2') }}</span><br />
              <span class="display text-ink-muted">{{ t('phl.t3') }}</span>
            </h2>

            <div class="space-y-8">
              <div class="flex gap-5">
                <span class="claude-num shrink-0 pt-1.5">01</span>
                <div>
                  <p class="text-[18px] font-semibold text-ink">{{ t('phl.p1.t') }}</p>
                  <p class="mt-2 text-[14.5px] leading-[1.85] text-ink-muted">
                    {{ t('phl.p1.d') }}
                  </p>
                </div>
              </div>

              <div class="flex gap-5">
                <span class="claude-num shrink-0 pt-1.5">02</span>
                <div>
                  <p class="text-[18px] font-semibold text-ink">{{ t('phl.p2.t') }}</p>
                  <p class="mt-2 text-[14.5px] leading-[1.85] text-ink-muted">
                    {{ t('phl.p2.d') }}
                  </p>
                </div>
              </div>

              <div class="flex gap-5">
                <span class="claude-num shrink-0 pt-1.5">03</span>
                <div>
                  <p class="text-[18px] font-semibold text-ink">{{ t('phl.p3.t') }}</p>
                  <p class="mt-2 text-[14.5px] leading-[1.85] text-ink-muted">
                    {{ t('phl.p3.d') }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 pt-1">
                <span class="tag">First Principles</span>
                <span class="tag">AI-native</span>
                <span class="tag">Engineering Discipline</span>
                <span class="tag">End-to-End Ownership</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 01 ABOUT ============ -->
    <section id="about" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">01</span>
          <span class="eyebrow">{{ t('about.eyebrow') }}</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 class="max-w-[20ch] break-keep text-[30px] leading-[1.25] sm:text-[38px]">
              {{ t('about.title') }}
            </h2>
            <div class="mt-8 space-y-8">
              <div>
                <p class="text-[19px] font-semibold text-ink">{{ t('about.c1.t') }}</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  {{ t('about.c1.d') }}
                </p>
              </div>
              <div>
                <p class="text-[19px] font-semibold text-ink">{{ t('about.c2.t') }}</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  {{ t('about.c2.d') }}
                </p>
              </div>
              <div>
                <p class="text-[19px] font-semibold text-ink">{{ t('about.c3.t') }}</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  {{ t('about.c3.d') }}
                </p>
              </div>
            </div>
            <p class="mt-9 text-[15px] leading-[1.85] text-ink-body">
              {{ t('about.p1') }}
            </p>
          </div>

          <!-- 技术栈图谱：通栏 -->
          <div class="lg:col-span-2">
            <StackGraph />
          </div>
        </div>

        <!-- 技术栈清单：可展开的完整列表 -->
        <details class="group mt-8 overflow-hidden rounded-[15px] border border-ink/12 bg-base">
          <summary
            class="flex cursor-pointer items-center gap-3 border-b border-ink/10 bg-raised px-5 py-3.5 transition-colors duration-150 hover:bg-raised/70"
          >
            <span class="eyebrow">{{ t('stack.inventory') }}</span>
            <span class="font-mono text-[11px] text-ink-faint">
              {{ allStackItems.length }} {{ isEn ? 'technologies' : '项技术' }} ·
              {{ stackCategories.length }} {{ isEn ? 'domains' : '个领域' }}
            </span>
            <span
              class="ml-auto font-mono text-[11px] text-ink-muted transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
          </summary>
          <div class="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="c in stackCats" :key="c.id" class="bg-base p-5">
              <div class="flex items-baseline gap-2.5">
                <span class="claude-num">{{ String(c.items.length).padStart(2, '0') }}</span>
                <h3 class="text-[15px] font-semibold text-ink">{{ c.name }}</h3>
              </div>
              <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ c.caption }}</p>
              <ul class="mt-3.5 space-y-2">
                <li v-for="it in c.items" :key="it.id" class="text-[13px] leading-relaxed">
                  <span class="text-ink">{{ it.name }}</span>
                  <span class="text-ink-faint"> — {{ it.note }}</span>
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </section>

    <!-- ============ 02 CAPABILITIES ============ -->
    <section id="capabilities" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">02</span>
          <span class="eyebrow">{{ t('cap.eyebrow') }}</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[18ch] break-keep text-[30px] leading-[1.2] sm:text-[38px]">
          {{ t('cap.title') }}
        </h2>

        <div class="mt-10 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(c, i) in capabilities"
            :key="c.key"
            class="gpu-hover reveal flex flex-col bg-base p-6 transition-colors duration-150 hover:bg-raised sm:p-7"
          >
            <span class="claude-num">0{{ i + 1 }}</span>
            <h3 class="display mt-3 text-[25px] leading-tight">{{ c.key }}</h3>
            <p class="mt-3 flex-1 text-[13.5px] leading-[1.8] text-ink-muted">{{ c.desc }}</p>
            <div class="mt-5 flex flex-wrap gap-1.5">
              <span v-for="t in c.items" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 03 PROJECTS ============ -->
    <section id="projects" class="relative scroll-mt-20 border-b border-ink/10">
      <ParallaxBackdrop>
        <div
          class="pointer-events-none absolute right-[8%] top-[10%] h-[360px] w-[360px] rounded-full opacity-[0.07] blur-3xl"
          style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 70%)"
        />
      </ParallaxBackdrop>
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">03</span>
          <span class="eyebrow">{{ t('proj.eyebrow') }}</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[20ch] break-keep text-[30px] leading-[1.2] sm:text-[38px]">
          {{ t('proj.title') }}
        </h2>

        <div class="mt-8 flex flex-wrap items-center gap-2">
          <button
            v-for="f in projectFilters"
            :key="f.key"
            type="button"
            class="h-8 rounded-[3px] px-3 font-mono text-[11px] transition-colors duration-150"
            :class="
              activeFilter === f.key
                ? 'bg-overlay text-base'
                : 'border border-ink/15 text-ink-muted hover:bg-raised hover:text-ink'
            "
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
          <span class="ml-auto font-mono text-[11px] text-ink-faint">
            {{ filteredProjects.length }} / {{ projects.length }} cases
          </span>
        </div>

        <div class="mt-10 space-y-8">
          <div v-for="(p, i) in filteredProjects" :key="p.slug" class="fade-up">
            <ProjectCard :project="p" :index="i" />
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 04 RESEARCH & EXPERIENCE ============ -->
    <section id="research" class="relative scroll-mt-20 border-b border-ink/10">
      <ParallaxBackdrop>
        <div
          class="pointer-events-none absolute left-[4%] bottom-[12%] h-[320px] w-[320px] rounded-full opacity-[0.06] blur-3xl"
          style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 70%)"
        />
      </ParallaxBackdrop>
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">04</span>
          <span class="eyebrow">{{ t('res.eyebrow') }}</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-16">
          <!-- experience timeline -->
          <div>
            <p class="eyebrow">{{ t('res.timeline') }}</p>
            <div class="mt-6 space-y-0">
              <div
                v-for="(t, i) in timeline"
                :key="t.org"
                class="gpu-hover reveal relative border-t border-ink/12 pb-9 pl-8 pt-6 last:pb-0"
              >
                <span
                  class="absolute left-0 top-[30px] h-2 w-2 rounded-[1px] bg-ink/45"
                  :class="i === 0 ? 'bg-claude' : ''"
                />
                <span
                  v-if="i < timeline.length - 1"
                  class="absolute left-[3px] top-[42px] h-full w-px bg-ink/12"
                />
                <p class="font-mono text-[11px] tracking-[0.08em] text-ink-faint">
                  {{ t.period }}
                </p>
                <div class="mt-3 flex items-start gap-4">
                  <div
                    class="gpu flex h-12 w-12 shrink-0 items-center justify-center rounded-[3px] border border-ink/12 bg-base"
                  >
                    <img
                      v-if="t.logo"
                      :src="t.logo"
                      :alt="t.org"
                      class="h-8 w-auto max-w-[42px] object-contain"
                    />
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-[17px] leading-snug">
                      <span class="star mr-1" aria-hidden="true">✳</span>{{ t.org }}
                    </h3>
                    <p class="mt-1 text-[13px] text-ink-muted">{{ t.role }}</p>
                  </div>
                </div>
                <ul class="mt-4 space-y-2 pl-16">
                  <li
                    v-for="pt in t.points"
                    :key="pt"
                    class="relative pl-4 text-[13.5px] leading-relaxed text-ink-body"
                  >
                    <span
                      class="absolute left-0 top-[9px] h-[3px] w-[3px] rounded-[1px] bg-ink-faint"
                    />
                    {{ pt }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- research cards -->
          <div class="lg:justify-self-end lg:w-full">
            <p class="eyebrow">{{ t('res.research') }}</p>
            <div class="mt-6 space-y-3">
              <RouterLink
                v-for="r in research"
                :key="r.title"
                :to="r.to"
                class="gpu-hover reveal group block overflow-hidden rounded-[15px] border border-ink/12 bg-base p-5 transition-colors duration-150 hover:border-ink/25 hover:bg-raised/50"
              >
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-[16px] leading-snug">{{ r.title }}</h3>
                  <span class="tag shrink-0">{{ r.tag }}</span>
                </div>
                <p class="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{{ r.desc }}</p>
                <span
                  class="claude-link mt-3 inline-block font-mono text-[11px] transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  {{ t('res.detail') }}
                </span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 05 CONTACT ============ -->
    <section id="contact" class="scroll-mt-20">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">05</span>
          <span class="eyebrow">{{ t('contact.eyebrow') }}</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 class="max-w-[18ch] break-keep text-[30px] leading-[1.2] sm:text-[36px]">
              {{ t('contact.title') }}
            </h2>
            <p class="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
              {{ t('contact.p1') }}
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:2912698300@qq.com"
                class="inline-flex h-10 items-center rounded-[3px] bg-claude px-5 font-mono text-[12px] text-base text-white transition-colors duration-150 hover:bg-claude-deep"
              >
                {{ t('hero.cta.mail') }}
              </a>
              <a
                href="https://github.com/ShehadeX"
                target="_blank"
                rel="noopener"
                class="inline-flex h-10 items-center rounded-[3px] border border-ink/20 px-5 font-mono text-[12px] text-ink transition-colors duration-150 hover:bg-raised"
              >
                GitHub ↗
              </a>
            </div>
          </div>

          <div class="self-start overflow-hidden rounded-[15px] border border-ink/12 bg-base">
            <div class="border-b border-ink/10 bg-raised px-5 py-3">
              <p class="eyebrow">Contact</p>
            </div>
            <dl class="divide-y divide-ink/10">
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  NAME
                </dt>
                <dd class="text-[14px] text-ink">肖致浩 / Xiaozhihao Shehade</dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  ROLE
                </dt>
                <dd class="text-[14px] text-ink">{{ isEn ? 'Machine Learning · Agent Development · Frontier Deployment' : '机器学习 · Agent 开发 · 前沿部署' }}</dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  EMAIL
                </dt>
                <dd class="text-[14px] text-ink">
                  <a href="mailto:2912698300@qq.com" class="ul">2912698300@qq.com</a>
                </dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  PHONE
                </dt>
                <dd class="text-[14px] text-ink">13728860925</dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  GITHUB
                </dt>
                <dd class="text-[14px] text-ink">
                  <a href="https://github.com/ShehadeX" target="_blank" rel="noopener" class="ul">
                    github.com/ShehadeX
                  </a>
                </dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  GITEE
                </dt>
                <dd class="text-[14px] text-ink">
                  <a href="https://gitee.com/ShehadeX" target="_blank" rel="noopener" class="ul">
                    gitee.com/ShehadeX
                  </a>
                </dd>
              </div>
              <div class="flex items-baseline gap-4 px-5 py-3.5">
                <dt class="w-20 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
                  SCHOOL
                </dt>
                <dd class="text-[14px] text-ink">广东工业大学 · 计算机科学与技术 · 2028 届</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>