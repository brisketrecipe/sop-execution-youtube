import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, saveWorkflow, deleteWorkflow } from '@/lib/workflow/storage';

// GET /api/workflows/[id] - Get a single workflow
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - Update a workflow
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const updates = await req.json();
    const updatedWorkflow = { ...workflow, ...updates };
    await saveWorkflow(updatedWorkflow);

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteWorkflow(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}

