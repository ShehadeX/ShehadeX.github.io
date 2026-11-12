<script setup lang="ts">
import { projects } from '@/data/projects'
import ProjectCard from '@/components/ProjectCard.vue'
import { asset } from '@/utils/asset'

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

const internships = [
  { name: '中国科学院深圳先进技术研究院', src: '/img/logos/siat.png' },
  { name: '中国电信数智科技有限公司', src: '/img/logos/mark-chinatelecom.png' },
  { name: '广电计量集团', src: '/img/logos/mark-grgt.png' },
]

const timeline = [
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
        class="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-3xl"
        style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 68%)"
      />
      <div
        class="pointer-events-none absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full opacity-[0.10] blur-3xl"
        style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 70%)"
      />

      <div class="relative mx-auto max-w-[1400px] px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
        <!-- intro + avatar -->
        <div class="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-14">
          <!-- prose intro -->
          <div class="max-w-[62ch]">
            <p class="font-mono text-[11px] tracking-[0.14em] text-ink-faint">
              AI ENGINEERING / AGENT / DEPLOYMENT
            </p>

            <h1 class="mt-5 text-[42px] leading-[1.06] sm:text-[62px]">
              <span class="display">I'm </span>
              <span class="marker text-claude">肖致浩</span>
              <span class="display"> Shehade</span>
            </h1>

            <p class="mt-7 text-[23px] leading-[1.5] text-ink sm:text-[27px]">
              我用 AI 与软件系统
              <br class="hidden sm:block" />
              <span class="squiggle">解决真实问题。</span>
            </p>

            <p class="mt-6 max-w-[52ch] text-[15px] leading-[1.85] text-ink-muted">
              <img
                src="/img/logos/gdut.png"
                alt="广东工业大学"
                class="mr-2 inline-block h-6 w-6 -translate-y-0.5 object-contain align-middle"
              />
              广东工业大学计算机科学与技术 · 2028 届 · GPA 3.6/5、专业前 5%。
              方向是机器学习、Agent 开发与前沿部署——把业务需求拆成可追踪的流程，用模型与工程把流程真正跑起来。
            </p>

            <!-- 三个关键点：大标题 -->
            <div class="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-3">
              <div>
                <p class="display tnum text-[46px] leading-none text-ink">5</p>
                <p class="mt-2.5 text-[15px] font-semibold text-ink">
                  交付的<span class="marker">生产级系统</span>
                </p>
                <p class="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  招投标、老年评估、脑电打标、防返贫 Agent、用药小程序
                </p>
              </div>
              <div>
                <p class="display tnum text-[46px] leading-none text-ink">3</p>
                <p class="mt-2.5 text-[15px] font-semibold text-ink">段实习</p>
                <p class="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  中国科学院先进院 · 中国电信数智 · 广电计量
                </p>
                <div class="mt-3 flex items-center gap-3">
                  <img
                    v-for="l in internships"
                    :key="l.src"
                    :src="l.src"
                    :alt="l.name"
                    class="h-9 w-auto max-w-[72px] shrink-0 object-contain object-left"
                  />
                </div>
              </div>
              <div>
                <p class="display tnum text-[46px] leading-none text-ink">ICLR</p>
                <p class="mt-2.5 text-[15px] font-semibold text-ink">
                  2027 论文 · <span class="marker">第二作者</span>
                </p>
                <p class="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  跨架构 EEG 解码诊断基准，当前 Rebuttal 阶段
                </p>
              </div>
            </div>

            <div class="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="mailto:2912698300@qq.com"
                class="inline-flex h-10 items-center rounded-[3px] bg-claude px-5 font-mono text-[12px] text-base text-white transition-colors duration-150 hover:bg-claude-deep"
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
          <div class="lg:sticky lg:top-20 lg:w-[320px]">
            <div
              class="overflow-hidden rounded-[15px] border border-ink/15 bg-raised"
            >
              <img
                :src="asset('/img/profile/avatar.webp')"
                alt="肖致浩"
                width="1024"
                height="1024"
                class="aspect-square w-full object-cover"
              />
              <div class="border-t border-ink/12 bg-base px-4 py-3">
                <p class="font-mono text-[11px] text-ink-muted">肖致浩 / Xiaozhihao Shehade</p>
                <p class="mt-1 font-mono text-[10.5px] text-ink-faint">@ShehadeX</p>
              </div>
            </div>
          </div>
        </div>

        <!-- headline -->
        <h2 class="mt-16 max-w-[20ch] text-[40px] leading-[1.08] sm:text-[56px] lg:text-[60px]">
          <span class="display">AI Engineering.<br /></span>
          <span class="display">Software Systems.<br /></span>
          <span class="display text-ink-muted">Research.</span>
        </h2>

        <p class="mt-7 max-w-[58ch] text-[15px] leading-relaxed text-ink-body sm:text-[16px]">
          从业务问题出发，设计并实现 AI 驱动的软件系统，探索深度学习与智能体的实际应用。
        </p>

        <div class="mt-8 flex flex-wrap gap-2">
          <span class="tag">AI Agent</span>
          <span class="tag">Full-stack</span>
          <span class="tag">Deep Learning</span>
          <span class="tag">Deployment</span>
        </div>
      </div>
    </section>

    <!-- ============ 01 ABOUT ============ -->
    <section id="about" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">01</span>
          <span class="eyebrow">About Me</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h2 class="max-w-[20ch] text-[30px] leading-[1.25] sm:text-[38px]">
              我在做的<span class="marker">三件事</span>
            </h2>
            <div class="mt-8 space-y-8">
              <div>
                <p class="text-[19px] font-semibold text-ink">AI 工程系统</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  企业招投标智能体、政府场景防返贫风险识别 Agent。关注从需求到交付的完整链路，而不是只做模型调用的那一层。
                </p>
              </div>
              <div>
                <p class="text-[19px] font-semibold text-ink">医疗健康软件</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  老年综合评估系统、MoCA 认知评估与脑电实时打标。软件要能在真实病房里跑，而不是只在演示环境里跑。
                </p>
              </div>
              <div>
                <p class="text-[19px] font-semibold text-ink">神经科学方向的深度学习研究</p>
                <p class="mt-2 text-[14.5px] leading-[1.8] text-ink-muted">
                  以 ICLR 2027 论文为例，尝试把 EEG 解码模型的「黑盒」打开，让能力来源可被量化归因。
                </p>
              </div>
            </div>
            <p class="mt-9 text-[15px] leading-[1.85] text-ink-body">
              我的工作方式有两条固定的线。第一条是把模糊需求拆成可追踪的输入、来源、确认与输出；
              第二条是对模型输出保持边界意识——先定义模型可以做范围、证据要求、失败恢复方式与人工决策点，
              再谈它能带来多少提效。
            </p>
          </div>

          <div class="self-start overflow-hidden rounded-[15px] border border-ink/12 bg-base">
            <div class="border-b border-ink/10 bg-raised px-5 py-3">
              <p class="eyebrow">Toolbox</p>
            </div>
            <dl class="divide-y divide-ink/10">
              <div class="px-5 py-4">
                <dt class="text-[13px] font-semibold text-ink">AI 开发与编排</dt>
                <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  Codex / Claude / Cursor / DeepSeek Harness 协同开发，Dify + LangGraph 把构想转成稳定 Workflow。
                </dd>
              </div>
              <div class="px-5 py-4">
                <dt class="text-[13px] font-semibold text-ink">部署与运维</dt>
                <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  Docker + K8s + ECS 交付上线，GPT-Dots 做 24 小时监控与自动构建。
                </dd>
              </div>
              <div class="px-5 py-4">
                <dt class="text-[13px] font-semibold text-ink">应用架构</dt>
                <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  Vue 3 / TypeScript / Spring Boot / Flask / Python / Electron。
                </dd>
              </div>
              <div class="px-5 py-4">
                <dt class="text-[13px] font-semibold text-ink">知识管理</dt>
                <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  Notion + Obsidian + Zotero 托管 idea 与文献，Git 记录同步进知识图谱。
                </dd>
              </div>
              <div class="px-5 py-4">
                <dt class="text-[13px] font-semibold text-ink">模型与多模态</dt>
                <dd class="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  阿里云 Qwen OCR、火山引擎 TTS/ASR、聚合平台接入 GPT-image / Nano Banana 多模态模型。
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 02 CAPABILITIES ============ -->
    <section id="capabilities" class="scroll-mt-20 border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <div class="flex items-baseline gap-4">
          <span class="claude-num">02</span>
          <span class="eyebrow">My Capabilities</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[24ch] text-[30px] leading-[1.2] sm:text-[38px]">
          按 AI 开发流程组织的<span class="marker">能力矩阵</span>
        </h2>

        <div class="mt-10 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 sm:grid-cols-2">
          <div
            v-for="(c, i) in capabilities"
            :key="c.key"
            class="bg-base p-6 transition-colors duration-150 hover:bg-raised sm:p-8"
          >
            <div class="flex items-baseline gap-3">
              <span class="font-mono text-[11px] text-ink-faint">0{{ i + 1 }}</span>
              <h3 class="text-[24px]">{{ c.key }}</h3>
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
          <span class="claude-num">03</span>
          <span class="eyebrow">Selected Projects</span>
          <span class="rule flex-1" />
        </div>

        <h2 class="mt-8 max-w-[26ch] text-[30px] leading-[1.2] sm:text-[38px]">
          精选项目，<span class="squiggle">每项都有可核查的工程证据</span>
        </h2>

        <div class="mt-12 grid gap-x-10 gap-y-14 sm:grid-cols-2">
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
          <span class="claude-num">04</span>
          <span class="eyebrow">Research &amp; Experience</span>
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
                class="claude-link mt-3 inline-block font-mono text-[11px] transition-transform duration-150 group-hover:translate-x-0.5"
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
                :class="i === 0 ? 'bg-claude' : ''"
              />
              <span v-if="i < timeline.length - 1" class="absolute left-[3px] top-[18px] h-full w-px bg-ink/12" />
              <p class="font-mono text-[11px] tracking-[0.08em] text-ink-faint">{{ t.period }}</p>
              <div class="mt-2 flex items-start gap-3">
                <img
                  v-if="t.logo"
                  :src="t.logo"
                  :alt="t.org"
                  class="mt-0.5 h-10 w-auto max-w-[72px] shrink-0 object-contain object-left"
                />
                <div class="min-w-0">
                  <h3 class="text-[16px] leading-snug">
                    <span class="star mr-1" aria-hidden="true">✳</span>{{ t.org }}
                  </h3>
                  <p class="mt-1 text-[13px] text-ink-muted">{{ t.role }}</p>
                </div>
              </div>
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
          <span class="claude-num">05</span>
          <span class="eyebrow">GitHub &amp; Contact</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 class="text-[30px] leading-[1.2] sm:text-[36px]">
              如果你在做<br /><span class="marker">AI 与软件系统</span>
            </h2>
            <p class="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
              我正在寻找 AI 工程、Agent 开发与前沿部署方向的实习与校招机会。
              简历、系统截图与项目文档可以提供完整版本。
            </p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:2912698300@qq.com"
                class="inline-flex h-10 items-center rounded-[3px] bg-claude px-5 font-mono text-[12px] text-base text-white transition-colors duration-150 hover:bg-claude-deep"
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
                <dd class="text-[14px] text-ink">机器学习 · Agent 开发 · 前沿部署</dd>
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