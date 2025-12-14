import { NextRequest, NextResponse } from 'next/server';
import {
  createSimpleWorkflow,
  listSimpleWorkflows,
} from '@/lib/workflow/simple-engine';
import type { WorkflowInput } from '@/lib/workflow/types';

// GET /api/briefs - List all briefs
export async function GET() {
  try {
    const workflows = listSimpleWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list briefs' },
      { status: 500 }
    );
  }
}

// POST /api/briefs - Create a new brief
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, input } = body as {
      name: string;
      input: WorkflowInput;
    };

    if (!name || !input) {
      return NextResponse.json(
        { error: 'Name and input are required' },
        { status: 400 }
      );
    }

    const workflow = createSimpleWorkflow(name, input);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create brief' },
      { status: 500 }
    );
  }
}

