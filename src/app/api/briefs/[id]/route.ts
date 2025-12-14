import { NextRequest, NextResponse } from 'next/server';
import {
  getSimpleWorkflow,
  deleteSimpleWorkflow,
} from '@/lib/workflow/simple-engine';

// GET /api/briefs/[id] - Get a single brief
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = getSimpleWorkflow(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get brief' },
      { status: 500 }
    );
  }
}

// DELETE /api/briefs/[id] - Delete a brief
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteSimpleWorkflow(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Brief not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete brief' },
      { status: 500 }
    );
  }
}

