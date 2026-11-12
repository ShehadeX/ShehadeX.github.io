/**
 * 论文页的英文版本。
 *
 * 论文本身就是英文写作，因此标题/副标题/任务名沿用原文，
 * 只翻译解释性文案（摘要、贡献说明、协议说明、结论与边界）。
 */

export const researchPaperEn = {
  subtitle: 'Calibrated Diagnosis of EEG Foundation Models',
  status: 'Under Review · Rebuttal',
  authors: 'Anonymous authors (double-blind)',
  abstract:
    'EEG foundation models score highly on downstream tasks, but a score cannot say which properties of the signal the prediction actually depends on. Existing input-perturbation methods are also insufficient: the effect of a perturbation is confounded by the adapter, the readout, and artefacts introduced by the perturbation itself. We propose a cross-architecture diagnostic benchmark with neurophysiology as the shared reference: freeze each model’s adapter, pretrained backbone and readout, then apply eight diagnostic protocols to the input with no further training; pair every intervention with a control that separates the target effect from its main side effect; and calibrate three representative protocols on synthetic EEG with known signal dependencies.',
  contributions: [
    {
      no: '01',
      title: 'A controlled diagnostic benchmark with planted ground-truth calibration',
      desc: 'Two-stage decoupling + paired controls + synthetic calibration. All physical interventions are applied before the model’s own input representation, so heterogeneous models can be compared within one experimental setting.',
    },
    {
      no: '02',
      title: 'A repetitive pattern hidden by scalar scores',
      desc: 'Five published EEG foundation models, four tasks and eight protocols yield a consistent profile: predictions rely broadly on coarse structure of the signal and respond only weakly to the fine structure that physiology points to.',
    },
    {
      no: '03',
      title: 'A closed loop from diagnosis to improvement',
      desc: 'Replacing only the interface and re-running the same protocol attributes the phenomenon to either the interface layer or the backbone. Refitting the readout recovers properties the representation leaves idle; what remains becomes a named target for the next generation of pretraining.',
    },
  ],
  tasks: [
    { name: 'Motor Imagery', metric: 'AUROC', chance: '0.5', mechanism: 'Motor cortex lateralisation' },
    { name: 'Seizure Detection', metric: 'AUROC', chance: '0.5', mechanism: 'Ictal discharges' },
    { name: 'Sleep Staging', metric: 'Balanced Acc', chance: '0.2', mechanism: 'Sleep-stage rhythms' },
    { name: 'Emotion Recognition', metric: 'AUROC-OvR', chance: '0.5', mechanism: 'Emotion-related bands' },
  ],
  findings: [
    {
      metric: '0.18–0.28',
      label: 'AUROC loss from swapping hemisphere electrodes',
      detail:
        'On motor imagery, swapping homologous electrodes between hemispheres drops AUROC by 0.18–0.28; completely masking the predefined central sensorimotor area changes performance by less than 0.04.',
    },
    {
      metric: '≈ 0',
      label: 'Absence of fine-structure response',
      detail:
        'Two models that preserve input amplitude stay highly predictable after the raw waveform is replaced by RMS-matched background; but when the raw waveform is kept and only strongly attenuated, performance falls below chance.',
    },
    {
      metric: '2×',
      label: 'Sensitivity gap at similar scores',
      detail:
        'CBraMod and CSBrain have nearly identical clean AUROC on motor imagery (0.750 vs 0.748), yet full frontal masking affects CSBrain almost twice as much as CBraMod.',
    },
    {
      metric: '13–28%',
      label: 'Share recoverable by readout refitting',
      detail:
        'Freezing the backbone and refitting only a linear readout with mirror augmentation makes motor imagery predictions respond more consistently to electrode swaps. Whatever cannot be reversed remains attributable to the backbone and becomes a pretraining target.',
    },
  ],
  protocols: [
    {
      id: 'S1.1',
      name: 'Region Criticality',
      dimension: 'Spatial',
      question: 'Does the prediction depend on local scalp tissue (regional fine structure)?',
      intervention: 'Mask one of five lobar regions, ratio ρ ∈ {0.25, 0.5, 0.75, 1}',
      control: 'Equal-count random channel masking outside the region + time-shuffle control',
    },
    {
      id: 'S1.2',
      name: 'Montage Swap',
      dimension: 'Spatial',
      question: 'Does the prediction depend on left-right electrode arrangement (montage structure)?',
      intervention: 'Swap homologous electrode pairs between hemispheres',
      control: 'Non-lateralised task (Sleep) as control',
    },
    {
      id: 'S2.x',
      name: 'Spectral / Aperture',
      dimension: 'Temporal–Spectral',
      question: 'Does the prediction depend on short-window steady-state content, or on the microstructure of physiological rhythms?',
      intervention: 'Low-pass filtering, aperture truncation, band removal',
      control: 'Time shuffle, zero-padding and repeat-padding comparison',
    },
    {
      id: 'S3.x',
      name: 'Artifact & Background',
      dimension: 'Artifact & Background',
      question: 'Does the prediction depend on input amplitude, or on amplitude-independent waveform?',
      intervention: 'RMS-matched background replacement, strong attenuation, ocular artefact injection',
      control: 'Fixed-scaling control + synthetic ground-truth calibration',
    },
  ],
  limitations: [
    'Each model is evaluated at a single frozen linear state and each task uses one dataset; Seizure and Emotion contain only 3 test subjects each.',
    'Synthetic calibration covers three of the eight protocols; some integrated response coordinates are reported per state without full subject-level bootstrap propagation.',
    'Conclusions should be read as properties of the evaluated routes and datasets, not of EEG foundation models in general. Broader validation requires more cohorts, state families, baselines and independently recorded artefacts.',
  ],
  reproducibility: {
    items: [
      'Subject-disjoint split manifests',
      'Pre-registered perturbation parameters',
      'Condition-level records and execution receipts',
      'Test-subject bootstrap confidence intervals',
      'Mean and standard deviation over N = 3 independent fitted states',
    ],
  },
  aiStatement:
    'Disclosed under the ICLR 2027 author AI policy: large language models participated in translating the draft into English, implementing and refactoring pipeline code, reordering dataset records, critically reviewing methodological and interpretive claims, literature discovery, manuscript–artefact consistency checks, proofreading and LaTeX typesetting. AI did not generate data, empirical observations or scorecard values. The research question, hypotheses, mathematical statements, perturbation design and diagnostic protocols were defined by the authors; the authors inspected the underlying records, adjudicated every AI suggestion, and reviewed and tested every retained claim and code change.',
}
