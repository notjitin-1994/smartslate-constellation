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

    // --- ASYNCHRONOUS VISUAL DISPATCHER (Hardened Semantic Sniffer V2) ---
    const script = result.script;
    
    /**
     * INDESTRUCTIBLE REGEX:
     * - Matches [VISUAL_PROMPT] in any case.
     * - Handles any amount of markdown wrapping (*, #, _, :)
     * - Captures everything until the next tag or double newline.
     */
    const promptRegex = /\[VISUAL_PROMPT\][*: ]*([\s\S]*?)(?=\n\n|\[|$)/gi;
    const matches = [...script.matchAll(promptRegex)];

    console.log(`[Architect] Parser Sniffer result: Found ${matches.length} prompt candidates.`);

    if (matches.length > 0) {
      const supabase = createAdminClient();

      for (const match of matches) {
        // Clean the captured prompt: strip markdown, extra colons, and internal asterisks
        const visualPrompt = match[1]
          .replace(/[#*]/g, '')
          .replace(/^[:\s]*/, '')
          .trim();

        if (!visualPrompt || visualPrompt.length < 10) continue;

        console.log(`[Architect] Dispatching verified prompt: ${visualPrompt.substring(0, 40)}...`);

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

          // Trigger the Edge Function (Fast Handshake)
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-visual`, {
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
          });

          console.log(`[Architect] Success: Background task queued for ${gen.id}`);
        } catch (dispatchErr) {
          console.error('[Architect] Dispatch Loop Failure:', dispatchErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Architect API CRASH]:', err);
    
    return NextResponse.json(
      { 
        error: err.message || 'An error occurred during instructional drafting.',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined 
      },
      { status: 500 }
    );
  }
}
