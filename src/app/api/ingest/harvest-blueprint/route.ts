import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';
import { requireBlueprintOwner, authErrorResponse } from '@/lib/routeAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { blueprintId, blueprintJson } = await req.json();

    if (!blueprintId || !blueprintJson) {
      return NextResponse.json({ error: 'Missing blueprint data' }, { status: 400 });
    }

    // Caller must own the blueprint before we harvest its facts into the vault
    try {
      await requireBlueprintOwner(blueprintId);
    } catch (authErr) {
      return authErrorResponse(authErr);
    }

    await knowledgeIngestService.harvestBlueprint(blueprintId, blueprintJson);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Harvest API Error]:', error);
    return NextResponse.json({ error: 'Harvesting failed' }, { status: 500 });
  }
}
