import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';

export async function POST(req: NextRequest) {
  try {
    const { blueprintId, blueprintJson } = await req.json();

    if (!blueprintId || !blueprintJson) {
      return NextResponse.json({ error: 'Missing blueprint data' }, { status: 400 });
    }

    await knowledgeIngestService.harvestBlueprint(blueprintId, blueprintJson);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Harvest API Error]:', error);
    return NextResponse.json({ error: 'Harvesting failed' }, { status: 500 });
  }
}
