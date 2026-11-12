<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { researchPaper as p } from '@/data/research'
import MermaidDiagram from '@/components/MermaidDiagram.vue'

const pipeline = `flowchart LR
  subgraph SI["Stage I — 锁定状态"]
    AD[Adapter<br/>通道映射 + 幅度变换]
    BB["Backbone<br/>预训练骨干 (冻结)"]
    RO[Readout<br/>线性读出 (仅此训练)]
  end
  subgraph CAL["合成真值校准"]
    SYN[(Planted Ground Truth<br/>已知信号依赖)]
  end
  subgraph SII["Stage II — 单端诊断"]
    P1[8 个预注册协议<br/>输入侧物理干预]
    CTL[配对控制<br/>分离副作用]
  end
  subgraph PROF["响应画像"]
    RP[Response Profile<br/>标准化坐标 + 置信区间]
  end
  subgraph REF["下游改进"]
    MIR[镜像增强读出重拟合]
    TGT[骨干预训练具名目标]
  end
  AD --> BB --> RO
  P1 --> CTL
  CTL --> RP
  SYN -.校准.-> P1
  RO --> P1
  RP --> MIR
  RP --> TGT
  style SI fill:#DBD1C0,stroke:#454036,color:#201F1D
  style CAL fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style SII fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
  style PROF fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style REF fill:#DBD1C0,stroke:#454036,color:#201F1D
`
</script>

