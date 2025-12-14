import { NextRequest, NextResponse } from 'next/server';
import { generateBrief } from '@/lib/workflow/simple-engine';

// POST /api/briefs/[id]/generate - Generate or regenerate brief
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { feedback } = body as { feedback?: string };

    const result = await generateBrief(id, feedback);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate brief' },
      { status: 500 }
    );
  }
}

