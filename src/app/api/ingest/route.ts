import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabaseServer.auth.getUser();

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
      userId: user?.id || null,
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
