import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';
import { requireBlueprintOwner, requireAuth, authErrorResponse } from '@/lib/routeAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

    // If a blueprintId is provided, caller must own it.
    // If no blueprintId (global asset), caller must at least be authenticated.
    let userId: string | null = null;
    try {
      if (blueprintId) {
        const auth = await requireBlueprintOwner(blueprintId);
        userId = auth.userId;
      } else {
        const auth = await requireAuth();
        userId = auth.userId;
      }
    } catch (authErr) {
      return authErrorResponse(authErr);
    }

    const result = await knowledgeIngestService.ingest({
      blueprintId: blueprintId || null,
      userId,
      contentType,
      content,
      fileName,
      metadata,
      blueprintContext,
      useAdmin: true,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred during asset ingestion.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
