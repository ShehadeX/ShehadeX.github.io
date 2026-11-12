import { asset } from '@/utils/asset'

export interface Bba {
  before: string
  built: string
  after: string
}

export interface GalleryItem {
  src: string
  caption: string
  /** 容器比例：横屏截图 16 / 10，手机竖屏截图 736 / 1600 */
  ratio?: string
  /** 这张图在讲什么 */
  note?: string
  /** 这张图背后的开发历程 */
  story?: string
}

export interface CaseSubsection {
  id: string
  /** 细分编号，如 "2.1" */
  no: string
  title: string
  body?: string[]
  media?: GalleryItem[]
}

export interface CaseSection {
  id: string
  no: string
  title: string
  body: string[]
  /** 该段落配套的界面截图，以图片为主体组织叙述 */
  media?: GalleryItem[]
  /**
   * 细分问题。
   *
   * 一个 section 往往对应不止一个问题（例如「Solution」下面会有多个独立问题），
   * 目录只列一级会丢失信息，所以这里支持二级细分。
   */
  subsections?: CaseSubsection[]
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
  /** 封面比例，默认 16 / 10；手机竖屏截图用 736 / 1600 */
  coverRatio?: string
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
    cover: asset('/img/bidos/cover-bidos.webp'),
    coverCaption: 'BidOS 招投标智能编制系统 · 六阶段工作台主界面',
    tags: ['Vue 3', 'Flask', 'Python', 'SQLite', 'LLM', 'Workflow'],
    stack: ['Vue 3', 'Flask / Python', 'SQLite', '文件系统产物', '模型适配层'],
    period: '2026.07 – 2026.12',
    role: '产品设计与全栈开发（实习）',
    org: '广电计量集团 · 广州总部计量事业部',
    bba: {
      before:
        '编制人员需在招标原文、企业资料、历史文档与 Word 交付物之间反复核对，材料来源与版本容易脱节，返工成本高。',
      built:
        '六阶段工作流 + 来源与版本关联的阶段产物 + 企业知识与历史参考 + 人工决策与审查 + DOCX 生成与导出检查。',
      after:
        '单份标书从导入到可交付 Word 的生成时间压缩到分钟级，六阶段逐段可追溯；每份产物都带来源引用与人工确认记录，评审阶段可直接回溯到原始材料。',
    },
    facts: [
      { label: '工作阶段', value: '6 阶段' },
      { label: '单份标书生成', value: '分钟级' },
      { label: '交付物', value: 'DOCX · 带来源引用' },
      { label: '可追溯性', value: '阶段产物逐段留痕' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — 业务背景与待解决的问题',
        body: [
          '招投标编制是一条典型的「长链路、强合规、人力密集」流程。输入侧是招标原文、企业资质、历史标书；输出侧是格式严格的 Word 交付物。真正的痛点不在写作，而在证据：编制人员无法快速回答「这一段结论出自哪份材料的哪一条」。',
          '第二个问题是版本。招标要求、企业资料与历史文档各自演化，任何一处不同步都会让成稿在评审阶段被退回。',
          '从甲方视角看，真正被消耗的是人工时间：同样的资料核对与格式整理重复发生在每一个投标项目上。因此系统要解决的不是「写得更聪明」，而是「少做重复劳动且不出错」。',
        ],
        media: [
          {
            src: asset('/img/bidos/01.webp'),
            caption: '材料导入',
            note: '招标原文、企业资质、历史标书三类输入统一进入工作台，导入阶段就完成文件指纹登记，为后续「来源可查」打底。',
            story: '投标文件格式千差万别，直接丢给模型只会得到一段看起来通顺但对不上招标要求的文字。所以第一步先把材料切开、编号、登记来源，把「这批材料是什么」变成系统里的确定性事实，再交给模型做理解。',
          },
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
        /*
         * 细分问题：Solution 下面其实是三个独立的子问题，
         * 混在一段里会让目录失去导航价值，所以拆开列。
         */
        subsections: [
          {
            id: 'solution-requirements',
            no: '2.1',
            title: '把「读文档」变成「读要求」',
            body: [
              '原做法是让模型写一段招标分析，评审人只能通读判断对错。改成条目化之后，深度分析界面把招标要求逐条拆成可勾选的条目，每一条都挂在具体来源段落上，分析结果本身也是可编辑的结构化产物。',
              '这意味着编制员可以直接在条目上确认、修改、驳回——分析从一段文字变成了一份可协作的清单。',
            ],
            media: [
              {
                src: asset('/img/bidos/02.webp'),
                caption: '招标深度分析',
                note: '深度分析界面把招标要求逐条拆成可勾选的条目，每一条都挂在具体来源段落上，分析结果本身也是可编辑的结构化产物。',
                story: '这一屏是从「读文档」转向「读要求」的关键改造。原来的做法是让模型写一篇分析，评审人只能通读判断；改成条目化之后，编制员可以直接在条目上确认、修改、驳回，分析就从一段文字变成了一份可协作的清单。',
              },
            ],
          },
          {
            id: 'solution-knowledge',
            no: '2.2',
            title: '知识召回要精准，而不是碰运气',
            body: [
              '企业知识库是这次项目里投入最大的部分：分析了 23 份历史人工稿件，构建出材料图谱，把散落的历史文档整理成一级、二级分类。',
              '生成的目录与知识库分类双向绑定，写章节时按项目背景精准召回对应资质、业绩、法律条文，而不是全库检索碰运气。',
            ],
            media: [
              {
                src: asset('/img/bidos/03.webp'),
                caption: '目录与企业知识库绑定',
                note: '生成的目录与知识库分类双向绑定，章节写作时自动召回对应资质、业绩、法律条文，而不是全库检索。',
                story: '企业知识库是这次项目里投入最大的部分。我们分析了 23 份历史人工稿件，构建出材料图谱，把散落的历史文档整理成一级、二级分类。写章节时按项目背景精准召回，让模型引用的每条信息都来自正确的分类，而不是在库里碰运气。',
              },
            ],
          },
          {
            id: 'solution-human',
            no: '2.3',
            title: '人机分工：模型提议，人来拍板',
            body: [
              '目录与章节必须经人工确认才进入下一阶段。模型可以给出结构化提议，但业务判断不能被替代。',
              '这是刻意设计上的取舍：招投标的最终责任在编制人，任何「全自动」的主张都会把合规风险转嫁给系统。',
            ],
          },
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
        media: [
          {
            src: asset('/img/bidos/08.webp'),
            caption: '项目概览',
            note: '概览页把项目、阶段状态、待确认项与产物目录集中呈现，是每个阶段收尾时的确认面板。',
            story: '阶段产物与来源的绑定关系在这里被可视化成一张图。早期版本产物散在各阶段目录里，出问题时没人说得清哪一版是最新版；把「产物 + 来源 + 状态」三者放在一起之后，返工和交接的成本明显下降。',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 关键技术与开发难点',
        body: [
          '难点一：让来源在生成链路中不丢失。解法是把「事实候选」建模为带来源的对象，模型只能引用已登记的候选，无法凭空引入无来源事实。',
          '难点二：交付格式的稳定性。DOCX 生成后还要过结构检查，章节缺失、编号错位、空段落都要在导出环节被拦截，而不是等到评审人打开文档才发现。',
          '难点三：模型幻觉的工程化抑制。我们为段落生成设计了大量 harness：用 JSON 定义 OOXML 格式（段前段后、行间距、宋体嵌入等），并配合企业主体提示词注入、参考信息脱敏、数据二次复合与负面提示词，把「模型自由发挥」限制在可接受的结构内。',
        ],
        media: [
          {
            src: asset('/img/bidos/04.webp'),
            caption: 'DOCX 编制工作台',
            note: '左侧章节树、中间正文编辑、右侧来源与状态，编制员在同屏内完成「写—核对—确认」闭环。',
            story: '格式稳定性最终是用 harness 堆出来的。我们把 OOXML 的段落属性写成 JSON schema 约束模型输出，再在导出前跑一遍结构检查工具，章节缺失、编号错位、空段落全部在导出环节被拦下。牺牲了一些生成自由度，换来了投标文件的合规确定性。',
          },
          {
            src: asset('/img/bidos/05.webp'),
            caption: '系统管理总览',
            note: '模型配置、知识库分类、用户与审计记录集中管理，便于在客户现场调整而不改代码。',
            story: '甲方现场和开发环境的模型服务地址、密钥策略完全不同，所以所有模型配置外置到管理界面。现场人员能自己切模型、调参数、出问题能看审计记录，不需要提工单等我们远程改。',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 迭代与可追溯性',
        body: [
          '仓库保留完整 Git 历史，作品集中的架构图与 ER 图均取自代码快照 17259dd7（2026-11-06）的建表语句与实际模块，而不是事后补画的效果图。',
          '早期 Git 记录有本人署名；团队人数与后续代码分工仍需核实，因此正文区分「本人负责」与「团队产出」。',
          '工程交付上，最终以 Docker 打包并通过 K8s 部署到甲方主机，同时保留原始开发手稿、大量维护注释与测试入口，方便后续人员接手迭代。',
        ],
        media: [
          {
            src: asset('/img/bidos/06.webp'),
            caption: '知识库与材料图谱管理',
            note: '企业材料按一级 / 二级分类归档，来源文件与结构化条目一一对应，是自动召回能成立的前提。',
            story: '这一块是最脏也最关键的活：23 份历史人工稿件要逐份拆解成结构化分类。做完之后生成阶段才有可能「知道该引用哪一类材料」，否则再好的模型也只能泛泛而谈。',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 验证数据与边界',
        body: [
          '可核验结果：2026-10-16 内部记录记载特定受控项目生成三份 Word，并记录章节批处理时间，同时列明未通过项与未复测项。',
          '边界声明：这不是生产验收数据，也不是通用提效指标。界面中的企业、投标项目与人员信息为虚构测试数据，用于呈现系统形态。',
          '当前状态：系统用于内部测试与继续开发，真实项目全流程交付验收仍需完成。',
        ],
      },
    ],
    gallery: [
      { src: asset('/img/bidos/cover-bidos.webp'), caption: 'BidOS 招投标智能编制系统主界面' },
      { src: asset('/img/bidos/01.webp'), caption: '材料导入' },
      { src: asset('/img/bidos/02.webp'), caption: '招标深度分析' },
      { src: asset('/img/bidos/03.webp'), caption: '目录与企业知识库绑定' },
      { src: asset('/img/bidos/04.webp'), caption: 'DOCX 编制工作台' },
      { src: asset('/img/bidos/05.webp'), caption: '系统管理总览' },
      { src: asset('/img/bidos/08.webp'), caption: '项目概览' },
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
    cover: asset('/img/cga/cover.webp'),
    coverCaption: 'CGA-Smart 老年综合评估系统 · 广东工业大学 × 广东省人民医院 联合研发',
    tags: ['Vue 3', 'Vite', 'TypeScript', 'Element Plus', 'Pinia', 'ECharts', 'LLM'],
    stack: ['Vue 3', 'Vite 5', 'TypeScript', 'Element Plus', 'Pinia', 'ECharts', 'Spring Boot'],
    period: '2026.06 – 至今',
    role: '全栈开发（实习，独立完成全链路）',
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
          '成本侧同样具体：过去依赖纸质量表判定，需要老年人到病房测评或医疗人员上门，单张量表收费 20–50 元，一次综合测试数百至上千元；量表判定依赖医生主观判断，而医生根本无法规模化完成评估任务。',
        ],
        media: [
          {
            src: asset('/img/cga/01.webp'),
            caption: '系统登录与角色入口',
            note: '管理员与评估员两种角色入口，评估员侧直接进入待评估任务队列，减少培训成本。',
            story: '医院一线最怕「学不会」。所以角色入口做得极简：登录后就是今天要做的评估，而不是一个功能菜单。第一版把量表管理、系统设置这些管理员功能收进二级入口，评估员只看到任务流。',
          },
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
        media: [
          {
            src: asset('/img/cga/02.webp'),
            caption: '评估工作台与风险提示',
            note: '左侧 21 条量表导航、中间逐题作答、右侧实时风险提示，评估过程中即可看到跌倒、抑郁、营养等维度的初判。',
            story: '家属被邀请参与测试过程是这个版本的关键变化：以往只有医生在场，现在家属可以陪同作答并即时看到解释。这让一次评估的沟通成本从「医生事后单独讲解」变成「当场一起看懂」。',
          },
          {
            src: asset('/img/cga/04.webp'),
            caption: '量表管理',
            note: '新增量表只需定义题型、评分规则与解释文案，评估主流程不需要改动代码。',
            story: '量表引擎是整个系统的支点。我们特意把「题型」抽象到配置层：选填、单选、多选、量表打分各一个组件，评分规则写成可执行配置。新增一套量表的成本从「改代码 + 回归测试」降到「写一份配置」。',
          },
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
        media: [
          {
            src: asset('/img/cga/06.webp'),
            caption: '患者管理',
            note: '患者档案、历史评估记录与风险趋势集中呈现，家属信息与评估员归属一并管理。',
            story: '这一屏解决的是「结果沉不下去」的问题。过去纸质评估做完就进档案袋了，康复科想看一个人三个月的变化根本没有入口。现在每次评估都是可查询的记录，时间序列直接可视化成趋势。',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 成本、性能与交互的联合优化',
        body: [
          '项目从业务需求到产品落地全链路独立完成，重点投入在成本控制、系统性能与用户交互三条线的联合优化。',
          '具体做法包括：用规则引擎承担确定性的计分与解释，把模型调用收敛到真正需要推理的汇总环节；对评估员高频路径做键盘流优化，减少在临床现场的点击成本。',
          '落地成本同样被当作一等指标：整套设备用 DELL 迷你主机（二手约 1k）+ 华为平板（约 600）即可部署，门槛控制在 5k 以内，系统可接入医院内网，让评估服务能下沉到粤东粤西的医院与诊所。',
        ],
        media: [
          {
            src: asset('/img/cga/08.webp'),
            caption: '评估流程与结果',
            note: '完成后自动汇总各维度分项、总分与建议，结果可打印作为纸质报告输出。',
            story: '模型调用是最容易失控的成本项。一开始我们让模型同时负责计分和总结，结果既慢又不稳定；后来把确定性部分全部还给规则引擎，只把「多条件综合描述」这一段留给模型，成本和稳定性都同时改善。',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 从原型到生产',
        body: [
          '仓库以 demo1 为核心，先跑通评估流程与量表引擎的基本闭环，再向生产环境推进。',
          '一期刻意保留了 Repository 抽象层，让本地演示与医院内网部署共用同一套业务代码，降低换环境的风险。',
          '由于医院 HIS 系统的审核接入周期较长，系统暂时以独立系统方式运行，通过介入医院内网的方式在院内访问，不阻塞主流程上线。',
        ],
        media: [
          {
            src: asset('/img/cga/voice.webp'),
            caption: '语音伴侣交互',
            note: '评估过程中可由语音伴侣播报题目与引导作答，AIS 等量表的对话记录与评估结论挂在同一条时间线上，现场人员不用一边看屏幕一边翻纸质量表。',
            story: '这是临床现场最直接的诉求：老人听力与视力都下降，评估员要同时读题、记录、计时。语音伴侣把「读题」这件事从评估员身上拿走，让他能把注意力放在判断上。实现上要注意打断与超时兜底——现场环境噪声大，识别失败时必须能退回手动确认，否则一次误识别就会让整场评估失去可信度。',
          },
          {
            src: asset('/img/cga/11.webp'),
            caption: '系统管理',
            note: '量表定义、用户权限与评估记录统一管理，为后续对接 HIS 预留了稳定的数据出口。',
            story: '为了让后续能接 HIS，我们在数据层没有自造格式，而是把评估记录抽象成标准结构。独立运行只是当前的部署形态，不是数据模型的限制。',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 上线状态与验证范围',
        body: [
          '系统已完成上线与本地部署，在广东省人民医院老年康复科与广州港麓湖一号康颐养医院完成测试。',
          '已接入量表包括 MMSE、GDS-15、MORSE、GAD-7、EAT-10、FRAIL、Fried、MNA-SF、AIS 九套，覆盖认知、情绪、跌倒、焦虑、吞咽、衰弱、营养与睡眠八个维度。',
          '标准侧：依据 WS/T 888—2026，在该标准正式实施前的短时间内完成系统上线，并通过校企合作把开发与运营成本压到最低，为后续推广留出空间。',
        ],
      },
    ],
    gallery: [
      { src: asset('/img/cga/cover.webp'), caption: 'CGA-Smart 老年综合评估系统首页' },
      { src: asset('/img/cga/voice.webp'), caption: '语音伴侣交互' },
      { src: asset('/img/cga/01.webp'), caption: '系统登录与角色入口' },
      { src: asset('/img/cga/02.webp'), caption: '评估工作台与风险提示' },
      { src: asset('/img/cga/04.webp'), caption: '量表管理' },
      { src: asset('/img/cga/06.webp'), caption: '患者管理' },
      { src: asset('/img/cga/08.webp'), caption: '评估流程与结果' },
      { src: asset('/img/cga/11.webp'), caption: '系统管理' },
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
    cover: asset('/img/moca/cover.webp'),
    coverCaption: 'MoCA 高质量 EEG 数据采集系统 · 统一刺激与作答，同步标注行为与 EEG 信号',
    tags: ['实验范式', '串口通信', '脑电事件标记', 'Python', '实时打标', '电子化量表'],
    stack: ['串口设备通信', '实时事件打标', '实验范式设计', '数字化量表', 'Python', 'Electron / 桌面端'],
    period: '2025.10 – 至今',
    role: '组长 & 开发者（科研软件开发实习生）',
    org: '中国科学院深圳先进技术研究院 · 神经接口实验室 · 阿兹海默症图示训练系统',
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
          '电子化本身也不是目的。过去量表靠纸质判定，耗时耗力，且无法在毫秒级精度上人工打标；把它电子化只是把「慢且不准」的记录方式换成「快且准」的记录方式，真正的目标始终是让行为事件与脑电信号落在同一条时间轴上。',
        ],
        media: [
          {
            src: asset('/img/moca/cover.webp'),
            caption: 'MoCA 高质量 EEG 数据采集系统',
            note: 'MoCA 任务统一刺激与作答，同步标注患者行为与 EEG 信号，让认知任务与脑电采集落在同一条时间轴上。',
            story: '这是整套系统要解决的核心命题：两条时间轴对齐。评估走临床节奏，采集走设备节奏，一旦事件靠人工事后补录，信号段与行为事件就无法可靠对应——数据采到了，却用不了。',
          },
          {
            src: asset('/img/moca/moca-01.webp'),
            caption: '系统首页',
            note: '首页提供开始评估、历史记录与系统设置三个入口，操作员不需要理解内部结构就能进入流程。',
            story: '这套系统要在真实病房里用，所以界面语言必须围着操作员转。首页只留三个入口，是因为实验现场的注意力窗口很短——操作员要盯着患者和设备，不能在菜单里迷路。',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — 码表驱动的打标软件',
        body: [
          '核心是把「码表」作为唯一事实来源。旧码表用 moduleId × 2 的粗粒度规则，只能区分开始与结束；新码表精细化为 43 个打标点，把题目呈现、onset、开始、结束拆成独立事件。',
          '以「视空间-连线」为例：题目呈现 (4) → 第一笔开始 (5) → 全部完成 (6)，三个事件让后续分析可以精确切分出笔迹运动段。',
          '整套评估被拆成 14 个可独立推进的环节，每个环节都有明确的 UI 状态、任务提示与打标事件，A 键推进环节、B 键全局标记异常与中断。',
        ],
        media: [
          {
            src: asset('/img/moca/moca-02.webp'),
            caption: '视空间连线测验',
            note: '顶部同时显示任务状态与打标设置入口，题目呈现这一事件在图形加载的瞬间就被写入事件流。',
            story: '连线条测验是整个范式里最能说明「打标精细化」价值的环节。旧码表只有一个 moduleId，切不出笔迹运动段；细化后题目呈现、第一笔开始、全部完成各自独立，解码侧才能把运动想象任务的有效区间单独对齐。',
          },
          {
            src: asset('/img/moca/moca-04.webp'),
            caption: '立方体复制',
            note: '参考图与绘图区并排，顶部实时显示第一笔画线事件，绘图动作本身成为可分析的事件序列。',
            story: '绘图类任务对打标延迟最敏感——笔画之间可能只差几百毫秒。所以这里刻意做成「画一笔就出一个事件」，让分析侧拿到的是真实笔画轨迹而不是一个模糊的「画图时段」。',
          },
          {
            src: asset('/img/moca/moca-05.webp'),
            caption: '时钟绘制',
            note: '指定时间提示与绘图区配合，同样走笔画级事件打标。',
            story: '时钟任务在临床上既是认知指标也是视觉空间指标。把它做成和立方体复制完全一致的事件结构，解码侧就能用同一套脚本处理多个绘图任务。',
          },
          {
            src: asset('/img/moca/moca-20.webp'),
            caption: '警觉性测试',
            note: '页面提示仔细聆听数字，听到目标数字 1 时按空格键；「听到」这一瞬间正是需要被标记的认知事件。',
            story: '警觉性任务是少有的能把「内在状态」和「外在按键」同时抓到的环节——实验上我们发现患者听到目标数字时前额叶出现显著信号变化。这个发现正是靠这里毫秒级准确的事件标记才看得见。',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — 全流程时序',
        body: [
          '评估以环节 0 总览页开场，随后进入 30 秒静息休息段（rest-start → 5 秒间隔 sentinel × N → rest-end），再由 task-start(96) 进入第一个测试环节。',
          '操作员 A 键推进环节、全局 B 键标记异常与中断。串口下行指令触发采集，上行事件流经码表映射后回写界面，进度与状态实时刷新。',
          '每个环节的完整打标流程与 UI 切换时序都被逐一写死，包括每屏背景色、字号与 A 键行为，让操作员交接时不需要口头补充。',
        ],
        media: [
          {
            src: asset('/img/moca/moca-15.webp'),
            caption: '码表设置',
            note: '按模块与事件配置串口值与启用状态，支持保存与恢复默认配置——码表是系统里唯一的事实来源。',
            story: '码表之所以做成可视化配置而不是写死在代码里，是因为实验室的设备型号和实验范式会变。改一次码表就能适配新设备，不用动主流程。',
          },
          {
            src: asset('/img/moca/moca-12.webp'),
            caption: '串口配置',
            note: '可选择端口、波特率、数据位、停止位与校验位并保存配置，适配多家医院不同型号的采集设备。',
            story: '适配三家医院意味着要面对三套不同的串口参数。我们把参数抽成配置而不是写死，就是为了这件事——现场换一台设备，只改配置不改代码。',
          },
          {
            src: asset('/img/moca/moca-13.webp'),
            caption: '连接状态',
            note: '显示连接状态与当前参数，提供连接测试、断开连接与 Mock 调试模式。',
            story: 'Mock 模式是我们自己加的：没有设备的时候也能完整走一遍评估流程做界面调试。现场出问题时第一件事就是切到 Mock 判断是软件问题还是设备问题，能省下大量排查时间。',
          },
          {
            src: asset('/img/moca/moca-14.webp'),
            caption: '调试选项',
            note: '串口日志配合快速测试与连续发送测试，用于检查通信过程与时序。',
            story: '20ms 级打标精度不是靠运气，是靠能看见每一帧收发。日志和连续发送测试这两个功能是排查时序问题的眼睛。',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 信号干扰与外围设备',
        body: [
          '在真实病房环境中，商用设备与 PC 共地会带来干扰。项目融合神经科学与软件工程两侧，设计了独立的外围设备来隔离信号，同时把采集设备适配层抽象出来，兼容多家医院的设备型号。',
          '关键工程点是把打标延迟压到 20ms 级，这要求串口读写、事件分发与时间戳记录三段都不能有排队阻塞。',
          '另一处难点是降低软件操作本身对患者信号的干扰。为此我们引入了外设控制，把「按 A 键推进」这个动作从患者身上挪到设备侧。',
        ],
        media: [
          {
            src: asset('/img/moca/moca-10.webp'),
            caption: '休息提示',
            note: '休息阶段用醒目文字提示当前状态，避免操作员误以为程序卡死。',
            story: '30 秒静息是基线段，要求患者完全放松。所以这个界面刻意做得很「空」——没有按钮、没有动画，只有状态提示，减少视觉刺激也减少误触。',
          },
          {
            src: asset('/img/moca/moca-07.webp'),
            caption: '记忆测试',
            note: '系统朗读词语，界面提示受试者聆听，朗读结束后进入回忆阶段，朗读起止各自打标。',
            story: '记忆任务的时间结构直接影响解码窗口划分。朗读开始、朗读结束、被试开始回忆三个点必须分开标记，否则后面没法区分「听到」和「想」这两种不同神经活动。',
          },
          {
            src: asset('/img/moca/moca-33.webp'),
            caption: '延迟回忆任务提示',
            note: '系统提示回忆之前学习过的词语，等待实验人员操作后才进入选择界面。',
            story: '延迟回忆是整条记忆链路里最接近临床价值的环节——它对应海马相关的真实功能。所以我们给它留了最完整的打标：等待、操作、选择分别成点。',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 范式与业务的共同设计',
        body: [
          '系统重构以「最终码表为唯一标准」推进，旧规则全部废弃，避免新旧两套事件语义在历史数据里混用。',
          '文档层面把 14 个环节的完整打标流程与 UI 切换时序逐一写死，包括每屏背景色、字号与 A 键行为，让操作员交接时不需要口头补充。',
          '工程上经过了 30 余个小版本迭代，持续优化实验范式与软件设计，把软件本身的操作对患者信号的干扰降到最低，并实现了 50 个不同的信号标值与十余个认知任务，同步记录人工监督、EEG 采样与系统操作三类信息。',
        ],
        media: [
          {
            src: asset('/img/moca/moca-25.webp'),
            caption: '句子复述第一句',
            note: '页面显示复述文本、录音状态与计时信息，语音起止与录音状态同时进入事件流。',
            story: '语言任务要同时记录「说的内容」和「说的时间窗」。录音状态指示让语音边界可以直接从操作记录里读出来，不需要后期对着音频波形人工对齐。',
          },
          {
            src: asset('/img/moca/moca-27.webp'),
            caption: '语言流畅性录音',
            note: '界面提示说出动物名称，展示录音状态与计时；保存后提供音频回放控件。',
            story: '语言流畅性常用「词语流畅性」指标：单位时间内说出的动物名称数量。录音与计时分离后，这个指标可以自动算出来，操作员不用再拿秒表。',
          },
          {
            src: asset('/img/moca/moca-43.webp'),
            caption: '测试结果',
            note: '结果页面展示受试者信息、总分、各模块结果与导出 ZIP 入口，一屏看完评估全貌。',
            story: '结果页是这套系统从「实验工具」变成「临床工具」的一步。研究者要看的是信号，操作员和医生要看的是分数与分项，两种需求在同一份结果里各自成立。',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 临床验证与论文',
        body: [
          '打标软件已在南京鼓楼医院、深圳第二人民医院、广州三九脑科医院测试 20+ 患者数据，并申请软件著作权。',
          '相关工作以第二作者身份完成 ICLR 2027 论文（当前处于 Rebuttal 阶段），从实验设计到著作撰写的全流程均有参与。',
          '研究侧的核心贡献是解决 EEG 解码领域的「黑盒」问题：Stage1 选取 4 个不同 backbone 冻结，在 8 个数据集上构建 adapter 并只训练简单线性分类头，保证模型能力主要取决于 backbone 自身的 encode；Stage2 设计时间、空间、频域、微事件四个方向的扰动，用线性探测模型的 clean 与扰动结果对比，实现「开盒」。',
        ],
        media: [
          {
            src: asset('/img/moca/moca-11.webp'),
            caption: '历史记录',
            note: '列表展示记录时间与总分，支持搜索、查看、导出与打开记录文件夹。',
            story: '「打开记录文件夹」这个按钮是给研究用的——每次采集的原始文件、事件表、配置快照都放在同一个目录里，分析脚本可以直接按目录批量跑，不需要人工整理。',
          },
          {
            src: asset('/img/moca/moca-44.webp'),
            caption: '导出评估报告',
            note: '选择导出后弹出保存窗口，可选择保存位置与 ZIP 文件名。',
            story: '导出 ZIP 里包含评估报告、事件表与配置三部分。这是为了让一次采集可以独立复现——换台机器、换个人来跑，数据依然完整。',
          },
          {
            src: asset('/img/moca/moca-16.webp'),
            caption: '关于系统',
            note: '展示软件版本、构建日期、技术环境与版权信息，与软著登记材料一致。',
            story: '这屏是为软著登记准备的。版本号与构建日期必须和交付的代码快照严格对应，否则登记材料里的描述就成了无法核验的说法。',
          },
        ],
      },
    ],
    gallery: [
      { src: asset('/img/moca/cover.webp'), caption: 'MoCA 高质量 EEG 数据采集系统' },
      { src: asset('/img/moca/moca-01.webp'), caption: '系统首页' },
      { src: asset('/img/moca/moca-02.webp'), caption: '视空间连线测验' },
      { src: asset('/img/moca/moca-04.webp'), caption: '立方体复制' },
      { src: asset('/img/moca/moca-05.webp'), caption: '时钟绘制' },
      { src: asset('/img/moca/moca-07.webp'), caption: '记忆测试' },
      { src: asset('/img/moca/moca-20.webp'), caption: '警觉性测试' },
      { src: asset('/img/moca/moca-25.webp'), caption: '句子复述' },
      { src: asset('/img/moca/moca-33.webp'), caption: '延迟回忆' },
      { src: asset('/img/moca/moca-43.webp'), caption: '测试结果' },
      { src: asset('/img/moca/moca-44.webp'), caption: '导出评估报告' },
      { src: asset('/img/moca/moca-15.webp'), caption: '码表设置' },
      { src: asset('/img/moca/moca-13.webp'), caption: '连接状态' },
    ],
    diagrams: [{ id: 'moca-seq', title: '打标全流程时序', code: mocaSequence }],
  },

  {
    slug: 'fupan',
    case: 'CASE 04',
    title: '中国电信防返贫智能体',
    subtitle: '政府场景风险识别智能体',
    domain: 'AI AGENT',
    summary:
      '基于 Spring AI 与本地化部署的 Qwen 量化模型，构建带证据推理输出的防返贫风险识别智能体，Agent 与 MCP Tools 结构化插入业务链路。',
    cover: asset('/img/fupanpolymed/fupan-01.webp'),
    coverCaption: '防返贫智能体对话与风险识别',
    tags: ['Spring AI', 'ReactAgent', 'Qwen', 'LangGraph', 'MCP', '本地部署'],
    stack: ['Spring AI / Spring AI Alibaba', 'ReactAgent', 'OpenAI-compatible 适配', 'vLLM / Qwen 本地部署', 'Next.js', 'LangGraph'],
    period: '2026.07.06 – 2026.07.31',
    role: 'AI 应用研发实习生',
    org: '中国电信数智科技有限公司 · 海南分公司研发中心',
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
          '数据侧的现实是数据项分散在不同来源中，规则散落在人工经验里。项目的核心命题因此被定义成：如何把分散的政策、农户资料、家庭信息、财政负担与人口收入，转化为有依据的返贫值。',
        ],
        media: [
          {
            src: asset('/img/fupanpolymed/fupan-06.webp'),
            caption: '多模态文件输入',
            note: '农户资料以图片为主且分辨率、格式不一，系统在输入阶段即做理解与字段归一化。',
            story: 'OCR 只能认字，不能理解。这一版解决的是「OCR 精度够但没有主体性」的问题：调用本地部署的 Qwen VL 尽量补全无法分辨的信息，再综合多份材料理解同一户人家，最后用 schema 约束返回值，保证决策阶段不会误判或丢数据。',
          },
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
        media: [
          {
            src: asset('/img/fupanpolymed/fupan-01.webp'),
            caption: '防返贫智能体对话',
            note: '对话中直接给出风险判断与依据的数据项，基层工作人员可以逐条核对来源。',
            story: '这一屏决定了这个原型在政府场景能不能用。给结论不给依据，基层就没法采信；所以每一句风险提示后面都挂着一个可点开的数据项来源，模型反而退到了辅助位置。',
          },
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
        media: [
          {
            src: asset('/img/fupanpolymed/fupan-04.webp'),
            caption: '风险识别结果与证据',
            note: '输出结构化为「结论 + 数据项 + 来源」，可直接进入人工复核环节。',
            story: 'Spring AI 的好处在于它把 Agent 的三块能力（工具注册、模型选工具、上下文总结）做成了可组合的部件，而不是要自己从头写编排。这是我们两周内能出可用原型的关键。',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 合规、审计与数据治理',
        body: [
          '政府场景的特殊性决定了三件事必须先设计：数据治理与 5000 组样本建设方案、安全合规与审计设计、以及风险识别模型的第一阶段实施边界。',
          '项目采用 E2E 的 Dify / Spring AI 工作流实现多模态文件输入，配合量化模型本地化部署，保证敏感数据不出内网。',
          '技术选型上使用 Spring 与现代 JDK 以满足政企安全审计要求，从数据输入到输出全部在内网完成，确保信息不外流。',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 分阶段路线图',
        body: [
          '设计文档以编号序列组织：项目现状分析 → Spring AI 层级架构适配 → 风险识别业务规则 → Agent 与 MCP Tools 插入设计 → 数据治理与样本建设 → 安全合规与审计 → 第一阶段实施方案 → 帮扶资产模型扩展 → 路线图与验收标准。',
          '每一步都有对应的交付物与验收口径，而不是「继续优化」。',
          '工作流侧用 Dify 串联材料识别、字段归一化、规则初判与报告生成；规则刚性写入评估逻辑，再结合 RAG 与最新政策动态评估返贫可能性与成因，并给出贴合每户实际的解决办法。',
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
      { src: asset('/img/fupanpolymed/fupan-01.webp'), caption: '防返贫智能体对话' },
      { src: asset('/img/fupanpolymed/fupan-04.webp'), caption: '风险识别结果与证据' },
      { src: asset('/img/fupanpolymed/fupan-06.webp'), caption: '多模态文件输入' },
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
    cover: asset('/img/fupanpolymed/polymed-03.webp'),
    coverCaption: 'PolyMed 智能用药小程序 · 患者端',
    coverRatio: '736 / 1600',
    tags: ['RAG', '多模态', 'Agent', '微信小程序', '医患协同'],
    stack: ['RAG 用药知识库', 'VL 多模态识别', 'Agent 微服务', '微信小程序', '语音交互'],
    period: '2025.10 – 至今',
    role: '软件开发（团队协作）',
    org: '中山大学医学院 · PolyMed 智能用药系统',
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
          '具体到病历，老年患者的用药清单复杂且需要长期定时服用——降压药、胰岛素以及各类慢性病药物，一旦中断或误服，后果比疾病本身更严重。而记忆与认知能力的下降，恰恰是这类患者人群的共性。',
        ],
        media: [
          {
            src: asset('/img/fupanpolymed/polymed-01.webp'),
            caption: '患者端 · 用药助手',
            ratio: '736 / 1600',
            note: '患者在小程序内直接查看自己的用药清单与当前服药状态，扫码注册后即与医护人员绑定。',
            story: '患者端的第一版只有药方列表，护士每查一次都要在群里喊人。后来加了「今天该吃什么」这个入口，患者自己就能确认，才真正有人用——用药管理的第一步不是让医生更省事，是让患者不用麻烦医生。',
          },
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
        media: [
          {
            src: asset('/img/fupanpolymed/polymed-05.webp'),
            caption: '用药方案与注意事项',
            ratio: '736 / 1600',
            note: '每条医嘱都带着服用时间、剂量与注意事项，Agent 的回答直接绑定到这条具体医嘱上。',
            story: '用药助手最难的一点是「不能说错」。所以 Agent 的回答不是自由生成的，而是从该患者的医嘱结构化记录里检索出来再组织成话术——宁可说得啰嗦一点，也不能给出与本人医嘱不符的通用建议。',
          },
          {
            src: asset('/img/fupanpolymed/polymed-09.webp'),
            caption: '家属端监护',
            ratio: '736 / 1600',
            note: '家属端可以查看患者是否按时服药，并接收异常提醒，形成远程照护闭环。',
            story: '家属端是这个系统里最被低估的部分。老年人自己未必会用智能手机，但子女会。于是把「照护」这件事放到子女那一侧，父母那一侧只保留最简的操作。',
          },
          {
            src: asset('/img/fupanpolymed/polymed-13.webp'),
            caption: '医生端医嘱',
            ratio: '736 / 1600',
            note: '医生端下达医嘱后自动结构化落库并同步至患者与家属端，服药执行情况实时回传。',
            story: '医生端是整个闭环的起点。这里我们刻意没有让医生填复杂表单——医嘱仍然按他们习惯的方式开，再由系统转成结构化数据给到另外两端。强迫医生换工作方式，是这类院内系统最常见的失败原因。',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — RAG 与多模态识别',
        body: [
          '采用 RAG 构建微服务化的用药助手 Agent，知识源为医学院提供的患者病例与药方。',
          'VL 多模态能力用于把处方图像等输入转成可匹配的结构化药物信息，再与药物数据库比对完成识别匹配。',
          '工程形态上采用 yudao-vue-pro 框架搭建后端与管理端，前端使用 unibest 框架构建微信小程序，Agent 部分由 Python 的 LangChain 微服务承载。',
        ],
        media: [
          {
            src: asset('/img/fupanpolymed/polymed-06.webp'),
            caption: '处方识别与药物匹配',
            ratio: '736 / 1600',
            note: '扫描用药清单后由 VL 模型识别药物信息，再与药物数据库比对完成匹配。',
            story: '「扫码识别处方」这一步省掉的是护士的手工录入。老年人出院时拿到的是纸质药方，让家属手动敲几十个药名既慢又容易错；识别出来再让用户确认，比直接写进库可靠得多。',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — 粤语场景的工程挑战',
        body: [
          '患者群体以粤语为主，语音识别与生成的方言能力直接影响可用性，Agent 需要在检索与生成两侧都处理方言输入。',
          '另一处工程考量是隐私：用药数据属于敏感健康信息，微服务拆分时需要避免在检索链路中泄漏无关病例。',
          '医疗安全上，依托中山大学医学院的专业指导，系统设计了多重用药的关系规则，确保患者不会错误用药导致不良反应。',
        ],
        media: [
          {
            src: asset('/img/fupanpolymed/polymed-11.webp'),
            caption: '语音对话问药',
            ratio: '736 / 1600',
            note: '患者可直接用粤语或普通话询问当前用药信息，并口头上报不良反应。',
            story: '粤语支持是可用性的分水岭。目标人群是粤东粤西的中老年人，很多人普通话能听懂但说不流利，语音输入一开口就露怯。最后我们把检索侧和生成侧都做了方言适配，才让「直接问」这件事真的成立。',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — 从原型到三端',
        body: [
          '项目从 RAG 与 Agent 的单点能力验证，逐步扩展到患者端、家属端与医生端的完整业务流。',
          '三端的分工在早期就被明确划分，避免出现「患者端承担医生端职责」的设计扭曲。',
          '在团队的分工里我负责软件开发，覆盖需求拆解、任务排布与多项目并行推进；系统的多端实现与业务规则由团队协作完成。',
        ],
        media: [
          {
            src: asset('/img/fupanpolymed/polymed-14.webp'),
            caption: '出院后关照服务',
            ratio: '736 / 1600',
            note: '用药开始后的 15 天、30 天等节点自动发起用药随访与心理评测，并回收反馈。',
            story: '出院后关照是我们自己加的一环，逻辑来自临床上「出院两周内是问题高发期」的经验。系统按时间节点自动发起随访，把「记得回访」变成系统职责而不是个人自觉。',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — 当前状态',
        body: [
          '三端架构与 RAG 用药助手 Agent 已完成实现，患者可用粤语或普通话与 Agent 沟通日常用药方案及注意事项。',
          '医嘱智能下达与服药信息实时监控链路已打通，用药错误的可观测性显著提升。',
          '系统每日记录服药时间，为医生提供医学参考依据；多药联用的关系规则由医学院专业指导共同制定。',
        ],
      },
    ],
    gallery: [
      { src: asset('/img/fupanpolymed/polymed-03.webp'), caption: 'PolyMed 智能用药小程序 · 患者端', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-01.webp'), caption: '患者端 · 用药助手', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-05.webp'), caption: '用药方案与注意事项', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-06.webp'), caption: '处方识别与药物匹配', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-09.webp'), caption: '家属端监护', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-11.webp'), caption: '语音对话问药', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-13.webp'), caption: '医生端医嘱', ratio: '736 / 1600' },
      { src: asset('/img/fupanpolymed/polymed-14.webp'), caption: '出院后关照服务', ratio: '736 / 1600' },
    ],
    diagrams: [{ id: 'polymed-arch', title: '三端与 Agent 服务层', code: polymedArch }],
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
