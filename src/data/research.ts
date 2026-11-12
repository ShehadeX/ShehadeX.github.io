import { asset } from '@/utils/asset'

export interface Protocol {
  id: string
  name: string
  dimension: string
  question: string
  intervention: string
  control: string
}

export interface KeyFinding {
  metric: string
  label: string
  detail: string
}

export const researchPaper = {
  title: 'Dissecting the Score',
  subtitle: 'Calibrated Diagnosis of EEG Foundation Models',
  venue: 'ICLR 2027',
  status: 'Under Review · Rebuttal 阶段',
  authors: 'Anonymous authors（双盲评审中）',
  pdf: asset('/paper/dissecting-the-score.pdf'),
  abstract:
    'EEG 基础模型在下游任务上分数很高，但分数无法说明预测究竟依赖信号的哪些属性。已有输入扰动方法同样不足以回答这个问题——扰动的效果会同时受到 adapter、readout 与扰动本身引入的伪迹影响。我们提出一个以神经生理学为共同参照的跨架构诊断基准：固定每个模型的 adapter、预训练骨干与 readout，再对输入施加八种诊断协议且不进行任何进一步训练；为每种干预配备配对控制以分离目标效应与主要副作用，并在已知信号依赖的合成 EEG 上校准其中三个代表性协议。',
  contributions: [
    {
      no: '01',
      title: '带植入式真值校准的受控诊断基准',
      desc: '两阶段解耦 + 配对控制 + 合成真值校准。所有物理干预都施加在模型自身输入表征之前，使异构模型能在同一实验设置下比较。',
    },
    {
      no: '02',
      title: '标量分数掩盖的重复性模式',
      desc: '五个已发布 EEG-FM、四个任务、八种协议的一致画像：预测普遍依赖信号的粗结构，而对生理学所指的细结构响应微弱。',
    },
    {
      no: '03',
      title: '从诊断到改进的闭环',
      desc: '只替换接口并重跑同一协议，即可把现象归因到接口层还是骨干层。接口层重拟合读出可恢复表征闲置的属性；骨干层的问题则成为下一代预训练的具名目标。',
    },
  ],
  models: ['BIOT', 'CBraMod', 'CSBrain', 'LaBraM', 'REVE'],
  tasks: [
    { name: 'Motor Imagery', metric: 'AUROC', chance: '0.5', mechanism: '运动皮层侧化' },
    { name: 'Seizure Detection', metric: 'AUROC', chance: '0.5', mechanism: '癫痫样放电' },
    { name: 'Sleep Staging', metric: 'Balanced Acc', chance: '0.2', mechanism: '睡眠分期节律' },
    { name: 'Emotion Recognition', metric: 'AUROC-OvR', chance: '0.5', mechanism: '情绪相关频段' },
  ],
  findings: [
    {
      metric: '0.18–0.28',
      label: '半球电极互换的 AUROC 损失',
      detail:
        '在运动想象任务上，把左右半球对应电极互换会让 AUROC 下降 0.18–0.28；而完全屏蔽预定义的中央感觉运动区，性能变化不到 0.04。',
    },
    {
      metric: '≈ 0',
      label: '细结构响应的缺失',
      detail:
        '两个保留输入幅度的模型在原始波形被 RMS 匹配的背景完全替换后仍保持高度可预测；但保留原始波形而只做强衰减时，反而跌破随机水平。',
    },
    {
      metric: '2×',
      label: '相似分数下的敏感度差异',
      detail:
        'CBraMod 与 CSBrain 在运动想象上的干净 AUROC 几乎相同（0.750 与 0.748），但完全屏蔽额区对 CSBrain 的影响接近 CBraMod 的两倍。',
    },
    {
      metric: '13–28%',
      label: '读出层重拟合可恢复的比例',
      detail:
        '冻结骨干、仅重拟合一个线性读出（镜像增强），可以让运动想象预测更一致地响应左右电极互换。剩余无法实现的逆转留给骨干层，成为预训练目标。',
    },
  ] as KeyFinding[],
  protocols: [
    {
      id: 'S1.1',
      name: 'Region Criticality',
      dimension: '空间',
      question: '预测是否依赖局部头皮组织（区域细结构）？',
      intervention: '屏蔽五个脑叶区域之一，比例 ρ ∈ {0.25, 0.5, 0.75, 1}',
      control: '区域外随机等量通道屏蔽 + 时间打乱对照',
    },
    {
      id: 'S1.2',
      name: 'Montage Swap',
      dimension: '空间',
      question: '预测是否依赖电极的左右排列（蒙太奇结构）？',
      intervention: '左右半球同源电极对互换',
      control: '非侧化任务（Sleep）作为对照',
    },
    {
      id: 'S2.x',
      name: 'Spectral / Aperture',
      dimension: '时间—频谱',
      question: '预测依赖短窗的稳态内容，还是生理节律的微观结构？',
      intervention: '低通滤波、孔径截断、频段移除',
      control: '时间打乱、零填充与重复填充对比',
    },
    {
      id: 'S3.x',
      name: 'Artifact & Background',
      dimension: '伪迹与背景',
      question: '预测依赖输入幅度，还是与幅度无关的波形？',
      intervention: 'RMS 匹配背景替换、强衰减、眼动伪迹注入',
      control: '固定缩放对照 + 合成真值校准',
    },
  ] as Protocol[],
  limitations: [
    '每个模型只评估一个冻结线性状态、每个任务一个数据集；Seizure 与 Emotion 各仅含 3 名测试受试者。',
    '合成校准覆盖八个协议中的三个；部分整合响应坐标以每状态估计报告，未做完整的受试者级 bootstrap 传播。',
    '结论应读作「被评估路线与数据集的性质」，而非 EEG 基础模型的普遍性质。更广验证需要更多队列、状态族、基线与独立记录的伪迹。',
  ],
  reproducibility: {
    seeds: ['20260528', '20260612', '20260718'],
    items: [
      '受试者不相交划分清单',
      '预注册的扰动参数',
      '条件级记录与执行收据',
      '测试受试者 bootstrap 置信区间',
      'N = 3 个独立拟合状态的均值与标准差',
    ],
  },
  aiStatement:
    '按 ICLR 2027 作者 AI 政策披露：大语言模型参与了把初稿翻译为英文、实现与重构流水线代码、重排数据集记录、对方法学与解释性主张的批判性审阅、文献发现、文稿—产出物一致性检查、校对与 LaTeX 排版。AI 未参与生成数据、经验观测或评分卡数值。研究问题、假设、数学表述、扰动设计与诊断协议由作者定义；作者检查了底层记录、裁决了所有 AI 建议，并审阅与测试了每一条保留的主张与代码改动。',
}
