import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get('blueprintId');
    const fileName = searchParams.get('fileName');

    if (!blueprintId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required parameters: blueprintId and fileName.' },
        { status: 400 }
      );
    }

    // Delete all chunks for this specific file in this blueprint
    const { error } = await supabase
      .from('knowledge_vault')
      .delete()
      .eq('blueprint_id', blueprintId)
      .eq('metadata->>source_name', fileName);

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
