import { NextRequest, NextResponse } from 'next/server';
import { approveStage, rejectStage, runStage } from '@/lib/workflow/engine';
import type { StageName } from '@/lib/workflow/types';

// POST /api/workflows/[id]/stages/[stage] - Approve, reject, or rerun a stage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stage: StageName }> }
) {
  try {
    const { id, stage } = await params;
    const body = await req.json();
    const { action, feedback, continueToNext } = body as {
      action: 'approve' | 'reject' | 'rerun';
      feedback?: string;
      continueToNext?: boolean;
    };

    let result;

    switch (action) {
      case 'approve':
        result = await approveStage(id, stage, continueToNext ?? true);
        break;

      case 'reject':
        if (!feedback) {
          return NextResponse.json(
            { error: 'Feedback is required when rejecting a stage' },
            { status: 400 }
          );
        }
        result = await rejectStage(id, stage, feedback);
        break;

      case 'rerun':
        result = await runStage(id, stage, feedback);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or rerun' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process stage action' },
      { status: 500 }
    );
  }
}

