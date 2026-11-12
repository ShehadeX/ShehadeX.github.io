/**
 * 首页内容的英文版本。
 *
 * 首页有大量长文案（时间线要点、能力矩阵、研究条目），
 * 集中在这一份文件里，便于统一校对语言风格。
 */

export const projectFiltersEn = [
  { key: 'all', label: 'All Cases' },
  { key: 'AI SYSTEMS', label: 'AI Systems' },
  { key: 'MEDICAL SOFTWARE', label: 'Medical' },
  { key: 'NEURO / SIGNAL', label: 'Neuro / Signal' },
  { key: 'AI AGENT', label: 'Agent' },
  { key: 'HEALTHCARE', label: 'Healthcare' },
]

export const capabilitiesEn = [
  {
    key: 'AI Agent',
    desc: 'ReactAgent / LangGraph / Spring AI agent framework — tool registration, model tool selection, context summarisation and evidence-bound reasoning output.',
    items: ['Agent Orchestration', 'MCP Tools', 'RAG', 'Multimodal VL'],
  },
  {
    key: 'Full-stack',
    desc: 'Vue 3 + TypeScript front end, Flask / Spring Boot back end, MySQL / SQLite persistence, with Docker and ECS deployment and operations.',
    items: ['Vue 3', 'Spring Boot', 'Flask', 'Docker'],
  },
  {
    key: 'Deep Learning',
    desc: 'EEG acquisition and event tagging, experimental paradigm design, and signal processing and model decoding on real laboratory data.',
    items: ['EEG Tagging', 'Paradigm Design', 'Signal Processing', 'Model Decoding'],
  },
  {
    key: 'Deployment',
    desc: 'End-to-end local drafting and model service deployment, quantised models running on-premise so sensitive data never leaves the intranet, balancing cost against latency.',
    items: ['Quantised Deployment', 'Performance Tuning', 'Cost Control', 'Intranet Compliance'],
  },
]

export const timelineEn = [
  {
    period: '2026.07.16 – present',
    org: 'Shenzhen Institute of Advanced Technology, Chinese Academy of Sciences · Neural Interface Lab',
    role: 'Research Software Engineering Intern',
    logo: '/img/logos/siat.png',
    points: [
      'Collaborated with the Neurology Department of Shenzhen Second People’s Hospital to collect patient SEEG data covering cognitive tasks, motor imagery (MI) and seizure tasks.',
      'Moved the MoCA Alzheimer’s assessment system from the lab onto the ward, iterating the experimental paradigm against real patient testing to reduce non-stimulus interference.',
      'Co-authored an ICLR 2027 paper as second author: Stage 1 freezes 4 backbones and builds adapters on 8 datasets; Stage 2 applies temporal, spatial, spectral and micro-event perturbations to open the model’s black box.',
      'The tagging software has been tested on 20+ patient datasets across Nanjing Drum Tower Hospital, Shenzhen Second People’s Hospital and Guangzhou Sanjiu Brain Hospital, with software copyright filed.',
    ],
  },
  {
    period: '2026.07.06 – 2026.07.31',
    org: 'China Telecom Digital Intelligence Technology · Hainan Branch R&D Center',
    role: 'AI Application R&D Intern',
    logo: '/img/logos/mark-chinatelecom.png',
    points: [
      'Designed the Hainan province large-model prototype for poverty-return monitoring; owned feature development and testing.',
      'Connected an intranet model service with Spring AI; ReactAgent orchestrates tool registration, model tool selection and context summarisation.',
      'Called a locally deployed Qwen VL for multimodal household materials, with schema-constrained return values so the decision stage never drops data or misjudges.',
      'Used Dify to chain material recognition, field normalisation, rule-based triage and report generation, closing the loop entirely inside the intranet.',
    ],
  },
  {
    period: '2026.04.01 – 2026.12.01',
    org: 'GRGT · Metrology Division, Guangzhou HQ',
    role: 'Intern',
    logo: '/img/logos/mark-grgt.png',
    points: [
      'Full-chain full-stack development: decomposed business requirements, wrote and tested the entire codebase, deployed to production and handled subsequent tuning.',
      'Used python-docx to extract structured information and called an LLM to tag the original formatting, turning copy-paste into code-driven first-draft generation.',
      'Analysed 23 historical human-written drafts into a material graph and two-level knowledge taxonomy, retrieving credentials, legal clauses and track record precisely per project.',
      'Built a harness defining OOXML formatting in JSON, plus entity prompt injection and negative prompts to suppress model hallucination.',
      'Shipped as a Docker package and delivered to the client host via Kubernetes, keeping design manuscripts, maintenance comments and test entry points.',
    ],
  },
  {
    period: '2025.09 – 2026.02',
    org: 'Dayunwu Studio Crowdfunding Platform',
    role: 'Software Development Team Member',
    logo: '/img/logos/gdut.png',
    points: [
      'Led several projects in parallel, scheduled member tasks and managed the laboratory servers.',
      'Worked with multiple supervisors on horizontal development, vertical research and industry-education integration tasks.',
      'Participated in negotiation meetings and contract signing.',
    ],
  },
]

export const researchEn = [
  {
    title: 'Dissecting the Score — ICLR 2027',
    desc: 'A cross-architecture diagnostic benchmark with neurophysiology as the shared reference: freeze adapter / backbone / readout, apply eight pre-registered protocols to the input, and expose the repetitive pattern hidden by scalar scores — predictions rely on coarse structure and respond weakly to fine structure.',
    tag: 'Under Review',
    to: '/research',
    accent: true,
  },
  {
    title: 'Software Copyright · EEG Event Tagging Application',
    desc: 'Clinically tested at Nanjing Drum Tower Hospital, Shenzhen Second People’s Hospital and Guangzhou Sanjiu Brain Hospital, with registration filed: ~20ms real-time tagging across 43 fine-grained event codes.',
    tag: 'Filed',
    to: '/project/moca',
    accent: false,
  },
  {
    title: 'Open Source & Engineering Practice',
    desc: 'Built a geriatric assessment platform on the yudao microservice system, consolidating the scale engine and multi-module AI capability into the engineering trunk.',
    tag: 'Engineering',
    to: '/project/cga-smart',
    accent: false,
  },
  {
    title: 'Cross-Domain Emotion Recognition from EEG',
    desc: 'Team lead and developer. Across several rounds — frozen backbone, partial unfreezing, full training and swapping the downstream classification head — introducing SEED and other datasets to complete the small-sample training set lifted three-fold BACC from 65.3% to 78.6%.',
    tag: 'Research',
    to: '/project/moca',
    accent: false,
  },
]
