<script setup lang="ts">
import { projects } from '@/data/projects'
import ProjectCard from '@/components/ProjectCard.vue'

const capabilities = [
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
]

const timeline = [
  {
    period: '2026.07 – 至今',
    org: '中国科学院深圳先进技术研究所 · 神经接口实验室',
    role: '实习生',
    points: [
      '在深圳市第二人民医院合作病房实际采集人体数据',
      '开发专用脑电打标软件与解码模型',
      '以第二作者身份推进 ICLR 2027 论文（当前 Rebuttal 阶段）',
      '打标软件已在三家三甲医院测试 20+ 患者数据并申请软著',
    ],
  },
  {
    period: '2026.06 – 07',
    org: '中电信数智科技有限公司 · 海南分公司研发中心',
    role: '实习生',
    points: [
      '设计海南省「防返贫」大模型原型，负责功能研发与测试',
      '本地化部署千问 3.6 量化模型，构建 Dify / Spring AI E2E 工作流',
      '实现多模态文件输入与带证据的推理输出',
    ],
  },
  {
    period: '2026.04 – 12',
    org: '广电计量集团 · 广州总部计量事业部',
    role: '实习生',
    points: [
      '全链路全栈开发：拆解业务需求、开发并测试全套代码、部署生产与后续调优',
      '实现招投标智能体，构建企业多模态知识库',
      '通过简化流程 + 动态调优实现低 TPS 与内存约束下的快速内容产出',
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
]

const research = [
  {
    title: 'Dissecting the Score — ICLR 2027',
    desc: '以神经生理学为共同参照的跨架构诊断基准：固定 adapter / 骨干 / readout，对输入施加八种预注册协议，揭示标量分数掩盖的重复性模式——预测依赖粗结构、对细结构响应微弱。',
    tag: 'Under Review',
    to: '/research',
    accent: true,
  },
  {
    title: '软件著作权 · 脑电事件打标软件',
    desc: '已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院完成临床测试并提交登记申请，20ms 级实时打标。',
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
]
</script>

<template>
  <div>
    <!-- ============ HERO ============ -->
    <section class="relative overflow-hidden border-b border-ink/10">
      <div class="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <div class="pointer-events-none absolute inset-0 noise opacity-40" />

      <div class="relative mx-auto max-w-[1400px] px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
        <!-- terminal bar -->
        <div class="term overflow-hidden rounded-[3px] border border-ink/15">
          <div
            class="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px]"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span class="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span class="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span class="term-dim ml-2">~/portfolio — zsh</span>
          </div>
          <div class="px-4 py-4 sm:px-5 sm:py-5">
            <p class="term-prompt">$</p>
            <p class="term-cmd">whoami</p>
            <p class="term-dim mt-1">肖致浩 — 机器学习 / Agent 开发 / 前沿部署</p>
          </div>
        </div>

        <!-- headline -->
        <h1 class="mt-12 max-w-[20ch] text-[44px] leading-[1.05] sm:text-[64px] lg:text-[68px]">
          AI Engineering.<br />
          Software Systems.<br />
          <span class="text-ink-muted">Research.</span>
        </h1>

        <p class="mt-7 max-w-[58ch] text-[15px] leading-relaxed text-ink-body sm:text-[16px]">
          从业务问题出发，设计并实现 AI 驱动的软件系统，探索深度学习与智能体的实际应用。
        </p>

        <div class="mt-8 flex flex-wrap gap-2">
          <span class="tag">AI Agent</span>
          <span class="tag">Full-stack</span>
          <span class="tag">Deep Learning</span>
          <span class="tag">Deployment</span>
        </div>

        <div class="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[12px] text-ink-faint">
          <span>广东工业大学 · 计算机科学与技术 · 2028 届</span>
          <span class="hidden h-3 w-px bg-ink/20 sm:block" />
          <span>GPA 3.6/5 · 综测 86/100 · 专业前 5%</span>
        </div>
      </div>
    </section>

    <!-- ============ 01 ABOUT ============ -->
    <section id="about" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">01 / About Me</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p class="text-[17px] leading-[1.75] text-ink-body">
              我是肖致浩，广东工业大学计算机科学与技术专业 2028 届学生，方向是
              <span class="text-ink">机器学习、Agent 开发与前沿部署</span>。
              目前在三个方向并行推进：AI 工程系统（招投标智能体、政府场景风险识别 Agent）、
              医疗健康软件（老年综合评估、MoCA 认知评估与脑电打标）、
              以及神经科学方向的深度学习研究。
            </p>
            <p class="mt-6 text-[15px] leading-[1.8] text-ink-muted">
              我的工作方式有两条固定的线。第一条是把模糊需求拆成可追踪的输入、来源、确认与输出；
              第二条是对模型输出保持边界意识——先定义模型可以做范围、证据要求、失败恢复方式与人工决策点，
              再谈它能带来多少提效。
            </p>
            <p class="mt-6 text-[15px] leading-[1.8] text-ink-muted">
              我偏爱在真实约束里做工程：内网模型端点、医院病房里的串口设备、
              评审中心的门禁格式检查。这些环境会直接告诉你设计哪里站不住。
            </p>
          </div>

          <div class="term overflow-hidden rounded-[3px] border border-ink/15 self-start">
            <div class="border-b border-white/10 px-3 py-2 text-[11px] term-dim">~/stack — zsh</div>
            <div class="px-4 py-4 text-[12.5px] leading-[1.85]">
              <p><span class="term-prompt">$</span> <span class="term-cmd">cat stack.txt</span></p>
              <p class="mt-2 term-dim"># AI 开发与编排</p>
              <p>Codex Pro+ / Claude Plus — 多项目并行高速开发</p>
              <p>Dify + LangGraph — 构想转稳定 Workflow</p>
              <p class="mt-2 term-dim"># 部署与运维</p>
              <p>Docker + ECS + GPTDots — 快速上线与 24H 运维</p>
              <p class="mt-2 term-dim"># 应用架构</p>
              <p>Vue + UniApp + Node.js + Flask + Spring Boot</p>
              <p class="mt-2 term-dim"># 知识管理</p>
              <p>Notion + Obsidian + Zotero — idea 与文献托管</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 02 CAPABILITIES ============ -->
    <section id="capabilities" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">02 / My Capabilities</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[24ch] text-[28px] leading-[1.2] sm:text-[33px]">
          按 AI 开发流程组织的能力矩阵
        </h2>

        <div class="mt-10 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 sm:grid-cols-2">
          <div
            v-for="(c, i) in capabilities"
            :key="c.key"
            class="bg-base p-6 transition-colors duration-150 hover:bg-raised sm:p-8"
          >
            <div class="flex items-baseline gap-3">
              <span class="font-mono text-[11px] text-ink-faint">0{{ i + 1 }}</span>
              <h3 class="text-[20px]">{{ c.key }}</h3>
            </div>
            <p class="mt-3 text-[14px] leading-relaxed text-ink-muted">{{ c.desc }}</p>
            <div class="mt-5 flex flex-wrap gap-1.5">
              <span v-for="t in c.items" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 03 PROJECTS ============ -->
    <section id="projects" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">03 / Selected Projects</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[26ch] text-[28px] leading-[1.2] sm:text-[33px]">
          精选项目，每项都有可核查的工程证据
        </h2>

        <div class="mt-12 space-y-16 sm:space-y-20">
          <div v-for="(p, i) in projects" :key="p.slug" class="fade-up">
            <div class="mb-5 flex items-baseline gap-4">
              <span class="font-mono text-[11px] tracking-[0.12em] text-ink-faint">
                {{ p.case }} / {{ p.domain }}
              </span>
              <span class="rule flex-1" />
            </div>
            <ProjectCard :project="p" :index="i" />
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 04 RESEARCH & EXPERIENCE ============ -->
    <section id="research" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">04 / Research &amp; Experience</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <!-- research cards -->
          <div class="space-y-px overflow-hidden rounded-[15px] bg-ink/12">
            <RouterLink
              v-for="r in research"
              :key="r.title"
              :to="r.to"
              class="group block bg-base p-6 transition-colors duration-150 hover:bg-raised"
            >
              <div class="flex items-start justify-between gap-4">
                <h3 class="text-[16px] leading-snug">{{ r.title }}</h3>
                <span class="tag shrink-0">{{ r.tag }}</span>
              </div>
              <p class="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{{ r.desc }}</p>
              <span
                class="mt-3 inline-block font-mono text-[11px] text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
              >
                查看详情 →
              </span>
            </RouterLink>
          </div>

          <!-- experience timeline -->
          <div>
            <div v-for="(t, i) in timeline" :key="t.org" class="relative pb-8 pl-7 last:pb-0">
              <span
                class="absolute left-0 top-[6px] h-2 w-2 rounded-[1px] bg-ink/45"
                :class="i === 0 ? 'bg-accent' : ''"
              />
              <span v-if="i < timeline.length - 1" class="absolute left-[3px] top-[18px] h-full w-px bg-ink/12" />
              <p class="font-mono text-[11px] tracking-[0.08em] text-ink-faint">{{ t.period }}</p>
              <h3 class="mt-1.5 text-[16px] leading-snug">{{ t.org }}</h3>
              <p class="mt-1 text-[13px] text-ink-muted">{{ t.role }}</p>
              <ul class="mt-3 space-y-1.5">
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
      </div>
    </section>

    <!-- ============ 05 CONTACT ============ -->
    <section id="contact" class="scroll-mt-20">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">05 / GitHub &amp; Contact</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 class="text-[28px] leading-[1.2] sm:text-[33px]">
              如果你在做<br />AI 与软件系统
            </h2>
            <p class="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
              我正在寻找 AI 工程、Agent 开发与前沿部署方向的实习与校招机会。
              简历、系统截图与项目文档可以提供完整版本。
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:2912698300@qq.com"
                class="inline-flex h-10 items-center rounded-[3px] bg-overlay px-5 font-mono text-[12px] text-base transition-opacity duration-150 hover:opacity-90"
              >
                发邮件给我
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

          <div class="term overflow-hidden rounded-[3px] border border-ink/15 self-start">
            <div class="border-b border-white/10 px-3 py-2 text-[11px] term-dim">~/contact — zsh</div>
            <div class="px-4 py-4 text-[12.5px] leading-[1.9]">
              <p><span class="term-prompt">$</span> <span class="term-cmd">cat contact.txt</span></p>
              <p class="mt-2 term-dim">name</p>
              <p>肖致浩 / Xiaozhihao Shehade</p>
              <p class="mt-2 term-dim">role</p>
              <p>机器学习 · Agent 开发 · 前沿部署</p>
              <p class="mt-2 term-dim">email</p>
              <p>2912698300@qq.com</p>
              <p class="mt-2 term-dim">phone</p>
              <p>13728860925</p>
              <p class="mt-2 term-dim">github</p>
              <p>github.com/ShehadeX</p>
              <p class="mt-2 term-dim">education</p>
              <p>广东工业大学 · 计算机科学与技术 · 2028 届</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>