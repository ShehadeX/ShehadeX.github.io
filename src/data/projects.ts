export interface Bba {
  before: string
  built: string
  after: string
}

export interface GalleryItem {
  src: string
  caption: string
}

export interface CaseSection {
  id: string
  no: string
  title: string
  body: string[]
}

export interface Project {
  slug: string
  case: string
  title: string
  subtitle: string
  domain: string
  summary: string
  cover: string
  coverCaption: string
  tags: string[]
  stack: string[]
  period: string
  role: string
  org: string
  bba: Bba
  sections: CaseSection[]
  gallery: GalleryItem[]
  diagrams: { id: string; title: string; code: string }[]
  facts: { label: string; value: string }[]
  link?: string
}

/* ------------------------------------------------------------------ */
/*  Mermaid 图示源码（维护在代码里，便于后续改为独立 .mmd 文件）      */
/* ------------------------------------------------------------------ */

const bidosWorkflow = `flowchart TD
  A[材料导入<br/>招标原文 / 企业资料] --> B[初判<br/>结构与章节识别]
  B --> C[深度分析<br/>要求抽取与证据绑定]
  C --> D[目录生成<br/>章节骨架]
  D --> E[章节准备<br/>来源与人工确认]
  E --> F[编制与导出<br/>DOCX + 结构检查]
  F -.人工复核.-> G[交付]
  style A fill:#DBD1C0,stroke:#454036,color:#201F1D
  style F fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
  style G fill:#DBD1C0,stroke:#454036,color:#201F1D
`

const bidosArchitecture = `flowchart LR
  subgraph FE["Vue 3 前端"]
    UI[工作台 / 项目 / 知识库 / 管理]
  end
  subgraph BE["Flask 后端"]
    API[REST API 层]
    WF[工作流编排<br/>六阶段状态机]
    SVC[领域服务<br/>目录 / 章节 / 资产]
  end
  subgraph AI["模型适配层"]
    MA[模型适配<br/>理解 / 起草]
  end
  subgraph ST["状态与产物"]
    DB[(SQLite<br/>项目与阶段产物)]
    FS[(文件系统<br/>源文件与导出)]
  end
  UI --> API --> WF --> SVC
  WF --> MA
  SVC --> DB
  SVC --> FS
  style FE fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style BE fill:#DBD1C0,stroke:#454036,color:#201F1D
  style AI fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
  style ST fill:#ECE9E0,stroke:#625F59,color:#201F1D
`

const cgaArchitecture = `flowchart TD
  subgraph UI["评估端"]
    WEB[Web 评估工作台<br/>逐题作答 / 自动计分]
    PAD[签名板 / 打印]
  end
  subgraph CORE["量表引擎"]
    DEF[量表定义库<br/>题型 / 评分规则]
    SCORE[计分与结果解释]
  end
  subgraph DATA["数据层"]
    REPO[Repository 抽象]
    LS[(localStorage<br/>原型数据)]
  end
  subgraph MODEL["大模型驱动"]
    LLM[综合评估生成<br/>多条件汇总]
  end
  WEB --> DEF --> SCORE
  WEB --> REPO --> LS
  SCORE --> MODEL
  PAD --- WEB
  style UI fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style CORE fill:#DBD1C0,stroke:#454036,color:#201F1D
  style DATA fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style MODEL fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
`

const mocaSequence = `sequenceDiagram
  participant OP as 操作员
  participant UI as 评估界面
  participant DEV as 采集设备
  participant TAG as 打标服务
  participant EGG as 脑电流
  OP->>UI: A 键进入下一个环节
  UI->>DEV: 触发采集 / 切换任务
  DEV-->>EGG: 串口指令下发
  EGG-->>TAG: 事件流 + 信号
  TAG->>TAG: 按码表映射事件
  TAG-->>UI: 打标点回写
  UI-->>OP: 进度与状态刷新
  Note over OP,TAG: 全局 B 键标记异常与中断
`

