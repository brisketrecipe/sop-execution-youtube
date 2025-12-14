import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, saveWorkflow } from '@/lib/workflow/storage';

// PATCH /api/workflows/[id]/topic - Update the topic idea
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await req.json();
    const { topicIdea } = body as { topicIdea: string };

    workflow.input.topicIdea = topicIdea;
    workflow.updatedAt = new Date().toISOString();
    
    // Reset stages if topic changed (optional - you might want to keep them)
    // For now, just update the topic
    
    await saveWorkflow(workflow);

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update topic' },
      { status: 500 }
    );
  }
}

