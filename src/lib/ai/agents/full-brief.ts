import { runAgentWithRevision, type AgentResult } from '../client';
import type { 
  VideoBrief, 
  TopicResearch, 
  ScriptOutline, 
  WorkflowInput 
} from '../../workflow/types';

// ============================================================================
// FULL BRIEF AGENT - Produces the final actionable output
// ============================================================================

const SYSTEM_PROMPT = `You are a Video Brief Writer who produces COMPLETE, READY-TO-RECORD briefs.

Your output must be immediately actionable:
1. A word-for-word script the creator can read while recording
2. Exact build instructions they can follow
3. A clear asset checklist

THE SCRIPT MUST BE:
- Word for word - exactly what to say
- 2-5 minutes when read aloud
- Natural and conversational, not robotic
- Synced with what's on screen

THE BUILD INSTRUCTIONS MUST BE:
- Specific enough to actually follow
- Include exact prompts/settings to use
- Match the script timestamps

OUTPUT FORMAT - Return valid JSON:
{
  "theme": {
    "title": "Final video title",
    "hook": "First line of the video",
    "problemSolved": "What pain point this addresses",
    "targetViewer": "Who this is for",
    "videoLength": "X:XX"
  },
  "tutorial": {
    "toolName": "Name of what we're building",
    "whatItDoes": "One sentence description",
    "toolsUsed": ["Tool 1", "Tool 2"],
    "difficultyLevel": "beginner|intermediate|advanced"
  },
  "script": [
    {
      "timestamp": "0:00",
      "type": "hook|talking|demo|transition|cta",
      "script": "EXACT words to say - write this like you're the creator speaking",
      "onScreen": "What the viewer sees",
      "buildStep": "What to do in the build (if demo section)"
    }
  ],
  "buildSteps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "action": "What to do",
      "exactInstructions": "Specific instructions - include actual prompts, settings, etc.",
      "whatToShow": "What to show on screen",
      "whatToSay": "What to say while doing this"
    }
  ],
  "assets": {
    "thumbnail": {
      "text": "3-4 words for thumbnail",
      "visualDescription": "What the thumbnail shows"
    },
    "screenRecordings": ["What to screen record"],
    "bRoll": ["B-roll needed"],
    "graphics": ["Graphics to create"]
  },
  "cta": {
    "verbalCta": "What to say at the end",
    "descriptionText": "Text for video description",
    "leadMagnet": "Optional free resource to offer"
  }
}

CRITICAL: The script must be WORD FOR WORD what to say. Write it in first person as if you are the creator. Make it sound natural, like they're talking to a friend.`;

export async function runFullBrief(
  input: WorkflowInput,
  topicResearch: TopicResearch,
  scriptOutline: ScriptOutline,
  previousOutput?: VideoBrief,
  feedback?: string
): Promise<AgentResult<VideoBrief>> {
  const userPrompt = `Create the FULL VIDEO BRIEF for:

**VIDEO:**
- Title: ${scriptOutline.title}
- Hook: ${scriptOutline.hook}
- Length: ${scriptOutline.totalLength}

**WHAT WE'RE BUILDING:**
- Name: ${topicResearch.whatWereBuildingName}
- Description: ${topicResearch.whatWereBuildingDescription}
- Tools: ${topicResearch.toolsNeeded.join(', ')}

**OUTLINE:**
${scriptOutline.sections.map(s => `[${s.timestamp}] ${s.sectionType}: ${s.purpose}
  - Show: ${s.whatToShow}
  - Points: ${s.keyPoints.join(', ')}`).join('\n\n')}

**BUILD OVERVIEW:**
${scriptOutline.buildOverview.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**CONTEXT:**
- Target: ${topicResearch.targetViewer}
- Problem: ${topicResearch.problemSolved}
- Niche: ${input.niche}
- Style: ${input.styleNotes || 'Direct and practical'}
- Business: ${input.businessGoal}

Now write the COMPLETE brief with:
1. Word-for-word script (write it like you're the person speaking - natural, conversational)
2. Exact build instructions (specific enough to actually follow)
3. Asset checklist

The script should be 2-5 minutes when read at a normal pace. Every line should be exactly what to say.`;

  return runAgentWithRevision<VideoBrief>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback,
    { maxTokens: 8000, temperature: 0.7 }
  );
}