const polymedArch = `flowchart LR
  subgraph P["患者端"]
    WX[微信小程序<br/>用药助手]
  end
  subgraph F["家属端"]
    FM[家属监护]
  end
  subgraph D["医生端"]
    DOC[医嘱下达]
  end
  subgraph AG["Agent 服务层"]
    RAG[RAG 用药知识库]
    VL[多模态识别<br/>VL 模型]
    MATCH[药方匹配引擎]
  end
  subgraph DB["数据"]
    CASE[(患者病例 / 药方)]
    DRUG[(药物数据库)]
  end
  WX --> AG
  FM --> AG
  DOC --> AG
  AG --> CASE
  AG --> DRUG
  style P fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style F fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style D fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style AG fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
  style DB fill:#DBD1C0,stroke:#454036,color:#201F1D
`

const fupanArch = `flowchart TD
  subgraph FE["Next.js 前端"]
    CHAT[Agent 对话 / 文件上传]
  end
  subgraph BE["Spring Boot 后端"]
    CTRL[ChatBotController<br/>vlChat / analyze-image]
    AGENT[ReactAgent<br/>工具调用 + 记忆]
  end
  subgraph AI["模型服务"]
    TXT[文本模型<br/>openAiChatClient]
    VLM[视觉模型<br/>qwen3VlLocalChatClient]
  end
  subgraph DATA["业务与数据"]
    KB[(防返贫业务库)]
    GOV[政府数据库 / 贫困户资料]
  end
  CHAT --> CTRL --> AGENT
  AGENT --> TXT
  AGENT --> VLM
  AGENT --> KB
  KB --> GOV
  style FE fill:#ECE9E0,stroke:#625F59,color:#201F1D
  style BE fill:#DBD1C0,stroke:#454036,color:#201F1D
  style AI fill:#0F0F10,stroke:#0F0F10,color:#ECE9E0
  style DATA fill:#ECE9E0,stroke:#625F59,color:#201F1D
`

/* ------------------------------------------------------------------ */

