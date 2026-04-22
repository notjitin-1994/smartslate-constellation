import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blueprintId, contentType, content, fileName, metadata } = body;

    if (!blueprintId || !contentType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: blueprintId, contentType, and content are mandatory.' },
        { status: 400 }
      );
    }

    const result = await knowledgeIngestService.ingest({
      blueprintId,
      contentType,
      content,
      fileName,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Ingest API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during asset ingestion.' },
      { status: 500 }
    );
  }
}
