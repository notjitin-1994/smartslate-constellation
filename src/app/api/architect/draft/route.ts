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

    // --- ASYNCHRONOUS VISUAL DISPATCHER (Deterministic Trace V4) ---
    let hydratedScript = result.script;
    const promptRegex = /\[VISUAL_PROMPT\][*: ]*([\s\S]*?)(?=\n\n|\[|$)/gi;
    const matches = [...hydratedScript.matchAll(promptRegex)];

    if (matches.length > 0) {
      console.log(`[Architect] Dispatching ${matches.length} deterministic traces...`);
      const supabase = createAdminClient();

      // We iterate through prompts and sequentially inject IDs into the script
      for (const match of matches) {
        const visualPrompt = match[1].replace(/[#*]/g, '').replace(/^[:\s]*/, '').trim();
        if (!visualPrompt || visualPrompt.length < 10) continue;

        try {
          // 1. Create the unique generation record
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

          // 2. REWRITE the [VISUAL] tag to embed this specific UUID
          // We look for the [VISUAL] tag that appears BEFORE this prompt
          const promptStartIndex = match.index!;
          const beforePrompt = hydratedScript.substring(0, promptStartIndex);
          
          // Match [VISUAL] with optional markdown wrapping
          const visualTagRegex = /\[VISUAL\][*: ]*/g;
          const visualMatches = [...beforePrompt.matchAll(visualTagRegex)];
          
          if (visualMatches.length > 0) {
            const lastMatch = visualMatches[visualMatches.length - 1];
            const matchIndex = lastMatch.index!;
            const matchLen = lastMatch[0].length;
            
            // Perform the surgery on the hydrated script
            hydratedScript = 
              hydratedScript.substring(0, matchIndex) + 
              `[VISUAL:${gen.id}] ` + 
              hydratedScript.substring(matchIndex + matchLen);
          }

          // 3. Trigger the worker
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
          }).catch(err => console.error('[Architect] Trigger Error:', err));

        } catch (dispatchErr) {
          console.error('[Architect] Dispatch Failure:', dispatchErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        script: hydratedScript
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Architect API CRASH]:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during instructional drafting.' },
      { status: 500 }
    );
  }
}
