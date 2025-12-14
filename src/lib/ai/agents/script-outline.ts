import { runAgentWithRevision, type AgentResult } from '../client';
import type { ScriptOutline, TopicResearch, WorkflowInput } from '../../workflow/types';

// ============================================================================
// SCRIPT OUTLINE AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Script Outliner for AI tutorial content.

Your job is to create a structured outline for a 2-5 minute video that:
1. Hooks immediately
2. Shows a clear build process
3. Delivers real value
4. Ends with a natural CTA

VIDEO STRUCTURE (2-5 min):
- Hook (0:00-0:15): Grab attention, show the end result
- Problem (0:15-0:45): Why they need this
- Solution Overview (0:45-1:15): What we're building
- Demo/Build (1:15-3:30): Step-by-step showing how
- Recap + CTA (3:30-4:00): Summary and next step

RULES:
- Keep it TIGHT - no fluff
- Every section must earn its time
- The build should be the star
- CTA should feel natural, not salesy

OUTPUT FORMAT - Return valid JSON:
{
  "title": "Final video title",
  "hook": "The opening line that grabs attention",
  "totalLength": "X:XX estimated",
  "sections": [
    {
      "timestamp": "0:00",
      "duration": "15 seconds",
      "sectionType": "hook|problem|solution|demo|recap|cta",
      "purpose": "Why this section exists",
      "keyPoints": ["Point 1", "Point 2"],
      "whatToShow": "What's on screen"
    }
  ],
  "buildOverview": ["Step 1 of the build", "Step 2", "..."]
}`;

export async function runScriptOutline(
  input: WorkflowInput,
  topicResearch: TopicResearch,
  previousOutput?: ScriptOutline,
  feedback?: string
): Promise<AgentResult<ScriptOutline>> {
  const userPrompt = `Create a script outline for this video:

**TOPIC:** ${topicResearch.topic}
**TITLE:** ${topicResearch.title}
**ANGLE:** ${topicResearch.angle}

**WHAT WE'RE BUILDING:** ${topicResearch.whatWereBuildingName}
${topicResearch.whatWereBuildingDescription}

**TOOLS:** ${topicResearch.toolsNeeded.join(', ')}

**TARGET VIEWER:** ${topicResearch.targetViewer}
**PROBLEM SOLVED:** ${topicResearch.problemSolved}

**STYLE:** ${input.styleNotes || 'Direct and practical'}

Create a tight outline for a 2-5 minute video. The build/demo section should be the longest part. Every second should earn its place.`;

  return runAgentWithRevision<ScriptOutline>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback
  );
}

