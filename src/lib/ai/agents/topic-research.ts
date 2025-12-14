import { runAgentWithRevision, type AgentResult } from '../client';
import type { TopicResearch, WorkflowInput } from '../../workflow/types';

// ============================================================================
// TOPIC RESEARCH AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Topic Researcher for AI tutorial content.

Your job is to find the PERFECT topic for a 2-5 minute video that:
1. Shows how to build/use something practical with AI
2. Is immediately valuable to the target audience
3. Positions the creator as an expert who can help them

THE VIDEO FORMAT:
- 2-5 minutes total
- Must show building something useful with AI
- Viewer should be able to follow along
- Should attract potential customers

YOU MUST IDENTIFY:
1. The specific topic/angle
2. WHAT we're building (a specific tool, workflow, or automation)
3. What tools we'll use (ChatGPT, Claude, Make.com, etc.)
4. Why this matters NOW

OUTPUT FORMAT - Return valid JSON:
{
  "topic": "The specific topic",
  "title": "Video title (curiosity-driving)",
  "angle": "What makes this unique/different",
  "whyNow": "Why this video right now",
  "targetViewer": "Who will watch this",
  "problemSolved": "What pain point this addresses",
  "whatWereBuildingName": "Name of the thing we're building (e.g., 'Client Onboarding Bot')",
  "whatWereBuildingDescription": "One sentence: what it does",
  "toolsNeeded": ["Tool 1", "Tool 2"],
  "alternativeTopics": [
    {"topic": "Backup option", "angle": "Why it's different"}
  ]
}`;

export async function runTopicResearch(
  input: WorkflowInput,
  previousOutput?: TopicResearch,
  feedback?: string
): Promise<AgentResult<TopicResearch>> {
  const hasTopicIdea = input.topicIdea && input.topicIdea.trim().length > 0;
  
  const userPrompt = hasTopicIdea 
    ? `Create a video topic brief for this SPECIFIC idea:

**TOPIC/IDEA:** ${input.topicIdea}

**CONTEXT:**
- Niche: ${input.niche}
- Target Audience: ${input.targetAudience}
- What they sell: ${input.businessGoal}
${input.styleNotes ? `- Style: ${input.styleNotes}` : ''}

Take this topic idea and flesh it out:
- What exactly should we build/show?
- What tools will we use?
- What's the unique angle?

The video must be 2-5 minutes and show building something practical with AI.`
    : `Find the best video topic for:

**NICHE:** ${input.niche}
**TARGET AUDIENCE:** ${input.targetAudience}
**WHAT THEY SELL:** ${input.businessGoal}
${input.styleNotes ? `**STYLE:** ${input.styleNotes}` : ''}

Requirements:
- Video must be 2-5 minutes
- Must show building something with AI that viewers can follow along
- Should attract potential customers
- Must be specific and actionable, not general advice

What should they build and show in this video?`;

  return runAgentWithRevision<TopicResearch>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback
  );
}

