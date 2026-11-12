/**
 * 技术栈图谱的英文版本。
 *
 * 与 stack.ts 一一对应；只翻译面向读者的名称、说明与领域描述，
 * 技术名词本身（Vue 3、RAG、MCP 等）保持原样。
 */

export interface StackItemEn {
  id: string
  name: string
  note: string
  projects: string[]
}

export interface StackCategoryEn {
  id: string
  name: string
  caption: string
  items: StackItemEn[]
}

export const stackCategoriesEn: StackCategoryEn[] = [
  {
    id: 'frontend',
    name: 'Front-end Engineering',
    caption: 'The layer where interface and interaction ship',
    items: [
      {
        id: 'vue3',
        name: 'Vue 3',
        note: 'The main framework behind the BidOS workspace, the CGA-Smart assessment client and the PolyMed admin console; every project-facing interface is built on it.',
        projects: ['bidos', 'cga-smart', 'polymed'],
      },
      {
        id: 'vite',
        name: 'Vite',
        note: 'Build tool for CGA-Smart and the PolyMed console — fast cold start, so editing a scale definition does not mean waiting on a bundle.',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        note: 'Question types, scoring rules and API contracts become types, so changes to the rules engine are caught by the compiler.',
        projects: ['cga-smart'],
      },
      {
        id: 'elementplus',
        name: 'Element Plus',
        note: 'Forms and tables in the CGA-Smart workbench carry the density of a 21-scale navigation tree; the PolyMed family and doctor consoles reuse the same transfer and timeline components.',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'pinia',
        name: 'Pinia',
        note: 'Global state in CGA-Smart, so assessment progress and live risk cues read from one source.',
        projects: ['cga-smart'],
      },
      {
        id: 'echarts',
        name: 'ECharts',
        note: 'Visualisation layer for per-dimension subscores and risk radar in CGA-Smart.',
        projects: ['cga-smart'],
      },
      {
        id: 'nextjs',
        name: 'Next.js',
        note: 'Front-end workbench and result review pages for the anti-poverty agent.',
        projects: ['fupan'],
      },
      {
        id: 'miniprogram',
        name: 'WeChat Mini-Program',
        note: 'Patient and family surfaces of PolyMed — reminders, prescription recognition and voice queries all run here.',
        projects: ['polymed'],
      },
      {
        id: 'tailwind',
        name: 'Tailwind CSS',
        note: 'The styling layer of this portfolio itself; a 4px grid and a constrained palette keep the visual system consistent.',
        projects: ['portfolio'],
      },
      {
        id: 'signature',
        name: 'signature_pad',
        note: 'Signature capture in CGA-Smart — conclusions require the patient’s and assessor’s signature.',
        projects: ['cga-smart'],
      },
    ],
  },
  {
    id: 'backend',
    name: 'Server & Runtime',
    caption: 'Business logic and delivery form',
    items: [
      {
        id: 'springboot',
        name: 'Spring Boot',
        note: 'Backend of CGA-Smart and the base of the PolyMed console: scale definitions, the scoring engine and a layered data abstraction.',
        projects: ['cga-smart', 'polymed'],
      },
      {
        id: 'ruoyi',
        name: 'RuoYi-Vue-Pro',
        note: 'Base of the PolyMed doctor console and admin backend — permissions, dictionaries, code generation and scheduled jobs, instead of rebuilding them.',
        projects: ['polymed'],
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        note: 'BidOS export service and document parsing pipeline; shares a toolchain with the Vue front end under Vite.',
        projects: ['bidos', 'cga-smart'],
      },
      {
        id: 'springai',
        name: 'Spring AI / Alibaba',
        note: 'Agent foundation for the anti-poverty project — tool registration, model tool selection and summarisation as composable parts.',
        projects: ['fupan'],
      },
      {
        id: 'flask',
        name: 'Flask',
        note: 'BidOS backend: a REST layer plus a six-stage workflow state machine.',
        projects: ['bidos'],
      },
      {
        id: 'python',
        name: 'Python',
        note: 'The workhorse language for model adapters, scripted data processing and device communication.',
        projects: ['bidos', 'moca', 'fupan', 'polymed'],
      },
      {
        id: 'fastapi',
        name: 'FastAPI',
        note: 'Standardised interface layer for model services, speaking a unified OpenAI-compatible protocol.',
        projects: ['fupan'],
      },
      {
        id: 'sscat',
        name: 'SSCOM Serial Tool',
        note: 'Debugging and protocol reverse-engineering for the EEG acquisition device: capture raw serial frames with SSCOM first, then write the Python driver.',
        projects: ['moca'],
      },
      {
        id: 'electron',
        name: 'Electron',
        note: 'Desktop form of the MoCA tagging application — it needs exclusive serial access and continuous uptime.',
        projects: ['moca'],
      },
      {
        id: 'restapi',
        name: 'REST API',
        note: 'The contract that decouples front end from back end, and the precondition for deploying the product independently.',
        projects: ['bidos', 'cga-smart', 'fupan'],
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI & Models',
    caption: 'From orchestration to multimodality',
    items: [
      {
        id: 'reactagent',
        name: 'ReactAgent',
        note: 'The agent pattern behind the anti-poverty project: register tools → model selects tools → summarise context hook.',
        projects: ['fupan'],
      },
      {
        id: 'langgraph',
        name: 'LangGraph',
        note: 'Splits a flow into stateful graph nodes that support interruption, resumption and human intervention.',
        projects: ['fupan'],
      },
      {
        id: 'mcp',
        name: 'MCP Tools',
        note: 'Business capabilities wrapped as tools the agent calls over a standard protocol instead of hardcoded calls.',
        projects: ['fupan'],
      },
      {
        id: 'dify',
        name: 'Dify',
        note: 'Workflow orchestration for multimodal file input and report generation, complemented by Spring AI for the engineering parts.',
        projects: ['fupan'],
      },
      {
        id: 'rag',
        name: 'RAG',
        note: 'Medication knowledge base and policy retrieval — both PolyMed’s queries and anti-poverty policy matching depend on it.',
        projects: ['fupan', 'polymed'],
      },
      {
        id: 'qwen',
        name: 'Qwen / Qwen-VL',
        note: 'Locally deployed quantised models so sensitive data never leaves the intranet; the VL variant completes what OCR cannot resolve.',
        projects: ['fupan'],
      },
      {
        id: 'vllm',
        name: 'vLLM',
        note: 'Local inference service; the OpenAI-compatible adapter means upper layers never see the deployment detail.',
        projects: ['fupan'],
      },
      {
        id: 'workflow',
        name: 'LLM Workflow',
        note: 'BidOS’s six stages: import → triage → deep analysis → outline → preparation → export.',
        projects: ['bidos'],
      },
      {
        id: 'ocr',
        name: 'Qwen OCR',
        note: 'Key-information extraction from tender and assistance documents, emitting structured fields for rule-based triage.',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'ttsasr',
        name: 'TTS / ASR',
        note: 'PolyMed’s voice queries and read-aloud, and the narration chain of the CGA-Smart voice companion.',
        projects: ['polymed'],
      },
      {
        id: 'eeg',
        name: 'EEG Decoding',
        note: 'Frozen backbone with a linear readout, paired with eight pre-registered intervention protocols to locate the signal structure a model truly relies on.',
        projects: ['research'],
      },
      {
        id: 'pytorch',
        name: 'PyTorch',
        note: 'Training framework for EEG-FM backbones and readouts; the eight intervention protocols of the diagnostic benchmark are implemented here too.',
        projects: ['research'],
      },
      {
        id: 'cuda',
        name: 'CUDA',
        note: 'GPU acceleration layer for cross-architecture decoding and batched interventions — this is what makes eight protocols across many models runnable.',
        projects: ['research'],
      },
      {
        id: 'numpy',
        name: 'NumPy',
        note: 'Low-level operators for signal slicing, channel reordering and statistics — the main language of the protocol pre-processing stage.',
        projects: ['research', 'moca'],
      },
    ],
  },
  {
    id: 'data',
    name: 'Data & Storage',
    caption: 'State, artefacts and devices',
    items: [
      {
        id: 'sqlite',
        name: 'SQLite',
        note: 'BidOS stage state and structured artefacts; bulky files live on the filesystem to keep the database from bloating.',
        projects: ['bidos'],
      },
      {
        id: 'repo',
        name: 'Repository Abstraction',
        note: 'CGA-Smart data access goes through one abstraction — localStorage stands in during prototyping, and swapping in real APIs leaves business code untouched.',
        projects: ['cga-smart'],
      },
      {
        id: 'fsartifact',
        name: 'Filesystem Artefacts',
        note: 'Source files, exports and versions are stored separately, and every artefact carries a source tag.',
        projects: ['bidos'],
      },
      {
        id: 'vector',
        name: 'Vector Retrieval',
        note: 'Retrieval is targeted by project context rather than by searching the whole corpus.',
        projects: ['fupan', 'polymed'],
      },
      {
        id: 'serial',
        name: 'Serial Device I/O',
        note: 'Real-time communication with EEG acquisition devices in the MoCA tagging software, with event marking at millisecond resolution.',
        projects: ['moca'],
      },
      {
        id: 'paradigm',
        name: 'Experimental Paradigm Design',
        note: 'Stimulus presentation and response timing for MoCA tasks — this determines whether signal segments can be cut precisely.',
        projects: ['moca'],
      },
      {
        id: 'mysql',
        name: 'MySQL',
        note: 'Persistence of medication plans and follow-up records across the three PolyMed sides (patient / family / doctor).',
        projects: ['polymed'],
      },
      {
        id: 'qdrant',
        name: 'Qdrant',
        note: 'Vector store behind the PolyMed medication knowledge base and multimodal prescription retrieval, recalling precisely per project and scenario.',
        projects: ['polymed'],
      },
      {
        id: 'eventcode',
        name: 'Event Code Table',
        note: 'The 43 fine-grained MoCA tagging points — the single source of truth that aligns behavioural events with EEG signal.',
        projects: ['moca'],
      },
    ],
  },
  {
    id: 'devops',
    name: 'Delivery & Operations',
    caption: 'From code to production',
    items: [
      {
        id: 'docker',
        name: 'Docker',
        note: 'Packaged delivery for BidOS and the services, so the client environment can be reproduced.',
        projects: ['bidos'],
      },
      {
        id: 'k8s',
        name: 'Kubernetes',
        note: 'Cluster deployment and rolling updates for BidOS on the client’s host.',
        projects: ['bidos'],
      },
      {
        id: 'ecs',
        name: 'ECS / Cloud Hosts',
        note: 'Compute for live services and model serving, including the deployment of this portfolio itself.',
        projects: ['bidos', 'fupan'],
      },
      {
        id: 'cicd',
        name: 'CI / CD',
        note: 'GPT-Dots handles automated builds and 24-hour monitoring with automatic alerting.',
        projects: ['portfolio'],
      },
      {
        id: 'nginx',
        name: 'Nginx',
        note: 'Static asset delivery and reverse proxying.',
        projects: ['portfolio'],
      },
      {
        id: 'lowcost',
        name: 'Low-Cost Deployment',
        note: 'CGA-Smart runs on a second-hand mini PC plus a tablet, keeping the whole rig under RMB 5k and able to join the hospital intranet.',
        projects: ['cga-smart'],
      },
    ],
  },
  {
    id: 'tooling',
    name: 'Tooling & Knowledge',
    caption: 'How I work',
    items: [
      {
        id: 'aicoding',
        name: 'AI-Assisted Development',
        note: 'Codex, Claude, Cursor and DeepSeek Harness run in parallel, handing repetitive implementation to the model.',
        projects: ['portfolio'],
      },
      {
        id: 'git',
        name: 'Git',
        note: 'Full commit history is kept; the architecture diagrams in this portfolio are taken from actual code snapshots rather than redrawn afterwards.',
        projects: ['bidos', 'portfolio'],
      },
      {
        id: 'obsidian',
        name: 'Obsidian',
        note: 'A local vault for ideas and literature, with bidirectional links forming a searchable idea graph.',
        projects: ['portfolio'],
      },
      {
        id: 'notion',
        name: 'Notion',
        note: 'Requirements, tasks and project documentation.',
        projects: ['portfolio'],
      },
      {
        id: 'zotero',
        name: 'Zotero',
        note: 'Reference management — paper notes and citations flow straight back into writing.',
        projects: ['research'],
      },
      {
        id: 'mermaid',
        name: 'Mermaid',
        note: 'Architecture and flow diagrams are maintained as code, so changing the code changes the diagram and the picture cannot drift from the system.',
        projects: ['portfolio'],
      },
    ],
  },
]

export const stackProjectsEn = [
  { slug: 'bidos', name: 'BidOS', caption: 'Enterprise AI bidding workspace' },
  { slug: 'cga-smart', name: 'CGA-Smart', caption: 'Geriatric assessment system' },
  { slug: 'moca', name: 'MoCA', caption: 'Cognitive assessment + EEG tagging' },
  { slug: 'fupan', name: 'Anti-poverty', caption: 'China Telecom anti-poverty risk agent' },
  { slug: 'polymed', name: 'PolyMed', caption: 'Medication management mini-app' },
  { slug: 'research', name: 'ICLR 2027', caption: 'EEG decoding diagnostic benchmark' },
]
