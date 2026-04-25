import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blueprintId, contentType, content, fileName, metadata, blueprintContext } = body;

    if (!contentType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType and content are mandatory.' },
        { status: 400 }
      );
    }

    const result = await knowledgeIngestService.ingest({
      blueprintId: blueprintId || null,
      contentType,
      content,
      fileName,
      metadata,
      blueprintContext,
      useAdmin: true,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[Ingest API Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during asset ingestion.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
