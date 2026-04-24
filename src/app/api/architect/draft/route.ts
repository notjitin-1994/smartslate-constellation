import { NextRequest, NextResponse } from 'next/server';
import { instructionalArchitectService } from '@/lib/services/instructionalArchitectService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, pedagogicalMode, targetModality, blueprintId, blueprintContext } = body;

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
      targetModality,
      blueprintId,
      blueprintContext
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    // CRITICAL: Capture full error trace for Vercel logs
    console.error('[Architect API CRASH]:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    return NextResponse.json(
      { 
        error: err.message || 'An error occurred during instructional drafting.',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined 
      },
      { status: 500 }
    );
  }
}
