import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, saveWorkflow } from '@/lib/workflow/storage';
import type { SavedBrief, VideoBrief } from '@/lib/workflow/types';

// POST /api/workflows/[id]/briefs - Save current brief as a version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { name } = body as { name?: string };

    // Get the current full-brief output
    const currentBrief = workflow.stages['full-brief'].output as VideoBrief | undefined;

    if (!currentBrief) {
      return NextResponse.json(
        { error: 'No brief to save - run the full-brief stage first' },
        { status: 400 }
      );
    }

    // Create saved brief
    const savedBrief: SavedBrief = {
      id: crypto.randomUUID(),
      brief: currentBrief,
      topicIdea: workflow.input.topicIdea,
      createdAt: new Date().toISOString(),
      name: name || currentBrief.theme.title,
    };

    // Add to saved briefs
    if (!workflow.savedBriefs) {
      workflow.savedBriefs = [];
    }
    workflow.savedBriefs.unshift(savedBrief); // Add to beginning

    await saveWorkflow(workflow);

    return NextResponse.json({ success: true, savedBrief, workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save brief' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id]/briefs?briefId=xxx - Delete a saved brief
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const briefId = req.nextUrl.searchParams.get('briefId');

    if (!briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 });
    }

    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    workflow.savedBriefs = (workflow.savedBriefs || []).filter(b => b.id !== briefId);
    await saveWorkflow(workflow);

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete brief' },
      { status: 500 }
    );
  }
}