<template>
  <div>
    <!-- ================= PAPER HERO ================= -->
    <section class="border-b border-ink/10">
      <div class="relative overflow-hidden">
        <div class="pointer-events-none absolute inset-0 grid-lines opacity-70" />
        <div
          class="drift gpu pointer-events-none absolute -left-32 -top-32 h-[460px] w-[460px] rounded-full opacity-[0.14] blur-3xl"
          style="background: radial-gradient(circle, #d97757 0%, rgba(217,119,87,0) 68%)"
        />
        <div class="relative mx-auto max-w-[1400px] px-5 pb-14 pt-10 sm:px-8 sm:pb-20">
          <RouterLink
            to="/#research"
            class="inline-flex items-center gap-2 font-mono text-[12px] text-ink-faint transition-colors duration-150 hover:text-ink"
          >
            ← 返回首页
          </RouterLink>

          <div class="mt-8 flex flex-wrap items-center gap-2">
            <span class="tag border-accent/40 bg-accent/10 text-accent">{{ p.venue }}</span>
            <span class="tag">{{ p.status }}</span>
          </div>

          <h1 class="display mt-6 max-w-[20ch] text-[38px] leading-[1.08] sm:text-[52px]">
            {{ p.title }}<span class="text-ink-muted">.</span>
          </h1>
          <p class="mt-3 text-[19px] leading-snug text-ink-muted sm:text-[22px]">
            {{ p.subtitle }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[12px] text-ink-faint">
            <span>{{ p.authors }}</span>
            <span class="hidden h-3 w-px bg-ink/20 sm:block" />
            <span class="hidden h-3 w-px bg-ink/20 sm:block" />
            <a
              :href="p.pdf"
              target="_blank"
              rel="noopener"
              class="ul text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              下载 PDF ↗
            </a>
          </div>

          <p class="mt-10 max-w-[72ch] text-[15px] leading-[1.85] text-ink-body">{{ p.abstract }}</p>
        </div>
      </div>
    </section>

    <!-- ================= CONTRIBUTIONS ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Contributions</span>
          <span class="rule flex-1" />
        </div>
        <div class="mt-8 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 lg:grid-cols-3">
          <div v-for="c in p.contributions" :key="c.no" class="gpu-hover reveal bg-base p-6 sm:p-8">
            <span class="claude-num">{{ c.no }}</span>
            <h2 class="display mt-3 text-[19px] leading-snug">{{ c.title }}</h2>
            <p class="mt-3 text-[14px] leading-relaxed text-ink-muted">{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= PIPELINE ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Diagnostic Pipeline</span>
          <span class="rule flex-1" />
        </div>
        <p class="mt-6 max-w-[70ch] text-[15px] leading-[1.8] text-ink-body">
          两阶段解耦是整套方法的核心。Stage I 固定每个模型的 adapter、预训练骨干与 readout，
          所有读出用相同数据、相同形式与相同 checkpoint 规则拟合。
          Stage II 保持该路线不变，对原始输入施加八种预注册的干预，且不进行任何进一步训练。
        </p>
        <div class="mt-8">
          <MermaidDiagram :code="pipeline" id="research-pipeline" />
        </div>
      </div>
    </section>

    <!-- ================= SCOPE ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Evaluation Scope</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-8 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p class="eyebrow">Models Evaluated</p>
            <ul class="mt-4 space-y-1.5">
              <li
                v-for="m in p.models"
                :key="m"
                class="flex items-center gap-2.5 font-mono text-[14px] text-ink"
              >
                <span class="h-1.5 w-1.5 rounded-[1px] bg-claude" />
                {{ m }}
              </li>
            </ul>
            <p class="mt-6 text-[13px] leading-relaxed text-ink-faint">
              五个已发布模型，均在 frozen backbone + linear readout 的单一冻结态下评估。
            </p>
          </div>

          <div>
            <p class="eyebrow">Tasks</p>
            <div class="reveal mt-4 overflow-hidden rounded-[3px] bg-ink/12">
              <div
                v-for="t in p.tasks"
                :key="t.name"
                class="flex flex-wrap items-center gap-x-6 gap-y-2 bg-base px-4 py-3.5"
              >
                <span class="w-[38%] min-w-[140px] text-[14px] font-medium text-ink">
                  {{ t.name }}
                </span>
                <span class="font-mono text-[12px] text-ink-muted">{{ t.metric }}</span>
                <span class="font-mono text-[12px] text-ink-faint">chance {{ t.chance }}</span>
                <span class="text-[12.5px] text-ink-muted">{{ t.mechanism }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= PROTOCOLS ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Diagnostic Protocols</span>
          <span class="rule flex-1" />
        </div>
        <p class="mt-6 max-w-[70ch] text-[15px] leading-[1.8] text-ink-body">
          每个协议被形式化为六元组 <span class="font-mono text-[13px]">S = (q, z, P, K, O, g)</span>，
          分别指定问题、目标生理依赖、参数化干预族、参照与控制、响应规格与装配规则。
          八个协议覆盖 EEG 信号的三个物理维度，为不同架构提供共同的参照系。
        </p>

        <div class="mt-8 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 sm:grid-cols-2">
          <div v-for="pr in p.protocols" :key="pr.id" class="gpu-hover reveal bg-base p-6">
            <div class="flex items-center gap-3">
              <span class="rounded-[3px] bg-claude/15 px-1.5 py-0.5 font-mono text-[11px] text-claude-deep">
                {{ pr.id }}
              </span>
              <span class="text-[16px] font-semibold">{{ pr.name }}</span>
              <span class="ml-auto tag">{{ pr.dimension }}</span>
            </div>
            <dl class="mt-4 space-y-3 text-[13px] leading-relaxed">
              <div>
                <dt class="text-ink-faint">Question</dt>
                <dd class="mt-0.5 text-ink-body">{{ pr.question }}</dd>
              </div>
              <div>
                <dt class="text-ink-faint">Intervention</dt>
                <dd class="mt-0.5 font-mono text-[12px] text-ink-body">{{ pr.intervention }}</dd>
              </div>
              <div>
                <dt class="text-ink-faint">Paired Control</dt>
                <dd class="mt-0.5 text-ink-muted">{{ pr.control }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= FINDINGS ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Key Findings</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-8 grid gap-px overflow-hidden rounded-[15px] bg-ink/12 sm:grid-cols-2">
          <div v-for="f in p.findings" :key="f.label" class="gpu-hover reveal bg-base p-6 sm:p-8">
            <p class="display tnum text-[34px] font-bold leading-none text-ink sm:text-[40px]">
              {{ f.metric }}
            </p>
            <p class="mt-3 text-[14px] font-medium text-ink-strong">{{ f.label }}</p>
            <p class="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{{ f.detail }}</p>
          </div>
        </div>

        <div class="card-raised gpu mt-8 p-6 sm:p-8">
          <p class="claude-num">Common Preference</p>
          <p class="mt-3 max-w-[76ch] text-[15px] leading-[1.85] text-ink-body">
            五个模型共享同一个偏好：<span class="text-ink">预测主要依赖信号中的粗结构，
            而对生理学所指的细结构响应微弱</span>。
            在空间维度，预测对左右半球同源电极互换高度敏感，而区域屏蔽的影响小得多；
            在时间—频谱维度，预测依赖短窗的稳态内容，对生理节律的微观结构响应弱；
            在伪迹与背景维度，预测依赖输入幅度，而在幅度被去除后对波形本身响应弱。
          </p>
        </div>
      </div>
    </section>

    <!-- ================= LIMITATIONS ================= -->
    <section class="border-b border-ink/10">
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="flex items-baseline gap-4">
          <span class="eyebrow">Limitations &amp; Reproducibility</span>
          <span class="rule flex-1" />
        </div>

        <div class="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p class="eyebrow">Limitations</p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="l in p.limitations"
                :key="l"
                class="relative pl-4 text-[13.5px] leading-relaxed text-ink-muted"
              >
                <span class="absolute left-0 top-[9px] h-[3px] w-[3px] rounded-[1px] bg-ink-faint" />
                {{ l }}
              </li>
            </ul>
          </div>

          <div>
            <p class="eyebrow">Reproducibility</p>
            <p class="mt-4 text-[13.5px] leading-relaxed text-ink-muted">
              为支持审计与复现，发布物保留受试者不相交划分清单、预注册扰动参数、条件级记录、
              执行允许清单与带身份与状态字段的完成收据。
            </p>
            <div class="mt-4 flex flex-wrap gap-1.5">
              <span v-for="s in p.reproducibility.seeds" :key="s" class="tag">seed {{ s }}</span>
            </div>
            <ul class="mt-5 space-y-2">
              <li
                v-for="r in p.reproducibility.items"
                :key="r"
                class="relative pl-4 text-[13px] leading-relaxed text-ink-body"
              >
                <span class="absolute left-0 top-[8px] h-[3px] w-[3px] rounded-[1px] bg-claude" />
                {{ r }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= AI STATEMENT ================= -->
    <section>
      <div class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
        <div class="term overflow-hidden rounded-[3px] border border-ink/15">
          <div class="border-b border-white/10 px-3 py-2 text-[11px] term-dim">
            ~/paper/ai-use-statement — zsh
          </div>
          <div class="px-4 py-5 text-[12.5px] leading-[1.9]">
            <p class="term-accent">AI Use Statement</p>
            <p class="mt-3 text-[#d8d6d1]">{{ p.aiStatement }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
