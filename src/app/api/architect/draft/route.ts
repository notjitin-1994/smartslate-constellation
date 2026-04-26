import { NextRequest, NextResponse } from 'next/server';
import { SupabaseKnowledgeStore } from '@/infrastructure/knowledge/adapters/SupabaseKnowledgeStore';
import { AgenticConstellationOrchestrator } from '@/infrastructure/orchestration/adapters/AgenticConstellationOrchestrator';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, targetModality, blueprintId } = body;

    if (!id || !blueprintId) {
      return NextResponse.json(
        { error: 'Missing required node or blueprint identifier.' },
        { status: 400 }
      );
    }

    const store = new SupabaseKnowledgeStore();
    const orchestrator = new AgenticConstellationOrchestrator();

    // 1. Fetch the Knowledge Ledger (The Source of Truth)
    const ledger = await store.getLedger(blueprintId);
    if (!ledger) {
      return NextResponse.json(
        { error: 'Knowledge Ledger not found. Please ingest blueprint and facts first.' },
        { status: 404 }
      );
    }

    // 2. Orchestrate the Constellation (Mapper -> Storyboarder -> Sentinel)
    const result = await orchestrator.generateStoryboard(title, description, ledger, targetModality);

    // 3. Post-Process Visuals (Keep existing dispatcher logic for backward compatibility)
    let hydratedScript = result.script;
    const promptRegex = /\[VISUAL_PROMPT\][*: ]*([\s\S]*?)(?=\n\n|\[|$)/gi;
    const matches = [...hydratedScript.matchAll(promptRegex)];

    if (matches.length > 0) {
      console.log(`[Orchestrator] Dispatching ${matches.length} deterministic visuals...`);
      const supabase = createAdminClient();

      for (const match of matches) {
        const visualPrompt = match[1].replace(/[#*]/g, '').replace(/^[:\s]*/, '').trim();
        if (!visualPrompt || visualPrompt.length < 10) continue;

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

          const promptStartIndex = match.index!;
          const beforePrompt = hydratedScript.substring(0, promptStartIndex);
          const visualTagRegex = /\[VISUAL\][*: ]*/g;
          const visualMatches = [...beforePrompt.matchAll(visualTagRegex)];
          
          if (visualMatches.length > 0) {
            const lastMatch = visualMatches[visualMatches.length - 1];
            const matchIndex = lastMatch.index!;
            const matchLen = lastMatch[0].length;
            
            hydratedScript = 
              hydratedScript.substring(0, matchIndex) + 
              `[VISUAL:${gen.id}] ` + 
              hydratedScript.substring(matchIndex + matchLen);
          }

          // Trigger worker
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-visual`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ generationId: gen.id, prompt: visualPrompt, blueprintId: blueprintId })
          }).catch(err => console.error('[Orchestrator] Trigger Error:', err));

        } catch (dispatchErr) {
          console.error('[Orchestrator] Dispatch Failure:', dispatchErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        script: hydratedScript,
        citations: ledger.facts.map(f => f.source),
        groundingScore: result.metadata.groundingScore,
        auditLog: result.metadata.auditLog,
        deliverables: result.metadata.deliverables
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Constellation API CRASH]:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during constellation orchestration.' },
      { status: 500 }
    );
  }
}

