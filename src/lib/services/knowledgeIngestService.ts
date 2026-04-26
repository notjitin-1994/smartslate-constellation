import { createAdminClient } from '@/lib/supabase';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { IngestBlueprintUseCase } from '@/application/knowledge/use-cases/IngestBlueprint';
import { IngestUserDataUseCase } from '@/application/knowledge/use-cases/IngestUserData';
import { SupabaseKnowledgeStore } from '@/infrastructure/knowledge/adapters/SupabaseKnowledgeStore';
import { GeminiKnowledgeDistiller } from '@/infrastructure/knowledge/adapters/GeminiKnowledgeDistiller';

export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string | null;
  userId?: string | null; 
  contentType: ContentType;
  content: string; // Base64 for media/docs or raw text
  fileName: string;
  metadata?: Record<string, unknown>;
  blueprintContext?: Record<string, unknown> | null;
  useAdmin?: boolean; 
}

export class KnowledgeIngestService {
  private store = new SupabaseKnowledgeStore();
  private distiller = new GeminiKnowledgeDistiller();
  private ingestBlueprintUseCase = new IngestBlueprintUseCase(this.store, this.distiller);
  private ingestUserDataUseCase = new IngestUserDataUseCase(this.store, this.distiller);

  async ingest(asset: IngestAsset) {
    console.log(`[Ingest] [LEGACY_ADAPTER] Incoming asset: ${asset.fileName} (${asset.contentType})`);
    
    // 1. Extract content from asset
    let fullText = '';
    if (asset.contentType === 'pdf') {
      const buffer = Buffer.from(asset.content, 'base64');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      fullText = result.text;
    } else if (asset.contentType === 'docx') {
      const buffer = Buffer.from(asset.content, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      fullText = result.value;
    } else {
      fullText = asset.content;
    }

    // 2. Use the new Clean Architecture Use Case
    if (!asset.blueprintId) throw new Error('Blueprint ID is required for ingestion.');
    
    const ledger = await this.ingestUserDataUseCase.execute(asset.blueprintId, fullText, asset.fileName);
    
    return { 
      count: ledger.facts.length, 
      contextHeader: 'Distilled Subject Matter Ledger',
      ledger 
    };
  }

  /**
   * Automatically harvests strategic facts from the Polaris Blueprint
   */
  async harvestBlueprint(blueprintId: string, blueprintJson: Record<string, unknown>) {
    console.log(`[Ingest] [LEGACY_ADAPTER] [HARVEST] Ingesting Strategic Apex for: ${blueprintId}`);
    try {
      const ledger = await this.ingestBlueprintUseCase.execute(blueprintId, blueprintJson);
      console.log('[Ingest] [HARVEST] Strategic Blueprint successfully added to Knowledge Ledger.');
      return ledger;
    } catch (err) {
      console.error('[Ingest] [HARVEST_ERROR]:', err);
      throw err;
    }
  }
}

export const knowledgeIngestService = new KnowledgeIngestService();
