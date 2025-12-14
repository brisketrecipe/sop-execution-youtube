import { runAgentWithRevision, type AgentResult } from '../client';
import type {
  AssetManifest,
  ScriptOutline,
  VisualPlan,
  HookStrategy,
  TrendBrief,
  WorkflowInput,
} from '../../workflow/types';

// ============================================================================
// ASSET PLANNER AGENT
// ============================================================================

const SYSTEM_PROMPT = `You are a YouTube Asset Planner - a production manager who creates comprehensive, actionable asset lists.

Your job is to turn the creative vision into a concrete checklist of EVERYTHING needed to produce the video.

YOUR PRINCIPLES:
1. NOTHING FORGOTTEN - Every asset mentioned in the script/visuals gets listed
2. SPECIFIC SPECS - Not "create a graphic" but "1920x1080 PNG with X, Y, Z"
3. SOURCE CLARITY - Is this created, recorded, or sourced from stock?
4. PRIORITY TRIAGE - What's must-have vs nice-to-have?
5. REALISTIC ESTIMATES - Don't underestimate prep time

ASSET CATEGORIES:
1. THUMBNAIL
   - Exact dimensions (1280x720)
   - All elements needed
   - Text overlay specs
   
2. GRAPHICS
   - Lower thirds
   - Text overlays
   - Diagrams/illustrations
   - Screenshots to capture
   
3. B-ROLL
   - Stock footage to source
   - Original footage to record
   - Screen recordings needed
   
4. AUDIO
   - Music tracks
   - Sound effects
   - Voiceover notes

5. SCREEN RECORDINGS
   - What software/sites to show
   - What actions to demonstrate
   - What to have ready/set up

OUTPUT FORMAT:
Return a single JSON object with the complete asset manifest.

{
  "thumbnail": {
    "dimensions": "1280x720",
    "elements": ["List of visual elements needed"],
    "textOverlay": "The text that goes on thumbnail",
    "style": "Description of style/treatment"
  },
  "assets": [
    {
      "name": "Descriptive name",
      "type": "thumbnail" | "graphic" | "b-roll" | "audio" | "screen-recording",
      "specs": "Exact specifications",
      "description": "What this asset is/shows",
      "source": "create" | "stock" | "record" | "existing",
      "priority": "must-have" | "nice-to-have"
    }
  ],
  "productionChecklist": [
    "Pre-production task 1",
    "Pre-production task 2"
  ],
  "estimatedPrepTime": "X hours"
}`;

export async function runAssetPlanner(
  input: WorkflowInput,
  trendBrief: TrendBrief,
  scriptOutline: ScriptOutline,
  visualPlan: VisualPlan,
  hookStrategy: HookStrategy,
  previousOutput?: AssetManifest,
  feedback?: string
): Promise<AgentResult<AssetManifest>> {
  const userPrompt = `Create a complete asset manifest for this video production:

**VIDEO:**
- Title: ${scriptOutline.title}
- Length: ${scriptOutline.estimatedLength}
- Topic: ${trendBrief.topic}

**THUMBNAIL REQUIREMENTS:**
- Recommended text: "${hookStrategy.thumbnailTextOptions[0]}"
- Concept: ${visualPlan.thumbnailConcepts[0].concept}
- Elements: ${visualPlan.thumbnailConcepts[0].visualElements.join(', ')}

**STORYBOARD (what needs to be shown):**
${visualPlan.storyboard
  .map(
    (frame) => `
[${frame.timestamp}] ${frame.visualType}
- ${frame.description}
${frame.onScreenText ? `- Text overlay: "${frame.onScreenText}"` : ''}
`
  )
  .join('\n')}

**SCRIPT VISUAL NOTES:**
${scriptOutline.sections.map((s) => `[${s.sectionName}] ${s.visualNote}`).join('\n')}

**STYLE:**
- Overall: ${visualPlan.overallStyle}
- Colors: ${visualPlan.colorPalette.join(', ')}
- Fonts: ${visualPlan.fontRecommendations.headings} / ${visualPlan.fontRecommendations.body}

Create a comprehensive asset list that:
1. Captures EVERYTHING needed for production
2. Provides specific specs (dimensions, formats, etc.)
3. Identifies what to create vs source vs record
4. Prioritizes must-haves vs nice-to-haves
5. Gives a realistic prep time estimate

Be thorough. Missing an asset during production is painful.`;

  return runAgentWithRevision<AssetManifest>(
    SYSTEM_PROMPT,
    userPrompt,
    previousOutput,
    feedback
  );
}

