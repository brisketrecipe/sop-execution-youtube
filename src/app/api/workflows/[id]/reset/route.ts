import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, saveWorkflow } from '@/lib/workflow/storage';
import { STAGES } from '@/lib/workflow/types';

// POST /api/workflows/[id]/reset - Reset workflow to run again
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Reset all stages to pending
    for (const stage of STAGES) {
      workflow.stages[stage] = {
        status: 'pending',
        attempts: 0,
        output: undefined,
        feedback: undefined,
        startedAt: undefined,
        completedAt: undefined,
      };
    }

    workflow.status = 'draft';
    workflow.currentStage = null;
    workflow.error = undefined;
    workflow.updatedAt = new Date().toISOString();

    await saveWorkflow(workflow);

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset workflow' },
      { status: 500 }
    );
  }
}

