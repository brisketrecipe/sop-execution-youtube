// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export const STAGES = [
  'topic-research',
  'script-outline', 
  'full-brief',
] as const;

export type StageName = (typeof STAGES)[number];

export const STAGE_LABELS: Record<StageName, string> = {
  'topic-research': 'Topic Research',
  'script-outline': 'Script Outline',
  'full-brief': 'Full Video Brief',
};

// Checkpoint config - which stages require human approval
export type ControlLevel = 'autopilot' | 'checkpoints' | 'full-control';

export const CHECKPOINT_STAGES: Record<ControlLevel, StageName[]> = {
  autopilot: [], 
  checkpoints: ['topic-research', 'full-brief'],
  'full-control': STAGES as unknown as StageName[],
};

// ============================================================================
// STAGE 1: TOPIC RESEARCH OUTPUT
// ============================================================================

export interface TopicResearch {
  topic: string;
  title: string;
  angle: string;
  whyNow: string;
  targetViewer: string;
  problemSolved: string;
  whatWereBuildingName: string;
  whatWereBuildingDescription: string;
  toolsNeeded: string[];
  alternativeTopics: {
    topic: string;
    angle: string;
  }[];
}

// ============================================================================
// STAGE 2: SCRIPT OUTLINE OUTPUT
// ============================================================================

export interface ScriptSection {
  timestamp: string;
  duration: string;
  sectionType: 'hook' | 'problem' | 'solution' | 'demo' | 'recap' | 'cta';
  purpose: string;
  keyPoints: string[];
  whatToShow: string;
}

export interface ScriptOutline {
  title: string;
  hook: string;
  totalLength: string;
  sections: ScriptSection[];
  buildOverview: string[];
}

// ============================================================================
// STAGE 3: FULL VIDEO BRIEF (FINAL OUTPUT)
// ============================================================================

export interface ScriptLine {
  timestamp: string;
  type: 'hook' | 'talking' | 'demo' | 'transition' | 'cta';
  script: string;
  onScreen: string;
  buildStep?: string;
}

export interface BuildStep {
  stepNumber: number;
  title: string;
  action: string;
  exactInstructions: string;
  whatToShow: string;
  whatToSay: string;
}

export interface VideoBrief {
  // OVERVIEW
  theme: {
    title: string;
    hook: string;
    problemSolved: string;
    targetViewer: string;
    videoLength: string;
  };
  
  // WHAT WE'RE BUILDING
  tutorial: {
    toolName: string;
    whatItDoes: string;
    toolsUsed: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  
  // FULL SCRIPT - word for word
  script: ScriptLine[];
  
  // BUILD INSTRUCTIONS
  buildSteps: BuildStep[];
  
  // ASSETS
  assets: {
    thumbnail: {
      text: string;
      visualDescription: string;
    };
    screenRecordings: string[];
    bRoll: string[];
    graphics: string[];
  };
  
  // CTA
  cta: {
    verbalCta: string;
    descriptionText: string;
    leadMagnet?: string;
  };
}

// ============================================================================
// WORKFLOW STATE
// ============================================================================

export interface WorkflowInput {
  niche: string;
  targetAudience: string;
  businessGoal: string;
  styleNotes?: string;
  competitorChannels?: string[];
  constraints?: string[];
  topicIdea?: string; // Optional: specific topic/idea for this video
}

// Saved brief version
export interface SavedBrief {
  id: string;
  brief: VideoBrief;
  topicIdea?: string;
  createdAt: string;
  name?: string;
}

export interface StageExecution {
  status: 'pending' | 'running' | 'awaiting-approval' | 'approved' | 'rejected';
  output?: unknown;
  feedback?: string;
  attempts: number;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  controlLevel: ControlLevel;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  currentStage: StageName | null;
  input: WorkflowInput;
  stages: Record<StageName, StageExecution>;
  savedBriefs: SavedBrief[]; // All saved brief versions
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// Type-safe output getters
export type StageOutputMap = {
  'topic-research': TopicResearch;
  'script-outline': ScriptOutline;
  'full-brief': VideoBrief;
};

export function getStageOutput<T extends StageName>(
  workflow: WorkflowState,
  stage: T
): StageOutputMap[T] | undefined {
  return workflow.stages[stage]?.output as StageOutputMap[T] | undefined;
}

// ============================================================================
// WORKFLOW FACTORY
// ============================================================================

export function createWorkflow(
  name: string,
  input: WorkflowInput,
  controlLevel: ControlLevel = 'full-control'
): WorkflowState {
  const now = new Date().toISOString();

  const stages = {} as Record<StageName, StageExecution>;
  for (const stage of STAGES) {
    stages[stage] = {
      status: 'pending',
      attempts: 0,
    };
  }

  return {
    id: crypto.randomUUID(),
    name,
    controlLevel,
    status: 'draft',
    currentStage: null,
    input,
    stages,
    savedBriefs: [],
    createdAt: now,
    updatedAt: now,
  };
}
