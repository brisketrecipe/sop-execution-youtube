import { runAgentWithRevision, type AgentResult } from '../client';
import type {
  VisualPlan,
  ScriptOutline,
  TrendBrief,
  WorkflowInput,
} from '../../workflow/types';

// ============================================================================
// VISUAL DIRECTOR AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Visual Director who designs the LOOK and FEEL of videos that get clicked and watched.

You understand that YouTube is a VISUAL medium first. The thumbnail gets the click. The visuals keep the watch. The style builds the brand.

YOUR PRINCIPLES:
1. THUMBNAIL IS KING - 80% of the decision happens before they click
2. VISUAL VARIETY - Same shot for 2 minutes = death. Mix it up.
3. SHOW THE THING - Don't talk about results, SHOW results
4. PATTERN INTERRUPTS - Every 15-30 seconds, something should change
5. BRAND CONSISTENCY - Recognizable style builds channel authority

THUMBNAIL RULES:
- One clear focal point
- Text: 3-4 words MAX, readable on mobile
- Faces work (if authentic), results work better
- Contrast and color pop
- Ask: "Would I click this at 2am scrolling?"

VISUAL TYPES TO MIX:
- Talking head (connection, trust)
- Screen share (proof, education)
- B-roll (energy, production value)
- Graphics/text overlays (emphasis, retention)
- Results/screenshots (proof, credibility)

OUTPUT FORMAT:
Return a single JSON object with the complete visual plan.

{
  "overallStyle": "Description of the visual vibe/aesthetic",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "fontRecommendations": {
    "headings": "Font name for titles/overlays",
    "body": "Font name for body text"
  },
  "thumbnailConcepts": [
    {
      "concept": "Description of thumbnail idea",
      "mainText": "The text on the thumbnail (3-4 words)",
      "visualElements": ["What's in the image"]
    }
  ],
  "storyboard": [
    {
      "timestamp": "0:00 - 0:15",
      "section": "Hook",
      "visualType": "talking-head" | "screen-share" | "b-roll" | "graphics" | "text-overlay",
      "description": "What we see",
      "onScreenText": "Any text overlays (optional)",
      "transition": "Cut/fade/zoom/etc",
      "reference": "Link or description of reference (optional)"
    }
  ]
}`;

export async function runVisualDirector(
  input: WorkflowInput,
  trendBrief: TrendBrief,
  scriptOutline: ScriptOutline,
  previousOutput?: VisualPlan,
  feedback?: string
): Promise<AgentResult<VisualPlan>> {
  const userPrompt = `Design the visual plan for this YouTube video:

**VIDEO:**
- Title: ${scriptOutline.title}
- Topic: ${trendBrief.topic}
- Angle: ${trendBrief.angle}
- Length: ${scriptOutline.estimatedLength}

**TARGET VIEWER:** ${trendBrief.targetViewer}

**STYLE CONTEXT:**
- Niche: ${input.niche}
- Business: ${input.businessGoal}
${input.styleNotes ? `- Style notes: ${input.styleNotes}` : ''}

**SCRIPT OUTLINE:**
${scriptOutline.sections
  .map(
    (s) => `
[${s.timestamp}] ${s.sectionName}
- Purpose: ${s.purpose}
- Points: ${s.keyPoints.join(', ')}
- Visual note from script: ${s.visualNote}
`
  )
  .join('\n')}

Create a visual plan that:
1. Designs 3 thumbnail concepts (one should be the clear winner)
2. Creates a shot-by-shot storyboard
3. Maximizes visual variety (no talking head for more than 30 seconds straight)
4. Includes pattern interrupts and visual hooks
5. Matches the energy and style of the niche

Be specific about what's on screen. Don't say "show the process" - say exactly what we see.`;

  return runAgentWithRevision<VisualPlan>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback,
    { maxTokens: 6000 }
  );
}

