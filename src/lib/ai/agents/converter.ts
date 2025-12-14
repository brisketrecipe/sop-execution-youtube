import { runAgentWithRevision, type AgentResult } from '../client';
import type {
  ConversionPlan,
  ScriptOutline,
  HookStrategy,
  TrendBrief,
  WorkflowInput,
} from '../../workflow/types';

// ============================================================================
// CONVERTER AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Conversion Strategist - an expert in turning viewers into customers WITHOUT being salesy.

Your job is to engineer the path from "interesting video" to "I want to work with this person."

THE CONVERSION PHILOSOPHY:
1. VALUE FIRST - They should feel they got something valuable even if they never buy
2. NATURAL PROGRESSION - The CTA should feel like the logical next step, not a pitch
3. TRUST BUILDING - Every element should reinforce expertise and credibility
4. LOW FRICTION - Make it EASY to take the next step
5. MULTIPLE TOUCH POINTS - Not everyone converts on the first video

THE YOUTUBE CONVERSION FUNNEL:
1. Video delivers value → builds trust
2. CTA offers MORE value → captures interest
3. Lead magnet delivers → proves competence
4. Follow-up nurtures → builds relationship
5. Offer presented → converts to customer

CTA PLACEMENT STRATEGY:
- VERBAL (in video): 1-2 mentions max, natural not scripted
- VISUAL (on screen): Subtle, not distracting
- END SCREEN: Clear next step
- DESCRIPTION: First 2 lines are crucial (visible before "show more")
- PINNED COMMENT: Can be more detailed, feels less salesy

TRUST SIGNALS TO WEAVE IN:
- Results/case studies (show don't tell)
- Social proof (clients, testimonials, numbers)
- Demonstration of expertise (teaching proves knowing)
- Relatability (shared struggles, honest about limitations)

OUTPUT FORMAT:
Return a single JSON object with the complete conversion plan.

{
  "primaryOffer": "What you're ultimately selling",
  "valueProposition": "Why someone would buy this (from viewer perspective)",
  "trustSignals": ["Specific credibility elements to include"],
  "leadMagnet": {
    "name": "Name of free resource",
    "description": "What it is and why it's valuable",
    "deliveryMethod": "How they get it (comment trigger, link, etc.)"
  },
  "ctaPlacements": [
    {
      "timestamp": "When in the video",
      "type": "verbal" | "visual" | "end-screen" | "pinned-comment" | "description",
      "script": "Exactly what to say/show",
      "purpose": "Why this CTA here"
    }
  ],
  "descriptionTemplate": "Full YouTube description with links and structure",
  "pinnedCommentTemplate": "The pinned comment text",
  "followUpSequence": ["What happens after they take action"]
}`;

export async function runConverter(
  input: WorkflowInput,
  trendBrief: TrendBrief,
  scriptOutline: ScriptOutline,
  hookStrategy: HookStrategy,
  previousOutput?: ConversionPlan,
  feedback?: string
): Promise<AgentResult<ConversionPlan>> {
  const userPrompt = `Create a conversion strategy for this YouTube video:

**VIDEO:**
- Title: ${scriptOutline.title}
- Topic: ${trendBrief.topic}
- Angle: ${trendBrief.angle}

**TARGET VIEWER:**
${trendBrief.targetViewer}
(Buyer intent: ${trendBrief.buyerIntent})

**BUSINESS CONTEXT:**
- What they sell: ${input.businessGoal}
- Niche: ${input.niche}
- Target audience: ${input.targetAudience}

**VIDEO STRUCTURE:**
${scriptOutline.sections.map((s) => `[${s.timestamp}] ${s.sectionName}`).join('\n')}

**CURRENT CTA FROM SCRIPT:**
"${scriptOutline.closingCTA}"

**KEY TAKEAWAYS:**
${scriptOutline.keyTakeaways.map((t) => `- ${t}`).join('\n')}

Create a conversion strategy that:
1. Designs a compelling lead magnet (if appropriate)
2. Places CTAs naturally throughout (not just at the end)
3. Builds trust without being braggy
4. Makes the next step feel obvious and easy
5. Includes the full description and pinned comment templates

The goal is not to "sell" in the video - it's to make viewers WANT to learn more about working with this person. Subtlety > desperation.`;

  return runAgentWithRevision<ConversionPlan>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback
  );
}

