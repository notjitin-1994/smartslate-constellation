import { describe, it, expect } from 'vitest';
import { knowledgeIngestService } from '@/lib/services/knowledgeIngestService';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

describe('Ingestion Pipeline Integration', () => {
  const blueprintId = '9ed8d030-f189-4cfb-9713-cafd113da263'; // Use the provided valid ID

  it('should successfully ingest a real text file and store it in Supabase', async () => {
    const filePath = path.join(process.cwd(), 'tests/fixtures/dummy_sop.txt');
    const content = fs.readFileSync(filePath, 'utf-8');

    const result = await knowledgeIngestService.ingest({
      blueprintId,
      contentType: 'text',
      content: content,
      fileName: 'dummy_sop.txt'
    });

    expect(result).toBeDefined();
    expect(result.count).toBeGreaterThan(0);

    // Verify it exists in the real Supabase (or mock if env not set, but here we expect real env)
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('metadata->>source_name', 'dummy_sop.txt');

    expect(error).toBeNull();
    expect(data && data.length).toBeGreaterThan(0);
    console.log(`✅ Integration Success: Ingested ${data?.length} chunks from dummy_sop.txt`);
  });

  it('should correctly generate embeddings for the ingested content', async () => {
    const { data } = await supabase
      .from('knowledge_vault')
      .select('embedding')
      .eq('blueprint_id', blueprintId)
      .eq('metadata->>source_name', 'dummy_sop.txt')
      .limit(1)
      .single();

    expect(data?.embedding).toBeDefined();
    expect(Array.isArray(data?.embedding)).toBe(true);
    // 768 is the dimension for gemini-embedding-001 with outputDimensionality 768
    expect((data?.embedding as number[]).length).toBe(768);
  });
});
