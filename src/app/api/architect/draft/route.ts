import { NextRequest, NextResponse } from 'next/server';
import { instructionalArchitectService } from '@/lib/services/instructionalArchitectService';
import { createAdminClient } from '@/lib/supabase';

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

    // --- ASYNCHRONOUS VISUAL DISPATCHER ---
    const script = result.script;
    const promptRegex = /\[VISUAL_PROMPT\]:?\s*(.*?)(?=\n|\[|$)/g;
    const matches = [...script.matchAll(promptRegex)];

    if (matches.length > 0) {
      console.log(`[Architect] Dispatching ${matches.length} visual tasks...`);
      const supabase = createAdminClient();

      // Fire-and-forget triggers
      matches.forEach(async (match) => {
        const visualPrompt = match[1].trim();
        if (!visualPrompt) return;

        try {
          const { data: gen, error: genErr } = await supabase
            .from('visual_generations')
            .insert({
              blueprint_id: blueprintId,
              node_id: id,
              prompt: visualPrompt,
              status: 'pending'
            })
            .select()
            .single();

          if (genErr) throw genErr;

          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-visual`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              generationId: gen.id,
              prompt: visualPrompt,
              blueprintId: blueprintId
            })
          }).catch(err => console.error('[Architect] Dispatch Error:', err));

        } catch (dispatchErr) {
          console.error('[Architect] Failed to dispatch visual task:', dispatchErr);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
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
