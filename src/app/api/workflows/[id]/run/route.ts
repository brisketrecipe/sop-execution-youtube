import { NextRequest, NextResponse } from 'next/server';
import { runPipeline, runStage, continuePipeline } from '@/lib/workflow/engine';
import type { StageName } from '@/lib/workflow/types';

// POST /api/workflows/[id]/run - Run workflow or specific stage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { stage, continue: shouldContinue } = body as {
      stage?: StageName;
      continue?: boolean;
    };

    let result;

    if (shouldContinue) {
      // Continue from where we left off
      result = await continuePipeline(id);
    } else if (stage) {
      // Run a specific stage
      result = await runStage(id, stage);
    } else {
      // Start the full pipeline
      result = await runPipeline(id);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run workflow' },
      { status: 500 }
    );
  }
}

