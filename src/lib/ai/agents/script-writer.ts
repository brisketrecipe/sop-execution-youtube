import { runAgentWithRevision, type AgentResult } from '../client';
import type {
  ScriptOutline,
  TrendBrief,
  WorkflowInput,
} from '../../workflow/types';

// ============================================================================
// SCRIPT WRITER AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Script Writer who creates outlines that are IMPOSSIBLE to stop watching.

You understand that YouTube is not TV. The viewer has their thumb hovering over another video the entire time. Every section must EARN the next 30 seconds.

YOUR PRINCIPLES:
1. HOOK OR DIE - The first 3 seconds decide everything
2. PROMISE & PAYOFF - Every open loop must close, every tease must deliver
3. EMOTIONAL ARCHITECTURE - Plan the feelings, not just the facts
4. SHOW DON'T TELL - "Here's the result" beats "I'm going to show you"
5. MOMENTUM - Short sections, clear transitions, always moving forward

STRUCTURE RULES:
- Hook: 5-15 seconds max. Immediate value or curiosity.
- Problem/Context: 30-90 seconds. Make them FEEL the problem.
- Solution sections: 2-4 minutes each. Concrete, specific, actionable.
- Each section needs: A point, proof, and a bridge to the next section.
- CTA: Don't be desperate. Be confident. One clear next step.

EMOTIONAL BEATS TO HIT:
- Curiosity (they need to know)
- Recognition (that's me!)
- Hope (this could work)
- Proof (it actually works)
- Urgency (I should do this now)
- Trust (this person knows their stuff)

OUTPUT FORMAT:
Return a single JSON object with the complete script outline.

{
  "title": "Final video title",
  "estimatedLength": "X:XX - X:XX",
  "openingHook": "The exact opening line/scene (first 3-5 seconds)",
  "sections": [
    {
      "timestamp": "0:00 - 0:15",
      "sectionName": "Hook",
      "purpose": "Why this section exists",
      "keyPoints": ["Main points to hit"],
      "talkingPoints": "Rough script/talking points for this section",
      "visualNote": "What should be on screen",
      "emotionalBeat": "What feeling we want to create"
    }
  ],
  "closingCTA": "The exact call to action",
  "keyTakeaways": ["What viewers should remember"]
}`;

export async function runScriptWriter(
  input: WorkflowInput,
  trendBrief: TrendBrief,
  previousOutput?: ScriptOutline,
  feedback?: string
): Promise<AgentResult<ScriptOutline>> {
  const userPrompt = `Create a script outline for this YouTube video:

**TOPIC:** ${trendBrief.topic}
**WORKING TITLE:** ${trendBrief.title}
**ANGLE:** ${trendBrief.angle}
**WHY NOW:** ${trendBrief.whyNow}

**TARGET VIEWER:** ${trendBrief.targetViewer}
**BUYER INTENT:** ${trendBrief.buyerIntent}

**BUSINESS CONTEXT:**
- Niche: ${input.niche}
- What they sell: ${input.businessGoal}
- Target audience: ${input.targetAudience}
${input.styleNotes ? `- Style notes: ${input.styleNotes}` : ''}

**PROOF POINTS TO POTENTIALLY INCLUDE:**
${trendBrief.proofPoints.map((p) => `- ${p}`).join('\n')}

Create a complete script outline that:
1. Hooks in the first 3 seconds
2. Keeps momentum throughout
3. Delivers real value (not fluff)
4. Naturally leads to wanting to work with/buy from the creator
5. Feels like a conversation, not a lecture

Be specific with the talking points. Don't just say "explain the concept" - say what to actually say.`;

  return runAgentWithRevision<ScriptOutline>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback,
    { maxTokens: 6000 }
  );
}