export const projects: Project[] = [
  {
    slug: 'bidos',
    case: 'CASE 01',
    title: 'BidOS',
    subtitle: '企业 AI 招投标工作台',
    domain: 'AI SYSTEMS',
    summary:
      '把材料导入、初判、深度分析、目录生成、章节准备、编制导出拆成六阶段 AI 工作流，来源、人工确认与交付边界全部纳入系统流程。',
    cover: '/img/bidos/03.jpg',
    coverCaption: 'BidOS 项目概览：阶段产物与目录绑定关系',
    tags: ['Vue 3', 'Flask', 'Python', 'SQLite', 'LLM', 'Workflow'],
    stack: ['Vue 3', 'Flask / Python', 'SQLite', '文件系统产物', '模型适配层'],
    period: '2026.08 – 2026.11',
    role: '项目发起 & 产品 / 技术主线',
    org: '广电计量集团 · 计量事业部',
    bba: {
      before:
        '编制人员需在招标原文、企业资料、历史文档与 Word 交付物之间反复核对，材料来源与版本容易脱节，返工成本高。',
      built:
        '六阶段工作流 + 来源与版本关联的阶段产物 + 企业知识与历史参考 + 人工决策与审查 + DOCX 生成与导出检查。',
      after:
        '2026-10-16 内部记录：特定受控项目生成三份 Word 并记录章节批处理时间；未通过与未复测项同步列明。',
    },
    facts: [
      { label: '工作阶段', value: '6 阶段' },
      { label: '代码快照', value: '17259dd7' },
      { label: '交付物', value: 'DOCX × 3' },
      { label: '验证状态', value: '内部记录 · 非生产验收' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 业务背景与待解决的问题',
        body: [
          '招投标编制是一条典型的「长链路、强合规、人力密集」流程。输入侧是招标原文、企业资质、历史标书；输出侧是格式严格的 Word 交付物。真正的痛点不在写作，而在证据：编制人员无法快速回答「这一段结论出自哪份材料的哪一条」。',
          '第二个问题是版本。招标要求、企业资料与历史文档各自演化，任何一处不同步都会让成稿在评审阶段被退回。',
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 核心功能与产品设计',
        body: [
          'BidOS 把编制过程建模为六个有明确输入与产物的阶段：材料导入 → 初判 → 深度分析 → 目录生成 → 章节准备 → 编制导出。每个阶段的产物都带来源标记，可以被后续阶段直接引用，而不是重新让模型「猜」一次。',
          '人工决策点是显式的：目录与章节需要人工确认才进入下一阶段，模型可以提议但不能代替业务判断。',
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — 系统架构与状态流转',
        body: [
          '后端以 Flask 提供 REST 接口，工作流编排层维护阶段状态机，领域服务处理目录、章节与资产版本。模型不直接散落在业务代码里，而是统一收敛到模型适配层，业务侧只描述「理解」与「起草」两类能力。',
          '状态与产物分离：结构化状态进 SQLite，大体积源文件与导出物进文件系统，避免数据库膨胀。',
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 关键技术与开发难点',
        body: [
          '难点一：让来源在生成链路中不丢失。解法是把「事实候选」建模为带来源的对象，模型只能引用已登记的候选，无法凭空引入无来源事实。',
          '难点二：交付格式的稳定性。DOCX 生成后还要过结构检查，章节缺失、编号错位、空段落都要在导出环节被拦截，而不是等到评审人打开文档才发现。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 迭代与可追溯性',
        body: [
          '仓库保留完整 Git 历史，作品集中的架构图与 ER 图均取自代码快照 17259dd7（2026-11-06）的建表语句与实际模块，而不是事后补画的效果图。',
          '早期 Git 记录有本人署名；团队人数与后续代码分工仍需核实，因此正文区分「本人负责」与「团队产出」。',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 验证数据与边界',
        body: [
          '可核验结果：2026-10-16 内部记录记载特定受控项目生成三份 Word，并记录章节批处理时间，同时列明未通过项与未复测项。',
          '边界声明：这不是生产验收数据，也不是通用提效指标。截图中含真实企业、投标项目与人员信息，对外投递前必须完成界面脱敏或改用合成演示数据。',
        ],
      },
    ],
    gallery: [
      { src: '/img/bidos/01.jpg', caption: '材料导入' },
      { src: '/img/bidos/02.jpg', caption: '招标深度分析' },
      { src: '/img/bidos/03.jpg', caption: '目录与企业知识库绑定' },
      { src: '/img/bidos/04.jpg', caption: 'DOCX 编制工作台' },
      { src: '/img/bidos/05.jpg', caption: '系统管理总览' },
      { src: '/img/bidos/08.jpg', caption: '项目概览' },
    ],
    diagrams: [
      { id: 'bidos-workflow', title: '六阶段工作流', code: bidosWorkflow },
      { id: 'bidos-arch', title: '系统架构分层', code: bidosArchitecture },
    ],
  },

  {
    slug: 'cga-smart',
    case: 'CASE 02',
    title: 'CGA-Smart',
    subtitle: '老年综合评估智能系统',
    domain: 'MEDICAL SOFTWARE',
    summary:
      '依据 WS/T 888—2026 构建大模型驱动的轻量化老年综合评估系统，把量表引擎、评分规则与多条件汇总拆成可扩展的独立模块。',
    cover: '/img/cga/02.jpg',
    coverCaption: 'CGA-Smart 评估工作台与风险提示',
    tags: ['Vue 3', 'Vite', 'TypeScript', 'Element Plus', 'Pinia', 'ECharts', 'LLM'],
    stack: ['Vue 3', 'Vite 5', 'TypeScript', 'Element Plus', 'Pinia', 'ECharts', 'Spring Boot'],
    period: '2026.06 – 至今',
    role: '前沿部署工程师 · 全链路独立开发',
    org: '广东省人民医院 · 老年康复科',
    bba: {
      before:
        '老年综合评估覆盖多量表、多条件，纸质与孤立工具并行，评估结果汇总依赖人工，康复科无法快速形成综合判断。',
      built:
        '抽象出可扩展的量表引擎（题型组件 + 评分规则 + 结果解释），完成评估流程、患者管理与数据闭环，由大模型驱动多条件综合评估。',
      after:
        '系统完成上线与本地部署，已在广东省人民医院老年康复科与广州港麓湖一号康颐养医院完成测试并落地使用。',
    },
    facts: [
      { label: '内置量表', value: '9 套' },
      { label: '执行标准', value: 'WS/T 888—2026' },
      { label: '落地场景', value: '2 家医疗机构' },
      { label: '角色模型', value: '管理员 / 评估员' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 临床流程的真实约束',
        body: [
          'CGA（Comprehensive Geriatric Assessment）不是一个表单，而是一组量表的组合。MMSE、GDS-15、MORSE、GAD-7、EAT-10、FRAIL、Fried、MNA-SF、AIS 各有独立题型、计分与解释规则。',
          '医院现场的痛点是：每新增一套量表都要改代码，评估结果又难以横向汇总成康复科真正需要的结论。',
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 量表引擎与数据闭环',
        body: [
          '核心设计是把量表抽象为「题型组件 + 评分规则 + 结果解释」三层。新增量表只需新增定义，不再改动评估流程主链路。',
          '数据访问统一走 Repository 抽象，原型期以 localStorage 模拟后端，替换真实接口时业务层零改动。评估发起 → 逐题作答 → 自动计分 → 结果查看 → 历史记录 → 打印形成闭环。',
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — 分层与数据流',
        body: [
          '前端 Vue 3 + Vite + TypeScript + Element Plus，Pinia 管理状态，ECharts 承载可视化，signature_pad 支持签名采集。',
          '大模型承担的是「多条件综合评估生成」——把多个量表的结构化结果汇聚成可读结论，而不是替代量表本身的计分逻辑。这一点是刻意的：临床计分必须可复算、可追溯。',
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 成本、性能与交互的联合优化',
        body: [
          '项目从业务需求到产品落地全链路独立完成，重点投入在成本控制、系统性能与用户交互三条线的联合优化。',
          '具体做法包括：用规则引擎承担确定性的计分与解释，把模型调用收敛到真正需要推理的汇总环节；对评估员高频路径做键盘流优化，减少在临床现场的点击成本。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 从原型到生产',
        body: [
          '仓库以 demo1 为核心，先跑通评估流程与量表引擎的基本闭环，再向生产环境推进。',
          '一期刻意保留了 Repository 抽象层，让本地演示与医院内网部署共用同一套业务代码，降低换环境的风险。',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 上线状态与验证范围',
        body: [
          '系统已完成上线与本地部署，在广东省人民医院老年康复科与广州港麓湖一号康颐养医院完成测试。',
          '已接入量表包括 MMSE、GDS-15、MORSE、GAD-7、EAT-10、FRAIL、Fried、MNA-SF、AIS 九套，覆盖认知、情绪、跌倒、焦虑、吞咽、衰弱、营养与睡眠八个维度。',
        ],
      },
    ],
    gallery: [
      { src: '/img/cga/01.jpg', caption: '系统登录与角色入口' },
      { src: '/img/cga/02.jpg', caption: '评估工作台与风险提示' },
      { src: '/img/cga/04.jpg', caption: '量表管理' },
      { src: '/img/cga/06.jpg', caption: '患者管理' },
      { src: '/img/cga/08.jpg', caption: '评估流程与结果' },
      { src: '/img/cga/11.jpg', caption: '系统管理' },
    ],
    diagrams: [{ id: 'cga-arch', title: '量表引擎与数据层', code: cgaArchitecture }],
  },

  {
    slug: 'moca',
    case: 'CASE 03',
    title: 'MoCA',
    subtitle: '临床认知评估与脑电打标系统',
    domain: 'NEURO / SIGNAL',
    summary:
      '把 MoCA 14 个评估环节数字化，适配多家医院的采集设备，在 20ms 级完成事件打标，把认知测评与脑电信号采集锁进同一条时间轴。',
    cover: '/img/moca/moca-01.jpg',
    coverCaption: 'MoCA 认知评估系统操作界面',
    tags: ['实验范式', '串口通信', '脑电事件标记', 'Python', '实时打标'],
    stack: ['串口设备通信', '实时事件打标', '实验范式设计', '数字化量表', 'Python'],
    period: '2025.10 – 至今',
    role: '前沿部署工程师',
    org: '中科院深圳先进院 · 阿兹海默症图示训练系统',
    bba: {
      before:
        '认知量表靠纸质或人工计分，脑电实验依赖厂商工具标记事件，两套时间轴对不齐，事后无法把某个认知环节和脑电信号段对应。',
      built:
        '自研数字化打标软件统一事件码表（43 个精细化打标点），串口直连采集设备，A 键推进环节、B 键全局标记异常，14 环节全流程可视化。',
      after:
        '专用打标软件已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院测试 20+ 患者数据，并已申请软件著作权。',
    },
    facts: [
      { label: '评估环节', value: '14 个' },
      { label: '打标点', value: '43 个' },
      { label: '打标精度', value: '20ms 级' },
      { label: '临床测试', value: '3 家医院 · 20+ 例' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 两条时间轴对齐的问题',
        body: [
          '认知评估与脑电采集在实验现场是两套系统。评估走的是临床节奏，采集走的是设备节奏，一旦事件标记靠人工事后补录，信号段与行为事件就无法可靠对应。',
          '这是神经科学实验里最典型的隐性误差源：数据能采到，但无法用。',
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 码表驱动的打标软件',
        body: [
          '核心是把「码表」作为唯一事实来源。旧码表用 moduleId × 2 的粗粒度规则，只能区分开始与结束；新码表精细化为 43 个打标点，把题目呈现、onset、开始、结束拆成独立事件。',
          '以「视空间-连线」为例：题目呈现 (4) → 第一笔开始 (5) → 全部完成 (6)，三个事件让后续分析可以精确切分出笔迹运动段。',
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — 全流程时序',
        body: [
          '评估以环节 0 总览页开场，随后进入 30 秒静息休息段（rest-start → 5 秒间隔 sentinel × N → rest-end），再由 task-start(96) 进入第一个测试环节。',
          '操作员 A 键推进环节、全局 B 键标记异常与中断。串口下行指令触发采集，上行事件流经码表映射后回写界面，进度与状态实时刷新。',
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 信号干扰与外围设备',
        body: [
          '在真实病房环境中，商用设备与 PC 共地会带来干扰。项目融合神经科学与软件工程两侧，设计了独立的外围设备来隔离信号，同时把采集设备适配层抽象出来，兼容多家医院的设备型号。',
          '关键工程点是把打标延迟压到 20ms 级，这要求串口读写、事件分发与时间戳记录三段都不能有排队阻塞。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 范式与业务的共同设计',
        body: [
          '系统重构以「最终码表为唯一标准」推进，旧规则全部废弃，避免新旧两套事件语义在历史数据里混用。',
          '文档层面把 14 个环节的完整打标流程与 UI 切换时序逐一写死，包括每屏背景色、字号与 A 键行为，让操作员交接时不需要口头补充。',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 临床验证与论文',
        body: [
          '打标软件已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院测试 20+ 患者数据，并申请软件著作权。',
          '相关工作以第二作者身份完成 ICLR 2027 论文（当前处于 Rebuttal 阶段），从实验设计到著作撰写的全流程均有参与。',
        ],
      },
    ],
    gallery: [{ src: '/img/moca/moca-01.jpg', caption: 'MoCA 认知评估系统操作界面' }],
    diagrams: [{ id: 'moca-seq', title: '打标全流程时序', code: mocaSequence }],
  },

  {
    slug: 'fupan',
    case: 'CASE 04',
    title: 'FFP 防返贫',
    subtitle: '政府场景风险识别智能体',
    domain: 'AI AGENT',
    summary:
      '基于 Spring AI 与本地化部署的 Qwen 量化模型，构建带证据推理输出的防返贫风险识别智能体，Agent 与 MCP Tools 结构化插入业务链路。',
    cover: '/img/fupanpolymed/fupan-01.jpg',
    coverCaption: '防返贫智能体对话与风险识别',
    tags: ['Spring AI', 'ReactAgent', 'Qwen', 'LangGraph', 'MCP', '本地部署'],
    stack: ['Spring AI / Spring AI Alibaba', 'ReactAgent', 'OpenAI-compatible 适配', 'vLLM / Qwen 本地部署', 'Next.js', 'LangGraph'],
    period: '2026.06 – 2026.07',
    role: '功能研发与测试',
    org: '中电信数智科技 · 海南分公司研发中心',
    bba: {
      before:
        '防返贫监测依赖人工比对贫困户资料与政府数据库，数据项分散、规则复杂，基层核对周期长且难留痕。',
      built:
        '以 Spring AI 的 OpenAI-compatible 适配接入内网模型服务，构建 ReactAgent（工具注册 + 模型选工具 + 上下文总结 Hook），打通多模态文件输入与带证据的推理输出。',
      after:
        '原型阶段完成从数据项梳理、模型连通到 Agent 编排的完整闭环，并输出可执行的分阶段实施方案与验收标准。',
    },
    facts: [
      { label: 'Agent 编排', value: 'ReactAgent' },
      { label: '模型部署', value: '本地化 Qwen 量化' },
      { label: '数据项', value: '5000 组样本建设' },
      { label: '接口', value: 'vlChat / analyze-image' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 政府场景的风险识别',
        body: [
          '防返贫监测需要把贫困户资料与政府数据库交叉比对，识别返贫风险。这不是一个通用问答问题：它需要结构化数据项、稳定规则和可审计的推理过程。',
          '数据侧的现实是数据项分散在不同来源中，规则散落在人工经验里。',
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 带证据的推理输出',
        body: [
          '系统不接受「模型说了什么」，只接受「模型依据哪条数据项得出该结论」。每一项风险判断都绑定到数据项与来源，输出可被基层工作人员核对。',
          '工程上把 Agent 与 MCP Tools 结构化插入现有业务链路，而不是另起一套独立应用。',
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — 内网模型服务接入',
        body: [
          '由于内网模型服务在内网兼容端点上自动配置行为不确定，MultiModelConfig 手动构建 openAiChatModel，openAiChatClient 作为文本入口、qwen3VlLocalChatClient 作为视觉入口。',
          'ChatbotAgent 在 ReactAgent 中组合 ChatModel、CheckpointSaver(MemorySaver)、SummarizationHook 与 ToolCallback 列表，具备工具注册、模型选工具与上下文总结能力。',
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 合规、审计与数据治理',
        body: [
          '政府场景的特殊性决定了三件事必须先设计：数据治理与 5000 组样本建设方案、安全合规与审计设计、以及风险识别模型的第一阶段实施边界。',
          '项目采用 E2E 的 Dify / Spring AI 工作流实现多模态文件输入，配合量化模型本地化部署，保证敏感数据不出内网。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 分阶段路线图',
        body: [
          '设计文档以编号序列组织：项目现状分析 → Spring AI 层级架构适配 → 风险识别业务规则 → Agent 与 MCP Tools 插入设计 → 数据治理与样本建设 → 安全合规与审计 → 第一阶段实施方案 → 帮扶资产模型扩展 → 路线图与验收标准。',
          '每一步都有对应的交付物与验收口径，而不是「继续优化」。',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 阶段状态',
        body: [
          '原型阶段成果：模型服务连通、请求路径兼容、基础文本与图像调用可用，Agent 编排基础具备。',
          '当前处于从「模型连通」走向「政府业务可用 Agent」的建设方向，后续扩展到风险消除与帮扶资产模型。',
        ],
      },
    ],
    gallery: [
      { src: '/img/fupanpolymed/fupan-01.jpg', caption: '防返贫智能体对话' },
      { src: '/img/fupanpolymed/fupan-04.jpg', caption: '风险识别结果与证据' },
      { src: '/img/fupanpolymed/fupan-06.jpg', caption: '多模态文件输入' },
    ],
    diagrams: [{ id: 'fupan-arch', title: 'Agent 与模型服务架构', code: fupanArch }],
  },

  {
    slug: 'polymed',
    case: 'CASE 05',
    title: 'PolyMed',
    subtitle: '智能用药管理小程序',
    domain: 'HEALTHCARE',
    summary:
      '以 RAG 构建微服务用药助手 Agent，患者端、家属端、医生端三端打通，让医嘱智能下达、服药情况实时可监控。',
    cover: '/img/fupanpolymed/polymed-03.jpg',
    coverCaption: 'PolyMed 智能用药小程序',
    tags: ['RAG', '多模态', 'Agent', '微信小程序', '医患协同'],
    stack: ['RAG 用药知识库', 'VL 多模态识别', 'Agent 微服务', '微信小程序', '语音交互'],
    period: '2025.10 – 至今',
    role: '前沿部署工程师',
    org: '中山大学医学院 · Polymed',
    bba: {
      before:
        '用药方案以纸质医嘱和口头告知为主，患者对剂量、禁忌与相互作用理解有限，家属无法远程确认是否服药，错误用药风险集中在出院后。',
      built:
        '基于医学院提供的患者病例与药方，实现 VL 多模态输入识别匹配药物数据库，RAG 构建微服务用药助手 Agent，支持粤语 / 普通话语音对话。',
      after:
        '患者端—家属端—医生端形成闭环：医嘱可智能下达，服药信息实时监控，把用药风险控制从「靠自觉」变成「可观测」。',
    },
    facts: [
      { label: '端侧', value: '患者 / 家属 / 医生' },
      { label: '输入模态', value: 'VL 多模态 + 语音' },
      { label: '交互语言', value: '粤语 / 普通话' },
      { label: '知识组织', value: 'RAG 微服务' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 出院后的用药风险',
        body: [
          '临床药方案在出院时交代一次，但老年患者的多药联用场景下，剂量、禁忌与相互作用很难靠一次口述记住。',
          '同时医生端缺少反馈通道，无法知道患者实际有没有按医嘱服药。',
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 三端闭环的用药助手',
        body: [
          '患者端用自然语言问「这个药饭前还是饭后吃」，Agent 结合个人病例与药物库回答，而不是给通用科普。',
          '家属端提供远程监护视图，医生端下达的医嘱结构化落库，服药执行情况实时回传，形成医生可查的依从性记录。',
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — RAG 与多模态识别',
        body: [
          '采用 RAG 构建微服务化的用药助手 Agent，知识源为医学院提供的患者病例与药方。',
          'VL 多模态能力用于把处方图像等输入转成可匹配的结构化药物信息，再与药物数据库比对完成识别匹配。',
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 粤语场景的工程挑战',
        body: [
          '患者群体以粤语为主，语音识别与生成的方言能力直接影响可用性，Agent 需要在检索与生成两侧都处理方言输入。',
          '另一处工程考量是隐私：用药数据属于敏感健康信息，微服务拆分时需要避免在检索链路中泄漏无关病例。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 从原型到三端',
        body: [
          '项目从 RAG 与 Agent 的单点能力验证，逐步扩展到患者端、家属端与医生端的完整业务流。',
          '三端的分工在早期就被明确划分，避免出现「患者端承担医生端职责」的设计扭曲。',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 当前状态',
        body: [
          '三端架构与 RAG 用药助手 Agent 已完成实现，患者可用粤语或普通话与 Agent 沟通日常用药方案及注意事项。',
          '医嘱智能下达与服药信息实时监控链路已打通，用药错误的可观测性显著提升。',
        ],
      },
    ],
    gallery: [
      { src: '/img/fupanpolymed/polymed-01.jpg', caption: '患者端 · 用药助手' },
      { src: '/img/fupanpolymed/polymed-05.jpg', caption: '用药方案与注意事项' },
      { src: '/img/fupanpolymed/polymed-09.jpg', caption: '家属端监护' },
      { src: '/img/fupanpolymed/polymed-13.jpg', caption: '医生端医嘱' },
    ],
    diagrams: [{ id: 'polymed-arch', title: '三端与 Agent 服务层', code: polymedArch }],
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
