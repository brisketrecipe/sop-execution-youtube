import { NextRequest, NextResponse } from 'next/server';
import { createWorkflow, type WorkflowInput, type ControlLevel } from '@/lib/workflow/types';
import { saveWorkflow, listWorkflows } from '@/lib/workflow/storage';

// GET /api/workflows - List all workflows
export async function GET() {
  try {
    const workflows = await listWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, input, controlLevel } = body as {
      name: string;
      input: WorkflowInput;
      controlLevel?: ControlLevel;
    };

    if (!name || !input) {
      return NextResponse.json(
        { error: 'Name and input are required' },
        { status: 400 }
      );
    }

    if (!input.niche || !input.targetAudience || !input.businessGoal) {
      return NextResponse.json(
        { error: 'Input must include niche, targetAudience, and businessGoal' },
        { status: 400 }
      );
    }

    const workflow = createWorkflow(name, input, controlLevel || 'checkpoints');
    await saveWorkflow(workflow);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

