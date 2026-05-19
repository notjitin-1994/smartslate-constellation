import { NextRequest, NextResponse } from 'next/server';
import { requireBlueprintOwner, authErrorResponse } from '@/lib/routeAuth';
import { ULSSchema } from '@/domain/uls/schema';
import { CLG_THRESHOLD } from '@/domain/pedagogy/cognitiveLoad';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { blueprintId, uls } = await req.json();

    if (!blueprintId || !uls) {
      return NextResponse.json({ error: 'Missing blueprintId or uls payload' }, { status: 400 });
    }

    try {
      await requireBlueprintOwner(blueprintId);
    } catch (authErr) {
      return authErrorResponse(authErr);
    }

    // Validate ULS schema before accepting the handover
    const parsed = ULSSchema.safeParse(uls);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ULS schema', details: parsed.error.format() },
        { status: 422 }
      );
    }

    // Cognitive Load Guardrail — block handover if any node exceeds the threshold
    const violated = parsed.data.architecture_nodes.filter(
      (n) => n.cognitive_load > CLG_THRESHOLD
    );
    if (violated.length > 0) {
      return NextResponse.json(
        {
          error: 'CLG_THRESHOLD_EXCEEDED',
          message: `${violated.length} node(s) exceed the cognitive load guardrail (${CLG_THRESHOLD}/10). Simplify content before handover.`,
          violatedNodes: violated.map((n) => ({
            node_id: n.node_id,
            title: n.title,
            cognitive_load: n.cognitive_load,
          })),
        },
        { status: 422 }
      );
    }

    // Transition blueprint status: completed → architecting (signals Nova the ULS is ready)
    const supabase = createAdminClient();
    const { error: updateErr } = await supabase
      .from('blueprint_generator')
      .update({ status: 'architecting' })
      .eq('id', blueprintId);

    if (updateErr) {
      console.error('[Export] Status update failed:', updateErr);
    }

    return NextResponse.json({ success: true, uls: parsed.data });
  } catch (error) {
    console.error('[Export API Error]:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
