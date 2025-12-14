import { runAgentWithRevision, type AgentResult } from '../client';
import type { WorkflowInput } from '../../workflow/types';

// ============================================================================
// VIDEO BRIEF GENERATOR - Single comprehensive output
// ============================================================================

export interface ScriptLine {
  timestamp: string;
  type: 'hook' | 'talking' | 'demo' | 'transition' | 'cta';
  script: string;
  onScreen: string;
  buildStep?: string; // What to build/show during this part
}

export interface VideoBrief {
  // THEME
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
    estimatedBuildTime: string;
  };
  
  // LINE-BY-LINE SCRIPT
  script: ScriptLine[];
  
  // BUILD INSTRUCTIONS (step by step)
  buildSteps: {
    stepNumber: number;
    title: string;
    action: string;
    showOnScreen: string;
    talkingPoint: string;
  }[];
  
  // ASSETS NEEDED
  assets: {
    thumbnail: {
      text: string;
      visualDescription: string;
    };
    bRoll: string[];
    screenRecordings: string[];
    graphics: string[];
  };
  
  // CTA
  cta: {
    verbalCta: string;
    description: string;
    leadMagnet?: string;
  };
}

const SYSTEM_PROMPT = `You are a YouTube Video Brief Generator for AI/automation tutorial content.

Your job is to create a COMPLETE, READY-TO-RECORD video brief that includes:
1. A compelling theme and hook
2. A word-for-word script (2-5 minutes)
3. Step-by-step build instructions for what to show
4. An asset checklist

THE VIDEO FORMAT:
- 2-5 minutes total
- Show don't tell - demonstrate building something useful
- Every video teaches how to use AI better
- The build should be achievable in the video timeframe
- Viewer should be able to follow along

SCRIPT RULES:
- Write EXACTLY what to say, word for word
- Keep it conversational, not scripted-sounding
- Include timestamps
- Note what should be on screen for each section
- Mark where to show the build vs talking head

BUILD INSTRUCTION RULES:
- Must be something the viewer can actually build
- Use accessible tools (ChatGPT, Claude, Make.com, Zapier, etc.)
- Each step should be clear and specific
- Include the actual prompts/instructions to use

OUTPUT FORMAT - Return valid JSON:
{
  "theme": {
    "title": "Video title (curiosity-driven)",
    "hook": "First line of the video",
    "problemSolved": "What pain point this addresses",
    "targetViewer": "Who this is for",
    "videoLength": "X:XX estimated"
  },
  "tutorial": {
    "toolName": "Name of what we're building",
    "whatItDoes": "One sentence description",
    "toolsUsed": ["Tool 1", "Tool 2"],
    "difficultyLevel": "beginner|intermediate|advanced",
    "estimatedBuildTime": "X minutes"
  },
  "script": [
    {
      "timestamp": "0:00",
      "type": "hook|talking|demo|transition|cta",
      "script": "Exact words to say",
      "onScreen": "What viewer sees",
      "buildStep": "What to build during this (if demo)"
    }
  ],
  "buildSteps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "action": "What to do",
      "showOnScreen": "What to show",
      "talkingPoint": "What to say while doing it"
    }
  ],
  "assets": {
    "thumbnail": {
      "text": "3-4 words for thumbnail",
      "visualDescription": "What the thumbnail shows"
    },
    "bRoll": ["B-roll clip descriptions"],
    "screenRecordings": ["What to screen record"],
    "graphics": ["Any graphics needed"]
  },
  "cta": {
    "verbalCta": "What to say at the end",
    "description": "What goes in video description",
    "leadMagnet": "Optional free resource to offer"
  }
}`;

export async function generateVideoBrief(
  input: WorkflowInput,
  previousOutput?: VideoBrief,
  feedback?: string
): Promise<AgentResult<VideoBrief>> {
  const userPrompt = `Create a complete video brief for:

**NICHE:** ${input.niche}

**TARGET AUDIENCE:** ${input.targetAudience}

**WHAT I SELL:** ${input.businessGoal}

${input.styleNotes ? `**MY STYLE:** ${input.styleNotes}` : ''}

${input.constraints?.length ? `**CONSTRAINTS:** ${input.constraints.join('; ')}` : ''}

REQUIREMENTS:
- Video must be 2-5 minutes
- Must show how to build/use something with AI
- Must be immediately actionable for viewers
- Script should be word-for-word, ready to record
- Include exact prompts/instructions to use in the build

Create a video that demonstrates expertise while providing real value. The viewer should be able to follow along and build the same thing.`;

  return runAgentWithRevision<VideoBrief>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback,
    { maxTokens: 8000, temperature: 0.8 }
  );
}

