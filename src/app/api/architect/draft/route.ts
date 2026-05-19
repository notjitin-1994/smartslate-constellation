import { NextRequest, NextResponse } from 'next/server';
import { instructionalArchitectService } from '@/lib/services/instructionalArchitectService';
import { createAdminClient } from '@/lib/supabase';
import { requireBlueprintOwner, authErrorResponse } from '@/lib/routeAuth';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const log = createLogger();

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      pedagogicalMode,
      targetModality,
      blueprintId,
      blueprintContext,
    } = body;

    if (!id || !blueprintId) {
      return NextResponse.json(
        { error: 'Missing required node or blueprint identifier.' },
        { status: 400 }
      );
    }

    // Verify the caller owns this blueprint before touching any admin-client operation
    try {
      await requireBlueprintOwner(blueprintId);
    } catch (authErr) {
      return authErrorResponse(authErr);
    }

    log.info('draft.authorized', { blueprintId, nodeId: id });

    // Run the full pipeline — pass the correlation ID so logs are linked
    const result = await instructionalArchitectService.draftNodeScript({
      id,
      title,
      description,
      pedagogicalMode,
      targetModality,
      blueprintId,
      blueprintContext,
    }, log.correlationId);

    // Insert a visual_generations record for every scene and collect the UUIDs.
    // Fire-and-forget the edge function per scene so the response is not gated on generation.
    const supabase = createAdminClient();

    const hydratedScenes = await Promise.all(
      result.nodeScript.scenes.map(async (scene) => {
        const prompt = scene.visual.generationPrompt;
        if (!prompt || prompt.length < 10) return scene;

        try {
          const { data: gen, error: genErr } = await supabase
            .from('visual_generations')
            .insert({ blueprint_id: blueprintId, node_id: id, prompt, status: 'pending' })
            .select('id')
            .single();

          if (genErr) throw genErr;

          // Non-blocking edge function dispatch
          fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-visual`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ generationId: gen.id, prompt, blueprintId }),
            }
          ).catch((err) => console.error('[Architect] Visual dispatch error:', err));

          return { ...scene, visualId: gen.id };
        } catch (err) {
          console.error('[Architect] Failed to create visual record for scene:', scene.id, err);
          return scene;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        nodeScript: { ...result.nodeScript, scenes: hydratedScenes },
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Architect API] Pipeline crash:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during instructional drafting.' },
      { status: 500 }
    );
  }
}
