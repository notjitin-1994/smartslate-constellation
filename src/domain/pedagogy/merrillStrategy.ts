export type MerrillMode = 'TASK_CENTERED' | 'ACTIVATION' | 'DEMONSTRATION' | 'APPLICATION' | 'INTEGRATION';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface InstructionalStrategy {
  merrillMode: MerrillMode;
  merrillPhase: string;
  cognitiveVerb: string;
  bloomLevel: BloomLevel;
  promptGuidance: string;
}

const STRATEGY_MAP: Record<MerrillMode, InstructionalStrategy> = {
  TASK_CENTERED: {
    merrillMode: 'TASK_CENTERED',
    merrillPhase: 'Anchor every scene to an authentic professional task',
    cognitiveVerb: 'analyze',
    bloomLevel: 'analyze',
    promptGuidance:
      'Open with a real-world task the learner will perform. Every scene must connect back to completing that task. Branching decisions must mirror real job choices with realistic consequences.',
  },
  ACTIVATION: {
    merrillMode: 'ACTIVATION',
    merrillPhase: 'Activate prior knowledge and lived experience',
    cognitiveVerb: 'recall',
    bloomLevel: 'remember',
    promptGuidance:
      'Begin with a provocative question or familiar scenario that surfaces what the learner already knows. First scene must be a knowledge-activation hook — not a definition or objective slide.',
  },
  DEMONSTRATION: {
    merrillMode: 'DEMONSTRATION',
    merrillPhase: 'Show a worked example or annotated procedure',
    cognitiveVerb: 'explain',
    bloomLevel: 'understand',
    promptGuidance:
      'Lead with a clear step-by-step demonstration or case study. Narration explains the WHY behind each step, not just the WHAT. Use annotated walkthroughs, split-screen comparisons, or expert think-aloud.',
  },
  APPLICATION: {
    merrillMode: 'APPLICATION',
    merrillPhase: 'Apply in a realistic scenario with scaffolded feedback',
    cognitiveVerb: 'demonstrate',
    bloomLevel: 'apply',
    promptGuidance:
      'Present a realistic problem. Include at least one branching decision with logical consequences. Activity field must specify a concrete practice task. SpeakerNotes must contain corrective feedback for wrong paths.',
  },
  INTEGRATION: {
    merrillMode: 'INTEGRATION',
    merrillPhase: 'Transfer learning to real-world context',
    cognitiveVerb: 'design',
    bloomLevel: 'create',
    promptGuidance:
      "Final scenes bridge to the learner's actual work context. Prompt reflection, action planning, or creation of a real artifact. Activity should require applying knowledge — not a quiz.",
  },
};

const KEYWORD_MAP: Array<{ keywords: string[]; mode: MerrillMode }> = [
  { keywords: ['activation', 'activate', 'prior', 'hook', 'recall', 'background'], mode: 'ACTIVATION' },
  { keywords: ['demonstration', 'demonstrate', 'show', 'worked example', 'direct instruction', 'direct', 'explicit', 'lecture'], mode: 'DEMONSTRATION' },
  { keywords: ['application', 'apply', 'practice', 'scenario', 'scenario-based', 'problem', 'problem-based', 'case', 'situational'], mode: 'APPLICATION' },
  { keywords: ['integration', 'transfer', 'collaborative', 'reflect', 'real world', 'action', 'project'], mode: 'INTEGRATION' },
  { keywords: ['task', 'task-centered', 'task centered', 'inquiry', 'performance', 'authentic', 'job-task'], mode: 'TASK_CENTERED' },
];

export function resolveInstructionalStrategy(rawMode: string): InstructionalStrategy {
  const lower = rawMode.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return STRATEGY_MAP[entry.mode];
    }
  }
  return STRATEGY_MAP['DEMONSTRATION'];
}

export function resolveMode(rawMode: string): MerrillMode {
  return resolveInstructionalStrategy(rawMode).merrillMode;
}
