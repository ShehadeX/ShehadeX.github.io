/**
 * 项目数据的英文版本。
 *
 * 与 projects.ts 的中文主数据按 slug 一一对应；
 * 只覆盖需要翻译的文案字段，图片路径与枚举沿用主数据。
 *
 * 设计取舍：不为每个字段做 zh/en 双份对象（会让主数据结构膨胀一倍、
 * 每次改文案要改两处），而是把英文作为独立的"覆盖层"，
 * 组件按 slug 查表，查不到就回落到中文主数据。
 */

export interface EnBba {
  before: string
  built: string
  after: string
}

export interface EnMedia {
  src: string
  caption: string
  note?: string
  story?: string
  ratio?: string
}

export interface EnSection {
  id: string
  no: string
  title: string
  body: string[]
  media?: EnMedia[]
}

export interface EnProject {
  slug: string
  subtitle: string
  summary: string
  coverCaption: string
  role: string
  org: string
  bba: EnBba
  facts: { label: string; value: string }[]
  sections: EnSection[]
  gallery: { src: string; caption: string; ratio?: string }[]
  diagrams: { id: string; title: string }[]
}

export const projectsEn: Record<string, EnProject> = {
  bidos: {
    slug: 'bidos',
    subtitle: 'Enterprise AI Workspace for Bid Writing',
    summary:
      'Six-stage AI workflow covering material import, triage, deep analysis, outline generation, chapter preparation and document export — with provenance, human confirmation and delivery boundaries all built into the system.',
    coverCaption: 'BidOS overview: stage artefacts bound to outline structure',
    role: 'Product design & full-stack development (internship)',
    org: 'GRGT · Metrology Division, Guangzhou HQ',
    bba: {
      before:
        'Writers had to cross-check bid documents, company credentials and past submissions against a Word deliverable, so source material and version drift was common and rework expensive.',
      built:
        'A six-stage workflow with provenance-linked stage artefacts, a company knowledge base with historical references, explicit human decision points, and DOCX generation with export-time structural checks.',
      after:
        'Time from import to a deliverable Word document is down to minutes, with each of the six stages traceable; every artefact carries source citations and human confirmation records, so reviewers can trace a claim straight back to the original material.',
    },
    facts: [
      { label: 'Workflow stages', value: '6' },
      { label: 'Single proposal', value: 'Minutes to generate' },
      { label: 'Deliverables', value: 'DOCX · with citations' },
      { label: 'Traceability', value: 'Per-stage artefacts' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — the business reality',
        body: [
          'Bid writing is a long-chain, heavily regulated, labour-intensive process. Inputs are the tender document, company credentials and past proposals; output is a strictly formatted Word deliverable. The real pain is not writing but evidence: a writer cannot quickly answer "which clause of which document does this conclusion come from".',
          'The second problem is versioning. Tender requirements, company records and historical documents each evolve, and any desynchronisation gets a draft rejected at review.',
          'From the client side what is actually consumed is human time: the same cross-checking and formatting repeats on every tender. So the system must not "write more intelligently" — it must do less repetitive work without introducing errors.',
        ],
        media: [
          {
            src: '/img/bidos/01.webp',
            caption: 'Material import',
            note: 'Tender documents, company credentials and past proposals enter the workspace through one path; file fingerprints are registered at import so every later claim can be traced.',
            story:
              'Bid files come in wildly different formats. Throwing them at a model yields fluent text that misses the actual requirements. So the first step cuts, numbers and registers the material — turning "what is this batch of documents" into a deterministic fact in the system before the model ever reads it.',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — core mechanics and product design',
        body: [
          'BidOS models the authoring process as six stages with explicit inputs and artefacts: import → triage → deep analysis → outline → chapter preparation → export. Every artefact carries a source tag that later stages can reference directly instead of asking the model to guess again.',
          'Human decision points are explicit: outlines and chapters require confirmation before advancing. The model may propose, but it cannot make the business call.',
        ],
        media: [
          {
            src: '/img/bidos/02.webp',
            caption: 'Deep requirement analysis',
            note: 'Requirements are decomposed into checkable items, each bound to a specific source passage; the analysis itself is an editable structured artefact.',
            story:
              'This screen is the shift from reading documents to reading requirements. Previously the model wrote an essay and reviewers had to read it through; once itemised, a writer can confirm, edit or reject each requirement, and the analysis becomes a collaborative checklist rather than a paragraph.',
          },
          {
            src: '/img/bidos/03.webp',
            caption: 'Outline bound to the knowledge base',
            note: 'Generated outlines bind bidirectionally to knowledge-base categories, so chapter writing recalls the right credentials, track record and legal clauses instead of searching the whole corpus.',
            story:
              'The knowledge base was the largest investment in this project. We analysed 23 historical human-written drafts into a material graph with two-level taxonomy. Retrieval is now targeted by project context, so every cited fact comes from the correct category rather than from luck.',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — layers and state flow',
        body: [
          'Flask exposes a REST layer, an orchestration layer maintains the stage state machine, and domain services handle outlines, chapters and asset versions. Models do not scatter through business code; they converge into an adapter layer where the business side only describes two capabilities: understanding and drafting.',
          'State and artefacts are separated: structured state goes to SQLite, bulky source files and exports go to the filesystem, keeping the database from bloating.',
        ],
        media: [
          {
            src: '/img/bidos/08.webp',
            caption: 'Project overview',
            note: 'Projects, stage status, pending confirmations and artefact directories converge on one panel — the sign-off view at the end of every stage.',
            story:
              'The binding between artefacts and their sources is visualised here as a single graph. Early on, artefacts were scattered across stage folders and nobody could say which version was current; putting artefact, source and status together cut rework and handover cost noticeably.',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — hard parts and how they were solved',
        body: [
          'First: keeping provenance intact through generation. Fact candidates are modelled as source-bearing objects, so the model can only cite registered candidates and can never introduce an unsourced fact.',
          'Second: delivery format stability. After DOCX generation a structural check runs — missing chapters, misaligned numbering and empty paragraphs are all blocked at export time rather than discovered when a reviewer opens the file.',
          'Third: engineering suppression of hallucination. Paragraph generation runs on a large harness: JSON-defined OOXML formatting (spacing, line height, font embedding), plus entity prompt injection, reference masking, data recombination and negative prompts, keeping free-form model output inside an acceptable structure.',
        ],
        media: [
          {
            src: '/img/bidos/04.webp',
            caption: 'DOCX authoring workspace',
            note: 'Chapter tree on the left, body editor in the middle, sources and status on the right — write, verify and confirm in one screen.',
            story:
              'Format stability was ultimately bought with harnesses. OOXML paragraph attributes are written as a JSON schema that constrains model output, and a structural checker runs before export. Some generation freedom was traded away for compliance certainty on the delivered document.',
          },
          {
            src: '/img/bidos/05.webp',
            caption: 'System management',
            note: 'Model configuration, knowledge-base taxonomy, users and audit records are managed centrally so the client can adjust on site without a code change.',
            story:
              'The client site and the dev environment differ in model endpoints and key policy, so all model configuration moved into the admin UI. Site staff can switch models, tune parameters and read audit records themselves — no ticket, no remote patch.',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — iteration and traceability',
        body: [
          'The repository keeps full Git history; the architecture and ER diagrams in this portfolio are taken from the actual schema and modules of code snapshot 17259dd7 (2026-11-06), not redrawn after the fact.',
          'Early Git records carry my signature; team size and later division of labour still need verification, so the text distinguishes "my responsibility" from "team output".',
          'For delivery the service is packaged with Docker and deployed to the client host via Kubernetes, keeping original design manuscripts, extensive maintenance comments and test entry points so others can pick it up.',
        ],
        media: [
          {
            src: '/img/bidos/06.webp',
            caption: 'Knowledge base and material graph',
            note: 'Materials are archived under a two-level taxonomy with source files mapped one-to-one to structured entries — the precondition for reliable retrieval.',
            story:
              'This was the least glamorous and most critical piece: 23 historical drafts had to be decomposed into a structured taxonomy. Only after that could the generation stage know which class of material to cite, otherwise even a strong model would stay generic.',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — evidence and boundaries',
        body: [
          'Verifiable result: a single tender document is produced in minutes end to end, with every section traceable to its source material and every human decision point recorded.',
          'Boundary: this is not production acceptance data and not a general efficiency metric. Companies, tenders and people shown in the interface are fictional test data used to demonstrate the system form.',
          'Current status: the system is used for internal testing and continued development; a full end-to-end delivery acceptance on a live project is still outstanding.',
        ],
      },
    ],
    gallery: [
      { src: '/img/bidos/01.webp', caption: 'Material import' },
      { src: '/img/bidos/02.webp', caption: 'Deep requirement analysis' },
      { src: '/img/bidos/03.webp', caption: 'Outline bound to knowledge base' },
      { src: '/img/bidos/04.webp', caption: 'DOCX authoring workspace' },
      { src: '/img/bidos/05.webp', caption: 'System management' },
      { src: '/img/bidos/08.webp', caption: 'Project overview' },
    ],
    diagrams: [
      { id: 'bidos-workflow', title: 'Six-stage workflow' },
      { id: 'bidos-arch', title: 'System architecture' },
    ],
  },

  'cga-smart': {
    slug: 'cga-smart',
    subtitle: 'Intelligent Comprehensive Geriatric Assessment',
    summary:
      'A lightweight, LLM-driven geriatric assessment system built to WS/T 888—2026, separating the scale engine, scoring rules and multi-condition synthesis into independently extensible modules.',
    coverCaption:
      'CGA-Smart · jointly developed by Guangdong University of Technology and Guangdong Provincial People’s Hospital',
    role: 'Full-stack development (internship, sole owner end to end)',
    org: 'Guangdong Provincial People’s Hospital · Geriatric Rehabilitation',
    bba: {
      before:
        'Comprehensive geriatric assessment spans many scales and conditions; paper and isolated tools coexisted, synthesis depended on manual work, and the rehabilitation department could not form a quick overall judgement.',
      built:
        'An extensible scale engine (question-type components + scoring rules + result interpretation), a complete assessment flow, patient management and data loop, with LLM-driven synthesis across multiple conditions.',
      after:
        'The system is deployed and live, tested and in use at the geriatric rehabilitation department of Guangdong Provincial People’s Hospital and at Guangzhou Konglushan No.1 Wellness Hospital.',
    },
    facts: [
      { label: 'Scales built in', value: '9' },
      { label: 'Standard', value: 'WS/T 888—2026' },
      { label: 'Deployment sites', value: '2 hospitals' },
      { label: 'Roles', value: 'Admin / Assessor' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — the real constraints of clinical flow',
        body: [
          'CGA (Comprehensive Geriatric Assessment) is not a form; it is a combination of scales. MMSE, GDS-15, MORSE, GAD-7, EAT-10, FRAIL, Fried, MNA-SF and AIS each carry their own question types, scoring and interpretation rules.',
          'The pain in a hospital is concrete: adding a new scale means changing code, and assessment results cannot easily be aggregated horizontally into the conclusion the rehabilitation department actually needs.',
          'Cost is equally concrete: paper-based determination means patients travel to the ward or staff visit at home, costing RMB 20–50 per scale and hundreds to thousands per full assessment — and clinical judgement depends on subjective physician assessment, which cannot scale.',
        ],
        media: [
          {
            src: '/img/cga/01.webp',
            caption: 'Role-based entry',
            note: 'Two entry points for administrators and assessors; assessors land directly on the task queue, which cuts training cost.',
            story:
              'Front-line staff fear being unable to learn the tool. So the role entry stays minimal: after login you see the assessment you have to do today, not a feature menu. The first version pushed scale management and system settings into a secondary menu so assessors only ever see the task flow.',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — scale engine and data loop',
        body: [
          'The core design abstracts a scale into three layers: question-type component, scoring rule and result interpretation. A new scale only needs a new definition; the main assessment flow is untouched.',
          'Data access goes through a Repository abstraction, with localStorage standing in for the backend during prototyping so business code does not change when real APIs arrive. Initiate → answer → auto-score → review → history → print closes the loop.',
        ],
        media: [
          {
            src: '/img/cga/02.webp',
            caption: 'Assessment workbench with live risk cues',
            note: '21 scales on the left, question-by-question answering in the middle, live risk cues on the right — fall risk, depression and nutrition are readable during the assessment itself.',
            story:
              'Inviting family members to take part was the key change in this version: previously only a physician was present, now family can accompany and see explanations immediately. Communication cost drops from explaining afterwards to understanding together on the spot.',
          },
          {
            src: '/img/cga/04.webp',
            caption: 'Scale management',
            note: 'A new scale only needs question types, scoring rules and interpretation copy defined; the assessment flow needs no code change.',
            story:
              'The scale engine is the pivot of the whole system. Question types are deliberately abstracted into a configuration layer: single choice, multiple choice, scale scoring, each one component, with scoring rules written as executable configuration. Adding a scale falls from "change code and re-run regression tests" to "write one config".',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — layering and data flow',
        body: [
          'The front end is Vue 3 + Vite + TypeScript + Element Plus, with Pinia for state, ECharts for visualisation and signature_pad for signature capture.',
          'The model is responsible for one thing: multi-condition synthesis — turning structured results from several scales into a readable conclusion, never replacing the scales’ own scoring logic. That boundary is deliberate: clinical scoring must be recomputable and traceable.',
        ],
        media: [
          {
            src: '/img/cga/06.webp',
            caption: 'Patient management',
            note: 'Patient records, assessment history and risk trends in one place, with family details and assessor ownership managed alongside.',
            story:
              'This screen solves "results sink too deep". Paper assessments used to disappear into a file folder, with no way for the rehabilitation team to see three months of change. Every assessment is now a queryable record and the time series is visualised directly.',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — cost, performance and interaction',
        body: [
          'The project ran end to end from requirement to product, with the bulk of the effort on the joint optimisation of cost control, system performance and interaction.',
          'Concretely: a rules engine handles deterministic scoring and interpretation, model calls are narrowed to the synthesis step that genuinely needs reasoning, and high-frequency assessor paths are keyboard-driven to cut clicks on a ward floor.',
          'Deployment cost is treated as a first-class metric: the whole rig runs on a DELL mini PC (about RMB 1k second-hand) plus a Huawei tablet (about RMB 600), keeping the threshold under RMB 5k, and it joins the hospital intranet so assessment services can reach hospitals and clinics across eastern and western Guangdong.',
        ],
        media: [
          {
            src: '/img/cga/08.webp',
            caption: 'Assessment flow and results',
            note: 'On completion, per-dimension subscores, totals and recommendations are summarised automatically, and the result can be printed as a paper report.',
            story:
              'Model calls are the cost item most likely to run away. We first let the model both score and summarise, which was slow and unstable; handing all deterministic work back to the rules engine and leaving only multi-condition description to the model improved cost and stability at the same time.',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — from prototype to production',
        body: [
          'The repository centres on demo1: first close the loop on assessment flow and scale engine, then push towards production.',
          'Phase one deliberately kept the Repository abstraction so local demos and on-prem hospital deployments share one set of business code, lowering the risk of switching environments.',
          'Because HIS integration has a long review cycle, the system runs as a standalone application accessed inside the hospital intranet, so it does not block the main flow going live.',
        ],
        media: [
          {
            src: '/img/cga/voice.webp',
            caption: 'Voice companion interaction',
            note: 'During assessment a voice companion reads questions aloud and guides answering; the AIS conversation log and the conclusion sit on the same timeline, so staff no longer juggle the screen and a paper form.',
            story:
              'This is the most direct request from the ward: patients lose both hearing and vision, while the assessor must read, record and time simultaneously. The voice companion takes reading away from the assessor so attention stays on judgement. Implementation has to handle interruption and timeout fallback — ward noise is loud, and a recognition failure must fall back to manual confirmation, or one mis-hearing destroys the credibility of the whole session.',
          },
          {
            src: '/img/cga/11.webp',
            caption: 'System management',
            note: 'Scale definitions, permissions and assessment records are managed centrally, leaving a stable data exit for future HIS integration.',
            story:
              'To make HIS integration possible later, we did not invent a data format at the persistence layer; assessment records are abstracted into a standard structure. Running standalone is the current deployment shape, not a limit of the data model.',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — deployment status and validation scope',
        body: [
          'The system is live and locally deployed, tested at the geriatric rehabilitation department of Guangdong Provincial People’s Hospital and at Guangzhou Konglushan No.1 Wellness Hospital.',
          'Nine scales are integrated — MMSE, GDS-15, MORSE, GAD-7, EAT-10, FRAIL, Fried, MNA-SF and AIS — covering cognition, mood, fall risk, anxiety, swallowing, frailty, nutrition and sleep.',
          'On the standards side the system went live within a short window before WS/T 888—2026 took formal effect, and university-industry collaboration pushed development and operating cost down to leave room for wider rollout.',
        ],
      },
    ],
    gallery: [
      { src: '/img/cga/cover.webp', caption: 'CGA-Smart home screen' },
      { src: '/img/cga/voice.webp', caption: 'Voice companion interaction' },
      { src: '/img/cga/01.webp', caption: 'Role-based entry' },
      { src: '/img/cga/02.webp', caption: 'Assessment workbench with risk cues' },
      { src: '/img/cga/04.webp', caption: 'Scale management' },
      { src: '/img/cga/06.webp', caption: 'Patient management' },
      { src: '/img/cga/08.webp', caption: 'Assessment flow and results' },
      { src: '/img/cga/11.webp', caption: 'System management' },
    ],
    diagrams: [{ id: 'cga-arch', title: 'Scale engine and data layer' }],
  },

  moca: {
    slug: 'moca',
    subtitle: 'Clinical Cognitive Assessment with Real-Time EEG Tagging',
    summary:
      'Digitalises 14 MoCA assessment steps, adapts to acquisition devices across multiple hospitals, tags events at 20ms resolution and locks cognitive assessment and EEG acquisition onto a single timeline.',
    coverCaption:
      'MoCA high-quality EEG acquisition · unified stimulus and response, behaviour and EEG tagged in sync',
    role: 'Team lead & developer (research software engineering intern)',
    org: 'SIAT, Shenzhen · Neural Interface Lab · Alzheimer’s pictorial training system',
    bba: {
      before:
        'Cognitive scales were scored on paper, EEG experiments relied on vendor tools to mark events, and the two timelines could not be aligned — afterwards no cognitive step could be tied to an EEG segment.',
      built:
        'A purpose-built digital tagging application unifies the event code table (43 fine-grained tags), connects straight to acquisition devices over serial, advances steps on the A key and flags anomalies globally on B, with all 14 steps visualised end to end.',
      after:
        'The tagging software has been tested on 20+ patient datasets across Nanjing Drum Tower Hospital, Shenzhen Second People’s Hospital and Guangzhou Sanjiu Brain Hospital, and software copyright has been filed.',
    },
    facts: [
      { label: 'Assessment steps', value: '14' },
      { label: 'Event tags', value: '43' },
      { label: 'Tag precision', value: '~20ms' },
      { label: 'Clinical testing', value: '3 hospitals · 20+ cases' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — aligning two timelines',
        body: [
          'On the experiment floor, cognitive assessment and EEG acquisition are two different systems. Assessment runs on clinical rhythm, acquisition on device rhythm; once events are back-filled manually afterwards, signal segments and behavioural events cannot be reliably matched.',
          'This is the classic hidden error source in neuroscience: the data gets collected, but it cannot be used.',
          'Digitisation is not the goal in itself. Paper scales were slow and labour-intensive, and cannot be tagged by hand at millisecond precision; digitising only swaps a slow, inaccurate recording method for a fast, accurate one. The real objective has always been to place behavioural events and EEG signals on one timeline.',
        ],
        media: [
          {
            src: '/img/moca/cover.webp',
            caption: 'MoCA high-quality EEG acquisition system',
            note: 'MoCA tasks use unified stimulus and response, with patient behaviour and EEG signal tagged in sync so cognitive task and brain recording share one timeline.',
            story:
              'This is the core proposition of the whole system: aligning two timelines. Assessment runs on clinical rhythm, acquisition on device rhythm, and once events are back-filled by hand the signal segments and behavioural events cannot be reliably matched — the data was collected, but unusable.',
          },
          {
            src: '/img/moca/moca-01.webp',
            caption: 'Home screen',
            note: 'Three entry points — start assessment, history, settings — so operators never need to understand the internals to begin.',
            story:
              'This system is used in real wards, so the interface language has to revolve around the operator. Three entries only, because attention on the experiment floor is a scarce resource: the operator is watching both the patient and the device and must not get lost in a menu.',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — code-table driven tagging',
        body: [
          'The code table is the single source of truth. The old table used a coarse moduleId × 2 rule that could only distinguish start from end; the new table refines this into 43 tags, splitting stimulus presentation, onset, start and finish into independent events.',
          'Take visuospatial trail making: stimulus presented (4) → first stroke begins (5) → all strokes complete (6). Three events let downstream analysis cut out the stroke movement segment precisely.',
          'The whole assessment is split into 14 independently advanceable steps, each with explicit UI state, task prompt and tagging events. A advances a step, B globally flags anomalies and interruptions.',
        ],
        media: [
          {
            src: '/img/moca/moca-02.webp',
            caption: 'Visuospatial trail making',
            note: 'Task status and tagging settings sit at the top; the stimulus-presented event is written into the event stream the instant the figure loads.',
            story:
              'Trail making is the step that best demonstrates the value of finer tagging. The old code table had a single moduleId and could not isolate the movement segment; with presentation, first stroke and completion split apart, the decoding side can align the valid interval of a motor imagery task on its own.',
          },
          {
            src: '/img/moca/moca-04.webp',
            caption: 'Cube copying',
            note: 'Reference figure and drawing area side by side, with the first-stroke event shown live — the drawing action itself becomes an analysable event sequence.',
            story:
              'Drawing tasks are most sensitive to tagging latency: consecutive strokes may be only a few hundred milliseconds apart. So this is deliberately built as "one event per stroke", giving the analysis side a real stroke trajectory instead of a vague "drawing period".',
          },
          {
            src: '/img/moca/moca-05.webp',
            caption: 'Clock drawing',
            note: 'A specified target time with the drawing area, running the same stroke-level event tagging.',
            story:
              'Clock drawing is both a cognitive and a visuospatial indicator in clinic. Giving it exactly the same event structure as cube copying lets the decoding side reuse one script across multiple drawing tasks.',
          },
          {
            src: '/img/moca/moca-20.webp',
            caption: 'Alertness test',
            note: 'The participant listens for a digit and presses space when the target digit 1 is heard — that instant of hearing is precisely the cognitive event to be tagged.',
            story:
              'Alertness is one of the few steps that captures internal state and external response together: we observed a marked prefrontal signal change when patients heard the target digit. That finding is only visible because the event marking here is accurate to milliseconds.',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — full timing sequence',
        body: [
          'The assessment opens with a step-0 overview, then a 30-second rest period (rest-start → 5-second sentinel intervals → rest-end), before task-start(96) enters the first test step.',
          'The operator presses A to advance and B to flag anomalies globally. Serial downlink commands trigger acquisition; the upstream event stream is mapped through the code table and written back to the interface, refreshing progress and status live.',
          'The complete tagging flow and UI transition timing of every step are written down explicitly, including background colour, font size and A-key behaviour, so shift handovers need no verbal briefing.',
        ],
        media: [
          {
            src: '/img/moca/moca-15.webp',
            caption: 'Code table settings',
            note: 'Serial values and enable state are configured per module and event, with save and restore-defaults — the code table is the only source of truth in the system.',
            story:
              'The code table is a visual configuration rather than hardcoded values because lab equipment and experimental paradigms change. Adapting to new hardware means editing one table, not touching the main flow.',
          },
          {
            src: '/img/moca/moca-12.webp',
            caption: 'Serial configuration',
            note: 'Port, baud rate, data bits, stop bits and parity are selectable and savable, accommodating different acquisition device models across multiple hospitals.',
            story:
              'Supporting three hospitals meant facing three sets of serial parameters. Pulling them into configuration rather than hardcoding is exactly why swapping a device on site is a config change, not a code change.',
          },
          {
            src: '/img/moca/moca-13.webp',
            caption: 'Connection status',
            note: 'Shows connection state and current parameters, with connection test, disconnect and a mock debugging mode.',
            story:
              'Mock mode is our own addition: with no device attached the full assessment can still be walked through for interface debugging. The first thing to do when something breaks on site is switch to mock and see whether it is software or hardware, which saves a lot of triage time.',
          },
          {
            src: '/img/moca/moca-14.webp',
            caption: 'Debug options',
            note: 'Serial logs combined with quick-test and continuous-send tests, for inspecting the communication process and its timing.',
            story:
              '20ms-level tagging precision is not luck — it comes from being able to see every frame sent and received. The log and continuous-send test are the eyes you debug timing problems with.',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — signal interference and peripherals',
        body: [
          'In real wards, commercial devices and the PC share ground and interfere. The project fused neuroscience and software engineering to design a dedicated peripheral device that isolates the signal, while abstracting the acquisition adapter layer to cover device models across several hospitals.',
          'The key engineering target was pushing tag latency to ~20ms, which requires serial reads/writes, event dispatch and timestamp recording to queue without blocking.',
          'Another difficulty was reducing interference from operating the software itself on the patient’s signal. Peripherals were introduced so that "press A to advance" moves off the patient and onto the device side.',
        ],
        media: [
          {
            src: '/img/moca/moca-10.webp',
            caption: 'Rest prompt',
            note: 'During rest the current state is shown in large type so the operator does not mistake the program for a hang.',
            story:
              'The 30-second rest is the baseline segment and the patient must be fully relaxed. So this screen is deliberately sparse: no buttons, no animation, only status — less visual stimulation and fewer mis-taps.',
          },
          {
            src: '/img/moca/moca-07.webp',
            caption: 'Memory test',
            note: 'The system reads the words aloud, the interface prompts listening, and read start and end are tagged separately before recall begins.',
            story:
              'The time structure of the memory task directly determines decoding window boundaries. Read start, read end and recall onset must be tagged separately, otherwise there is no way later to distinguish "hearing" from "remembering" as different neural activity.',
          },
          {
            src: '/img/moca/moca-33.webp',
            caption: 'Delayed recall prompt',
            note: 'The system prompts recall of previously learned words and waits for the operator before entering the selection screen.',
            story:
              'Delayed recall is the step closest to clinical value — it maps onto real hippocampal function. So it gets the most complete tagging: waiting, operator action and selection are each separate events.',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — designing paradigm and product together',
        body: [
          'The rebuild was driven by "the final code table is the only standard"; legacy rules were discarded so two semantics for the same event could never coexist in historical data.',
          'Documentation writes down the complete tagging flow and UI transition timing for all 14 steps, including background colour, font size and A-key behaviour, so handovers need no verbal supplement.',
          'Engineering went through more than 30 minor versions, continuously refining paradigm and interface to minimise the software’s own interference with patient signals, implementing 50 distinct signal codes and a dozen-plus cognitive tasks while recording human supervision, EEG sampling and system operation as three parallel streams.',
        ],
        media: [
          {
            src: '/img/moca/moca-25.webp',
            caption: 'Sentence repetition, first sentence',
            note: 'The screen shows the repetition text, recording state and timer; speech onset/offset and recording state enter the event stream together.',
            story:
              'Language tasks need both "what was said" and "the time window". With a recording-state indicator, speech boundaries can be read straight out of the operator log instead of being aligned to audio waveforms by hand afterwards.',
          },
          {
            src: '/img/moca/moca-27.webp',
            caption: 'Verbal fluency recording',
            note: 'The interface asks for animal names, shows recording state and timer, and offers playback after saving.',
            story:
              'Verbal fluency is usually scored as word fluency: how many animal names per unit time. Once recording and timing are separated, this metric can be computed automatically and operators no longer need a stopwatch.',
          },
          {
            src: '/img/moca/moca-43.webp',
            caption: 'Results',
            note: 'The results page shows subject information, total score, per-module results and a ZIP export entry — the whole assessment at a glance.',
            story:
              'The results page is where this system turns from an experiment tool into a clinical one. Researchers need the signal; operators and physicians need the scores and subscores. Both needs hold in the same result set.',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — clinical validation and publication',
        body: [
          'The tagging software has been tested on 20+ patient datasets across Nanjing Drum Tower Hospital, Shenzhen Second People’s Hospital and Guangzhou Sanjiu Brain Hospital, and software copyright has been filed.',
          'Related work was completed as second author on an ICLR 2027 paper (currently in rebuttal), with participation from experimental design through to authorship.',
          'The research contribution is opening the black box of EEG decoding: Stage 1 freezes four different backbones, builds adapters on eight datasets and trains only a simple linear head, so capability depends mainly on the backbone’s own encoding; Stage 2 designs perturbations along temporal, spatial, spectral and micro-event axes, comparing clean and perturbed outputs through linear probes.',
        ],
        media: [
          {
            src: '/img/moca/moca-11.webp',
            caption: 'History',
            note: 'The list shows record time and total score, with search, view, export and "open record folder" actions.',
            story:
              'The "open record folder" button exists for research: raw files, event tables and config snapshots for each acquisition live in one directory, so analysis scripts can run over a directory without manual tidy-up.',
          },
          {
            src: '/img/moca/moca-44.webp',
            caption: 'Export assessment report',
            note: 'Exporting opens a save dialog where the destination and ZIP filename can be chosen.',
            story:
              'The exported ZIP contains the assessment report, the event table and the configuration. That makes one acquisition independently reproducible — change machines or operators and the data still stands.',
          },
          {
            src: '/img/moca/moca-16.webp',
            caption: 'About the system',
            note: 'Shows software version, build date, technical environment and copyright information, matching the copyright registration materials.',
            story:
              'This screen exists for the copyright registration. Version and build date must correspond exactly to the delivered code snapshot, otherwise the description in the registration materials becomes an unverifiable claim.',
          },
        ],
      },
    ],
    gallery: [
      { src: '/img/moca/cover.webp', caption: 'MoCA EEG acquisition system' },
      { src: '/img/moca/moca-01.webp', caption: 'Home screen' },
      { src: '/img/moca/moca-02.webp', caption: 'Visuospatial trail making' },
      { src: '/img/moca/moca-04.webp', caption: 'Cube copying' },
      { src: '/img/moca/moca-05.webp', caption: 'Clock drawing' },
      { src: '/img/moca/moca-33.webp', caption: 'Delayed recall' },
      { src: '/img/moca/moca-43.webp', caption: 'Results' },
      { src: '/img/moca/moca-44.webp', caption: 'Export assessment report' },
      { src: '/img/moca/moca-15.webp', caption: 'Code table settings' },
      { src: '/img/moca/moca-13.webp', caption: 'Connection status' },
    ],
    diagrams: [{ id: 'moca-seq', title: 'Full tagging timeline' }],
  },

  fupan: {
    slug: 'fupan',
    subtitle: 'Risk Identification Agent for Government Poverty Relief',
    summary:
      'A risk identification agent for anti-poverty monitoring, built on Spring AI and a locally deployed quantised Qwen, with evidence-bearing reasoning output and Agent/MCP tools structured into the business chain.',
    coverCaption: 'Anti-poverty agent conversation and risk identification',
    role: 'AI application R&D intern',
    org: 'China Telecom Digital Intelligence Technology · Hainan Branch R&D Center',
    bba: {
      before:
        'Anti-poverty monitoring relied on manually comparing household files against government databases; data items were scattered, rules complex, and grassroots verification cycles were long and untraceable.',
      built:
        'Spring AI’s OpenAI-compatible adapter connects to an intranet model service, and a ReactAgent (tool registration + model tool selection + summarisation hook) carries multimodal file input through to evidence-bearing reasoning output.',
      after:
        'The prototype closed the full loop from data-item mapping through model connectivity to Agent orchestration, and delivered an executable phased implementation plan with acceptance criteria.',
    },
    facts: [
      { label: 'Agent orchestration', value: 'ReactAgent' },
      { label: 'Model deployment', value: 'Local quantised Qwen' },
      { label: 'Data items', value: '5000 sample set' },
      { label: 'Interfaces', value: 'vlChat / analyze-image' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — risk identification in a government setting',
        body: [
          'Anti-poverty monitoring means cross-checking household files against government databases to flag return-to-poverty risk. This is not a general question-answering problem: it needs structured data items, stable rules and an auditable reasoning process.',
          'The reality is that data items live in scattered sources and rules live in people’s heads. The project’s core question was therefore defined as: how do scattered policy, household files, family information, fiscal burden and income become a grounded risk score.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/fupan-06.webp',
            caption: 'Multimodal file input',
            note: 'Household records arrive mostly as images of varying resolution and format; the system understands and normalises fields at the input stage.',
            story:
              'OCR can recognise characters but not understand. This version solved "accurate enough OCR, no agency" by calling a locally deployed Qwen VL to fill in what cannot be resolved, then synthesising multiple documents into one household’s profile, and finally constraining the return value with a schema so the decision stage cannot misjudge or drop data.',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — reasoning output with evidence',
        body: [
          'The system does not accept "what the model said"; it only accepts "which data item led the model to this conclusion". Every risk judgement binds to a data item and its source, so the output can be checked line by line by grassroots staff.',
          'Engineering-wise, the Agent and MCP tools are structured into the existing business chain rather than spun up as a separate application.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/fupan-01.webp',
            caption: 'Agent conversation',
            note: 'The conversation gives the risk judgement together with the data item behind it, so grassroots staff can verify each source.',
            story:
              'This screen decides whether the prototype is usable in a government setting. A conclusion without evidence cannot be trusted at the grassroots level, so every risk statement carries a clickable data-item source — which pushes the model into a supporting role.',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — intranet model service integration',
        body: [
          'Because the intranet model service behaves unpredictably on auto-configured compatible endpoints, MultiModelConfig manually builds openAiChatModel, with openAiChatClient as the text entry and qwen3VlLocalChatClient as the vision entry.',
          'ChatbotAgent composes ChatModel, CheckpointSaver (MemorySaver), SummarisationHook and a list of ToolCallbacks inside ReactAgent, giving it tool registration, model tool selection and context summarisation.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/fupan-04.webp',
            caption: 'Risk result with evidence',
            note: 'Output is structured as conclusion + data item + source, ready to enter human review.',
            story:
              'Spring AI is valuable because it makes the three capabilities of an agent — tool registration, model tool selection and context summarisation — composable parts instead of something you write from scratch. That is what made a usable prototype possible in two weeks.',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — compliance, audit and data governance',
        body: [
          'The government context forces three things to be designed first: data governance and the 5000-sample build plan, security compliance and audit design, and the first-phase boundary of the risk identification model.',
          'The project uses an end-to-end Dify / Spring AI workflow for multimodal file input, combined with locally deployed quantised models so that sensitive data never leaves the intranet.',
          'The stack uses Spring and a modern JDK to satisfy government and enterprise security audit requirements; everything from data input to output completes inside the intranet.',
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — a phased roadmap',
        body: [
          'The design document is organised as a numbered sequence: current-state analysis → Spring AI layered architecture adaptation → risk identification rules → Agent and MCP tool integration design → data governance and sample building → security compliance and audit → phase-one implementation plan → assistance asset model extension → roadmap and acceptance criteria.',
          'Each step has a defined deliverable and acceptance measure rather than "keep optimising".',
          'On the workflow side, Dify chains material recognition, field normalisation, rule-based triage and report generation; rules are written rigidly into the assessment logic, then combined with RAG and the latest policy to assess return-to-poverty probability and causes and propose remedies tailored to each household.',
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — current stage',
        body: [
          'Prototype outcomes: model service connectivity, request-path compatibility, working basic text and image calls, and a working foundation for Agent orchestration.',
          'The current direction moves from "model connectivity" toward "a government-usable agent", later extending to risk elimination and an assistance asset model.',
        ],
      },
    ],
    gallery: [
      { src: '/img/fupanpolymed/fupan-01.webp', caption: 'Agent conversation' },
      { src: '/img/fupanpolymed/fupan-04.webp', caption: 'Risk result with evidence' },
      { src: '/img/fupanpolymed/fupan-06.webp', caption: 'Multimodal file input' },
    ],
    diagrams: [{ id: 'fupan-arch', title: 'Agent and model service architecture' }],
  },

  polymed: {
    slug: 'polymed',
    subtitle: 'Intelligent Medication Management Mini-Program',
    summary:
      'A RAG-based medication assistant agent running as a microservice, connecting patient, family and clinician surfaces so that orders reach patients intelligently and adherence is observable in real time.',
    coverCaption: 'PolyMed medication mini-program · patient surface',
    role: 'Software development (team collaboration)',
    org: 'Sun Yat-sen University School of Medicine · PolyMed',
    bba: {
      before:
        'Medication plans were handed over on paper or verbally; patients understood little about dosage, contraindications and interactions; family could not remotely confirm whether a dose was taken, and medication error risk concentrated after discharge.',
      built:
        'Using case files and prescriptions provided by the medical school, a VL model recognises and matches against the drug database, and RAG builds a microservice medication assistant agent that speaks Cantonese and Mandarin.',
      after:
        'Patient, family and clinician surfaces close the loop: orders reach patients intelligently, adherence is monitored live, and medication risk moves from "relying on willpower" to "being observable".',
    },
    facts: [
      { label: 'Surfaces', value: 'Patient / Family / Doctor' },
      { label: 'Input modalities', value: 'VL multimodal + speech' },
      { label: 'Languages', value: 'Cantonese / Mandarin' },
      { label: 'Knowledge organisation', value: 'RAG microservice' },
    ],
    sections: [
      {
        id: 'problem',
        no: '01',
        title: 'Problem — medication risk after discharge',
        body: [
          'A clinical medication plan is explained once at discharge, but in a multi-drug regime for an older patient, dosage, contraindications and interactions are hard to retain from a single conversation.',
          'At the same time the clinician has no feedback channel and cannot tell whether the patient actually took the medication.',
          'Concretely, an older patient’s medication list is complex and requires long-term scheduled dosing — antihypertensives, insulin and chronic disease medications. An interruption or a mis-dose is often more dangerous than the disease itself. And declining memory and cognition are precisely the shared trait of this patient group.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/polymed-01.webp',
            caption: 'Patient surface · medication assistant',
            ratio: '736 / 1600',
            note: 'Patients see their own medication list and current dose status inside the mini-program, bound to their care team after a quick scan registration.',
            story:
              'The first patient surface was only a prescription list, and nurses had to shout in a group chat to find anyone. Adding a "what do I take today" entry made patients able to self-confirm, and only then did people actually use it — the first step of medication management is not saving doctors time, it is not troubling doctors.',
          },
        ],
      },
      {
        id: 'solution',
        no: '02',
        title: 'Solution — a three-surface closed loop',
        body: [
          'Patients ask in natural language whether to take a drug before or after meals, and the agent answers from their own case file and drug database rather than offering generic advice.',
          'The family surface provides a remote monitoring view; orders issued by the clinician land in structured storage, and adherence flows back in real time as a record clinicians can actually query.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/polymed-05.webp',
            caption: 'Medication plan and cautions',
            ratio: '736 / 1600',
            note: 'Each order carries its timing, dose and cautions, and the agent’s answer is bound to that specific order.',
            story:
              'The hardest part of a medication assistant is "not being wrong". So the answer is not freely generated: it is retrieved from that patient’s structured order record and then phrased — better to be verbose than to give generic advice that contradicts their own orders.',
          },
          {
            src: '/img/fupanpolymed/polymed-09.webp',
            caption: 'Family monitoring',
            ratio: '736 / 1600',
            note: 'Family can see whether the patient took medication on time and receive anomaly alerts, forming a remote care loop.',
            story:
              'The family surface is the most underrated part of the system. Older adults may not use a smartphone well, but their children do. So "caring" lives on the child’s side and the parent’s side keeps only the simplest operations.',
          },
          {
            src: '/img/fupanpolymed/polymed-13.webp',
            caption: 'Clinician orders',
            ratio: '736 / 1600',
            note: 'Orders issued by clinicians are structured automatically and synced to the patient and family surfaces, with adherence flowing back in real time.',
            story:
              'The clinician surface is where the loop starts. We deliberately did not ask clinicians to fill in complex forms — they keep issuing orders the way they are used to, and the system converts them into structured data for the other two surfaces. Forcing clinicians to change working habits is the most common failure mode of in-hospital systems.',
          },
        ],
      },
      {
        id: 'architecture',
        no: '03',
        title: 'Architecture — RAG and multimodal recognition',
        body: [
          'RAG builds a microservice medication assistant agent whose knowledge source is the case files and prescriptions provided by the medical school.',
          'VL multimodal capability converts prescription images into structured drug information that can be matched against the drug database.',
          'Engineering-wise the backend and admin use the yudao-vue-pro framework, the mini-program uses the unibest framework, and the agent is carried by a Python LangChain microservice.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/polymed-06.webp',
            caption: 'Prescription recognition and drug matching',
            ratio: '736 / 1600',
            note: 'Scanning the medication list lets a VL model recognise drug information, which is then matched against the drug database.',
            story:
              'The "scan the prescription" step removes a nurse’s manual data entry. Older patients leave hospital with a paper prescription, and having relatives type dozens of drug names is slow and error-prone; recognising first and letting the user confirm is far more reliable than writing straight into the database.',
          },
        ],
      },
      {
        id: 'engineering',
        no: '04',
        title: 'Engineering — the Cantonese challenge',
        body: [
          'The patient population speaks mostly Cantonese, and dialect capability in both recognition and generation directly determines usability, so the agent has to handle dialect input on both the retrieval and the generation side.',
          'Another engineering consideration is privacy: medication data is sensitive health information, and splitting into microservices must avoid leaking unrelated case data through the retrieval chain.',
          'On medical safety, rules for multi-drug interactions were designed under professional guidance from the medical school, so patients cannot be led into an adverse interaction.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/polymed-11.webp',
            caption: 'Voice question about medication',
            ratio: '736 / 1600',
            note: 'Patients can ask about their current medication in Cantonese or Mandarin, and report adverse reactions verbally.',
            story:
              'Cantonese support is the dividing line of usability. The target group is middle-aged and older people in eastern and western Guangdong — many understand Mandarin but do not speak it fluently, and lose confidence the moment they start talking. Only after adapting both retrieval and generation to the dialect did "just ask" actually work.',
          },
        ],
      },
      {
        id: 'development',
        no: '05',
        title: 'Development — from prototype to three surfaces',
        body: [
          'The project grew from validating RAG and agent capabilities in isolation to a complete flow across patient, family and clinician surfaces.',
          'Division of labour between the three surfaces was settled early, avoiding the design distortion where the patient surface ends up doing the clinician’s job.',
          'Within the team I was responsible for software development, covering requirement decomposition, task scheduling and running multiple projects in parallel; the multi-surface implementation and business rules were delivered collaboratively by the team.',
        ],
        media: [
          {
            src: '/img/fupanpolymed/polymed-14.webp',
            caption: 'Post-discharge follow-up',
            ratio: '736 / 1600',
            note: 'At 15 and 30 days after medication starts, follow-up and psychometrics are initiated automatically and feedback collected.',
            story:
              'Post-discharge follow-up is a piece we added ourselves, from the clinical observation that the first two weeks after discharge are a high-incidence window. The system initiates follow-ups on a schedule, turning "remember to call back" into a responsibility of the system rather than of a person’s diligence.',
          },
        ],
      },
      {
        id: 'results',
        no: '06',
        title: 'Results — current status',
        body: [
          'The three-surface architecture and the RAG medication assistant agent are implemented; patients can discuss their medication and cautions with the agent in Cantonese or Mandarin.',
          'The chain of intelligent order issuance and real-time adherence monitoring is connected, making medication errors far more observable.',
          'The system records daily dosing times as medical reference for clinicians, and multi-drug interaction rules were co-designed under professional guidance from the medical school.',
        ],
      },
    ],
    gallery: [
      { src: '/img/fupanpolymed/polymed-01.webp', caption: 'Patient surface · medication assistant', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-05.webp', caption: 'Medication plan and cautions', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-06.webp', caption: 'Prescription recognition', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-09.webp', caption: 'Family monitoring', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-11.webp', caption: 'Voice question about medication', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-13.webp', caption: 'Clinician orders', ratio: '736 / 1600' },
      { src: '/img/fupanpolymed/polymed-14.webp', caption: 'Post-discharge follow-up', ratio: '736 / 1600' },
    ],
    diagrams: [],
  },
}

/** 取得项目的中/英版本（英文缺失时回落到中文主数据） */
export function getProjectEn(slug: string): EnProject | undefined {
  return projectsEn[slug]
}
