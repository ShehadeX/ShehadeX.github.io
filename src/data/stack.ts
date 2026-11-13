/**
 * 技术栈知识图谱。
 *
 * 结构仿 Obsidian 的 Graph View：
 *   - 分类是枢纽节点（hub），技术项挂在其周围
 *   - 边 = 分类归属；选中项目后，边 = 项目 → 该项目用到的技术
 *   - 节点大小 = 该技术在多少个项目里出现过（使用频次）
 *
 * 布局完全确定性（不使用随机数），保证每次渲染位置一致。
 */

export interface StackItem {
  id: string
  name: string
  /** 一句话说明：这个东西我实际用它做了什么 */
  note: string
  /** 使用该技术的项目 slug */
  projects: string[]
}

export interface StackCategory {
  id: string
  name: string
  caption: string
  items: StackItem[]
}

export const stackCategories: StackCategory[] = [
  {
    id: 'frontend',
    name: '前端工程',
    caption: '界面与交互的交付层',
    items: [
      {
        id: 'vue3',
        name: 'Vue 3',
        note: 'BidOS 工作台、CGA-Smart 评估端与 PolyMed 管理后台的主框架，全部项目型界面都基于它。',
        projects: ['bidos', 'cga-smart', 'polymed'],
      },
      {
        id: 'vite',
        name: 'Vite',
        note: 'CGA-Smart 与 PolyMed 后台的构建工具，冷启动快，改量表定义时不需要等打包。',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        note: '把量表题型、评分规则与接口契约写成类型，让规则引擎的改动能被编译器拦住。',
        projects: ['cga-smart'],
      },
      {
        id: 'elementplus',
        name: 'Element Plus',
        note: 'CGA-Smart 评估工作台的表单与表格撑起 21 条量表导航密度；PolyMed 家属端与医生端的穿梭框与用药时间轴同样基于它。',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'pinia',
        name: 'Pinia',
        note: 'CGA-Smart 全局状态管理，评估进度与实时风险提示共享同一份状态。',
        projects: ['cga-smart'],
      },
      {
        id: 'echarts',
        name: 'ECharts',
        note: 'CGA-Smart 各维度分项与风险雷达的可视化层。',
        projects: ['cga-smart'],
      },
      {
        id: 'nextjs',
        name: 'Next.js',
        note: '防返贫 Agent 的前端工作台与结果复核页。',
        projects: ['fupan'],
      },
      {
        id: 'miniprogram',
        name: '微信小程序',
        note: 'PolyMed 患者端与家属端，用药提醒、处方识别与语音问药都在这里跑。',
        projects: ['polymed'],
      },
      {
        id: 'tailwind',
        name: 'Tailwind CSS',
        note: '本作品集自身的样式层，用 4px 栅格与受限色板保证视觉一致性。',
        projects: ['portfolio'],
      },
      {
        id: 'signature',
        name: 'signature_pad',
        note: 'CGA-Smart 的签名板采集，评估结论需患者与评估员签字确认。',
        projects: ['cga-smart'],
      },
    ],
  },
  {
    id: 'backend',
    name: '服务端与交付形态',
    caption: '业务逻辑与运行形态',
    items: [
      {
        id: 'springboot',
        name: 'Spring Boot',
        note: 'CGA-Smart 后端与 PolyMed 管理后台底座，量表定义库、计分引擎与数据抽象分层。',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'ruoyi',
        name: 'RuoYi-Vue-Pro',
        note: 'PolyMed 医生端与管理后台的权限、字典、代码生成与定时任务底座，避免重复造轮子。',
        projects: ['polymed'],
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        note: 'BidOS 导出服务与文档解析流水线；Vite 生态下与 Vue 前端的构建链路同源。',
        projects: ['bidos', 'cga-smart'],
      },
      {
        id: 'springai',
        name: 'Spring AI / Alibaba',
        note: '防返贫项目的 Agent 底座：工具注册、模型选工具、上下文总结做成可组合部件。',
        projects: ['fupan'],
      },
      {
        id: 'flask',
        name: 'Flask',
        note: 'BidOS 后端，REST 接口层 + 六阶段工作流状态机。',
        projects: ['bidos'],
      },
      {
        id: 'python',
        name: 'Python',
        note: '模型适配、脚本化数据处理与设备通信的主力语言。',
        projects: ['bidos', 'moca', 'fupan', 'polymed'],
      },
      {
        id: 'fastapi',
        name: 'FastAPI',
        note: '模型服务的标准化接口层，统一 OpenAI-compatible 协议。',
        projects: ['fupan'],
      },
      {
        id: 'sscat',
        name: 'SSCOM 串口工具',
        note: 'EEG 采集设备联调与协议逆向：先用 SSCOM 抓原始串口帧，再写 Python 驱动。',
        projects: ['moca'],
      },
      {
        id: 'electron',
        name: 'Electron',
        note: 'MoCA 打标软件的桌面端形态，需要独占串口与持续在线。',
        projects: ['moca'],
      },
      {
        id: 'restapi',
        name: 'REST API',
        note: '前后端解耦的标准契约，也是产品能独立部署的前提。',
        projects: ['bidos', 'cga-smart', 'fupan'],
      },
      {
        id: 'redis',
        name: 'Redis',
        note: '缓存与任务队列：模型推理结果按会话缓存避免重复算力，长耗时任务丢进队列异步消化。',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'websocket',
        name: 'WebSocket',
        note: '长连接实时推送：BidOS 六阶段的处理进度、MoCA 设备采集状态都靠它推到前端，不靠轮询。',
        projects: ['bidos', 'moca'],
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI 与模型',
    caption: '从编排到多模态',
    items: [
      {
        id: 'reactagent',
        name: 'ReactAgent',
        note: '防返贫项目的 Agent 模式：工具注册 → 模型选工具 → 上下文总结 Hook。',
        projects: ['fupan'],
      },
      {
        id: 'langgraph',
        name: 'LangGraph',
        note: '把流程拆成有状态的图节点，支持中断、恢复与人工介入。',
        projects: ['fupan'],
      },
      {
        id: 'mcp',
        name: 'MCP Tools',
        note: '把业务能力封装成工具，Agent 通过标准协议调用而非硬编码。',
        projects: ['fupan'],
      },
      {
        id: 'dify',
        name: 'Dify',
        note: '多模态文件输入与报告生成的工作流编排，配合 Spring AI 补足工程化部分。',
        projects: ['fupan'],
      },
      {
        id: 'rag',
        name: 'RAG',
        note: '用药知识库与政策动态检索，PolyMed 问药与防返贫政策匹配都依赖它。',
        projects: ['fupan', 'polymed'],
      },
      {
        id: 'qwen',
        name: 'Qwen / Qwen-VL',
        note: '本地部署的量化模型，敏感数据不出内网；VL 版本补全 OCR 无法分辨的信息。',
        projects: ['fupan'],
      },
      {
        id: 'vllm',
        name: 'vLLM',
        note: '本地模型推理服务，OpenAI-compatible 适配让上层无需感知部署细节。',
        projects: ['fupan'],
      },
      {
        id: 'workflow',
        name: 'LLM Workflow',
        note: 'BidOS 的六阶段工作流：材料导入 → 初判 → 深度分析 → 目录 → 准备 → 导出。',
        projects: ['bidos'],
      },
      {
        id: 'ocr',
        name: 'Qwen OCR',
        note: '招标与帮扶材料的关键信息抽取，输出结构化字段供后续规则初判使用。',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'ttsasr',
        name: 'TTS / ASR',
        note: 'PolyMed 语音问药与播报；CGA-Smart 语音伴侣的播报链路。',
        projects: ['polymed'],
      },
      {
        id: 'eeg',
        name: 'EEG 解码',
        note: '冻结骨干 + 线性读出，配合八种预注册干预协议定位模型真正依赖的信号结构。',
        projects: ['research'],
      },
      {
        id: 'pytorch',
        name: 'PyTorch',
        note: 'EEG-FM 骨干与读出层的训练框架；诊断基准里的八种干预协议也在这里实现。',
        projects: ['research'],
      },
      {
        id: 'cuda',
        name: 'CUDA',
        note: '跨架构解码与批量干预实验的 GPU 加速层，决定了八协议 × 多模型的可跑规模。',
        projects: ['research'],
      },
      {
        id: 'numpy',
        name: 'NumPy',
        note: '信号段切片、通道重排与统计量的底层算子，协议实现前处理阶段的主语言。',
        projects: ['research', 'moca'],
      },
    ],
  },
  {
    id: 'data',
    name: '数据与存储',
    caption: '状态、产物与设备',
    items: [
      {
        id: 'sqlite',
        name: 'SQLite',
        note: 'BidOS 阶段状态与结构化产物入库，大文件走文件系统避免数据库膨胀。',
        projects: ['bidos'],
      },
      {
        id: 'repo',
        name: 'Repository 抽象',
        note: 'CGA-Smart 数据访问统一抽象，原型期用 localStorage 模拟后端，替换时业务零改动。',
        projects: ['cga-smart'],
      },
      {
        id: 'fsartifact',
        name: '文件系统产物',
        note: '源文件、导出物与版本分离存放，每份产物带来源标记。',
        projects: ['bidos'],
      },
      {
        id: 'vector',
        name: '向量检索',
        note: '按项目背景精准召回，而不是全库碰运气。',
        projects: ['fupan', 'polymed'],
      },
      {
        id: 'serial',
        name: '串口设备通信',
        note: 'MoCA 打标软件与 EEG 采集设备的实时通信，事件标记精度到毫秒。',
        projects: ['moca'],
      },
      {
        id: 'paradigm',
        name: '实验范式设计',
        note: 'MoCA 任务的刺激呈现与作答时序定义，决定了信号段能否被精确切分。',
        projects: ['moca'],
      },
      {
        id: 'mysql',
        name: 'MySQL',
        note: 'PolyMed 三端（患者 / 家属 / 医生）的用药方案与随访记录持久化。',
        projects: ['polymed'],
      },
      {
        id: 'qdrant',
        name: 'Qdrant',
        note: 'PolyMed 用药知识库与多模态处方检索的向量库，按项目与用药场景精准召回。',
        projects: ['polymed'],
      },
      {
        id: 'eventcode',
        name: '事件码表',
        note: 'MoCA 的 43 个精细化打标点定义，是行为事件与 EEG 信号对齐的唯一真值来源。',
        projects: ['moca'],
      },
    ],
  },
  {
    id: 'devops',
    name: '部署与运维',
    caption: '从代码到线上',
    items: [
      {
        id: 'docker',
        name: 'Docker',
        note: 'BidOS 与各服务的打包交付，保证甲方环境可复现。',
        projects: ['bidos'],
      },
      {
        id: 'k8s',
        name: 'K8s',
        note: 'BidOS 在甲方主机的集群部署与滚动更新，服务多副本保可用。',
        projects: ['bidos'],
      },
      {
        id: 'ecs',
        name: 'ECS / 云主机',
        note: '线上服务与模型服务的算力承载，含本作品集自身的部署。',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'cicd',
        name: 'CI / CD',
        note: 'GPT-Dots 自动构建与 24 小时监控，异常自动告警。',
        projects: ['portfolio'],
      },
      {
        id: 'nginx',
        name: 'Nginx',
        note: '静态资源分发与反向代理。',
        projects: ['portfolio'],
      },
      {
        id: 'lowcost',
        name: '低成本部署',
        note: 'CGA-Smart 用二手迷你主机 + 平板把整套设备压到 5k 以内，可接入医院内网。',
        projects: ['cga-smart'],
      },
      {
        id: 'bt',
        name: '宝塔面板',
        note: '服务器环境的一站式可视化管理：LNMP 栈、SSL 续签、站点与数据库备份、日志监控，交付给非运维背景的甲方时把门槛降到最低。',
        projects: ['bidos'],
      },
      {
        id: 'apifox',
        name: 'Apifox',
        note: '接口设计、调试、Mock 与文档一体化，前后端和甲方三方对着同一份 API 契约协作，减少口头对齐的返工。',
        projects: ['bidos'],
      },
      {
        id: 'postman',
        name: 'Postman',
        note: '接口联调与集合回归，把接口用例沉淀成可复跑的集合，交付前跑一遍就是一轮冒烟测试。',
        projects: ['bidos'],
      },
      {
        id: 'compose',
        name: 'Docker Compose',
        note: '本地一键拉起完整依赖栈（后端 + 数据库 + 向量库 + 模型服务），新环境搭起来不用手敲十条命令。',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'monitor',
        name: 'Prometheus / Grafana',
        note: '服务指标采集与告警看板：接口耗时、队列堆积、模型调用失败率都能落到图上，异常自动推送到值班群。',
        projects: ['bidos', 'portfolio'],
      },
    ],
  },
  {
    id: 'tooling',
    name: '协作与知识管理',
    caption: '我如何工作',
    items: [
      {
        id: 'aicoding',
        name: 'AI 协同开发',
        note: 'Codex / Claude / Cursor / DeepSeek Harness 并行推进，把重复实现交给模型。',
        projects: ['portfolio'],
      },
      {
        id: 'git',
        name: 'Git',
        note: '保留完整提交历史，作品集里的架构图直接取自代码快照而非事后补画。',
        projects: ['bidos', 'portfolio'],
      },
      {
        id: 'obsidian',
        name: 'Obsidian',
        note: 'idea 与文献的本地知识库，双链组织成可检索的 idea 图谱。',
        projects: ['portfolio'],
      },
      {
        id: 'notion',
        name: 'Notion',
        note: '需求、任务与项目文档的托管。',
        projects: ['portfolio'],
      },
      {
        id: 'zotero',
        name: 'Zotero',
        note: '文献管理，论文笔记与引用直接回流到写作。',
        projects: ['research'],
      },
      {
        id: 'mermaid',
        name: 'Mermaid',
        note: '架构图与流程图以代码维护，改代码即改图，图与系统不会脱节。',
        projects: ['portfolio'],
      },
      {
        id: 'notability',
        name: 'Notability',
        note: '手写批注与论文笔记的落点，上课时的推导、导师圈出的改动都在这里，重读时能还原当时的思路。',
        projects: ['research'],
      },
      {
        id: 'telari',
        name: 'Telari',
        note: '用药方案的随访协作工具，把 PolyMed 的随访排程、异常上报与医生端的复核串成一条线。',
        projects: ['polymed'],
      },
      {
        id: 'ipadpro',
        name: 'iPad Pro',
        note: '现场设备与记录的终端：MoCA 任务刺激呈现、评估笔录、装置调试都在上面完成，兼作 CGA-Smart 的辅助显示端。',
        projects: ['moca', 'cga-smart'],
      },
      {
        id: 'wps',
        name: 'WPS',
        note: '甲方侧文档的主战场：方案、验收材料与汇报稿在这里成稿，再转成 PDF 归档。',
        projects: ['bidos', 'portfolio'],
      },
      {
        id: 'office',
        name: 'Office',
        note: '实验数据与统计结果的整理（Excel）、汇报与答辩材料的制作（PPT / Word），是研究交付里绕不开的一环。',
        projects: ['research'],
      },
      {
        id: 'canva',
        name: 'Canva',
        note: '对外的视觉物料：项目海报、活动海报与社交图在 Canva 出稿，风格统一且不占用设计软件的学习成本。',
        projects: ['portfolio'],
      },
    ],
  },
]

/** 项目 → 展示信息（用于图谱的项目筛选条） */
export const stackProjects = [
  { slug: 'bidos', name: 'BidOS', caption: '企业 AI 招投标工作台' },
  { slug: 'cga-smart', name: 'CGA-Smart', caption: '老年综合评估智能系统' },
  { slug: 'moca', name: 'MoCA', caption: '认知评估与脑电打标' },
  { slug: 'fupan', name: '防返贫', caption: '中国电信防返贫风险识别智能体' },
  { slug: 'polymed', name: 'PolyMed', caption: '智能用药管理小程序' },
  { slug: 'research', name: 'ICLR 2027', caption: 'EEG 解码诊断基准' },
]

/** 所有技术项的扁平列表 */
export const allStackItems = stackCategories.flatMap((c) =>
  c.items.map((it) => ({ ...it, category: c.id, categoryName: c.name })),
)

/** 某技术被多少个项目使用 —— 决定节点大小 */
export const usageCount = (itemId: string): number => {
  const item = allStackItems.find((i) => i.id === itemId)
  return item ? item.projects.length : 0
}
