import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get('blueprintId'); // can be null
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Missing required parameter: fileName.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete all chunks for this specific file owned by the user
    let query = supabase
      .from('knowledge_vault')
      .delete()
      .eq('metadata->>source_name', fileName);

    if (user) {
      query = query.eq('user_id', user.id);
    }

    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    } else {
      query = query.is('blueprint_id', null);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all assets associated with ${fileName}`
    });
  } catch (error: unknown) {
    console.error('[Delete Ingest Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during asset deletion.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
