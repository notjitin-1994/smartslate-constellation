import { NextRequest, NextResponse } from 'next/server';
import { instructionalArchitectService } from '@/lib/services/instructionalArchitectService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, pedagogicalMode, blueprintId } = body;

    if (!id || !blueprintId) {
      return NextResponse.json(
        { error: 'Missing required node or blueprint identifier.' },
        { status: 400 }
      );
    }

    const result = await instructionalArchitectService.draftNodeScript({
      id,
      title,
      description,
      pedagogicalMode,
      blueprintId
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[Architect API Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during instructional drafting.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
