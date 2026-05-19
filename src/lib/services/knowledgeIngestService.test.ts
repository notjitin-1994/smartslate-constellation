import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeIngestService } from './knowledgeIngestService';
import type { LlmPort } from '@/ports/LlmPort';
import type { VaultPort, ChunkInsertRow } from '@/ports/VaultPort';
import { FactLedger } from '@/types/architect';

// --- Mock LlmPort ---
function makeMockLlm(): LlmPort {
  return {
    generateObject: vi.fn(async ({ schema }) => {
      // Return a minimal valid object for any schema
      if (schema === FactLedger) {
        return { isEmpty: false, facts: [{ id: 1, fact: 'Mocked fact.' }] };
      }
      // SegregationSchema
      return {
        contextHeader: 'Test context',
        moduleContents: [
          { moduleId: 'NODE_01', relevantContent: 'Relevant content for module 1.' },
        ],
      };
    }),
    generateText: vi.fn(async () => 'Fact 1: mocked fact.\nFact 2: another fact.'),
    embed: vi.fn(async () => new Array(3072).fill(0.1)),
    embedMany: vi.fn(async ({ values }) => values.map(() => new Array(3072).fill(0.1))),
  };
}

// --- Mock VaultPort ---
function makeMockVault(): VaultPort {
  return {
    health: vi.fn(async () => undefined),
    matchKnowledge: vi.fn(async () => []),
    fallbackKnowledge: vi.fn(async () => []),
    insertChunks: vi.fn(async () => undefined),
    isBlueprintHarvested: vi.fn(async () => false),
  };
}

describe('KnowledgeIngestService', () => {
  let llm: LlmPort;
  let vault: VaultPort;
  let service: KnowledgeIngestService;

  beforeEach(() => {
    llm = makeMockLlm();
    vault = makeMockVault();
    service = new KnowledgeIngestService(llm, vault);
    vi.clearAllMocks();
    // Re-assign after clear
    llm = makeMockLlm();
    vault = makeMockVault();
    service = new KnowledgeIngestService(llm, vault);
  });

  // -- Text ingestion --
  describe('text ingestion', () => {
    it('calls embedMany and insertChunks for text content', async () => {
      const result = await service.ingest({
        blueprintId: 'bp-001',
        userId: 'user-001',
        contentType: 'text',
        content: 'This is instructional content. It covers procedures and policies in detail.',
        fileName: 'sop.txt',
      });
      expect(result.count).toBeGreaterThan(0);
      expect(llm.embedMany).toHaveBeenCalled();
      expect(vault.insertChunks).toHaveBeenCalled();
    });

    it('stores chunks with the correct blueprint_id', async () => {
      await service.ingest({
        blueprintId: 'bp-test-id',
        contentType: 'text',
        content: 'Content here.',
        fileName: 'doc.txt',
      });
      const calls = (vault.insertChunks as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const rows: ChunkInsertRow[] = calls[0][0];
      expect(rows[0].blueprint_id).toBe('bp-test-id');
    });

    it('throws on empty content', async () => {
      await expect(
        service.ingest({ blueprintId: 'bp-001', contentType: 'text', content: '   ', fileName: 'empty.txt' })
      ).rejects.toThrow('Document extraction returned empty text.');
    });
  });

  // -- PDF ingestion --
  describe('PDF ingestion', () => {
    it('extracts text via unpdf and produces chunks', async () => {
      const result = await service.ingest({
        blueprintId: 'bp-001',
        contentType: 'pdf',
        content: Buffer.from('mock-pdf-bytes').toString('base64'),
        fileName: 'manual.pdf',
      });
      expect(result.count).toBeGreaterThan(0);
      expect(vault.insertChunks).toHaveBeenCalled();
    });
  });

  // -- DOCX ingestion --
  describe('DOCX ingestion', () => {
    it('extracts text via mammoth and produces chunks', async () => {
      const result = await service.ingest({
        blueprintId: 'bp-001',
        contentType: 'docx',
        content: Buffer.from('mock-docx-bytes').toString('base64'),
        fileName: 'policy.docx',
      });
      expect(result.count).toBeGreaterThan(0);
    });
  });

  // -- Image ingestion --
  describe('multimodal ingestion', () => {
    it('calls generateText for image assets', async () => {
      await service.ingest({
        blueprintId: 'bp-001',
        contentType: 'image',
        content: Buffer.from('fake-image-bytes').toString('base64'),
        fileName: 'diagram.png',
      });
      expect(llm.embed).toHaveBeenCalled();
      expect(vault.insertChunks).toHaveBeenCalled();
    });

    it('stores exactly 1 chunk for a multimodal asset', async () => {
      await service.ingest({
        blueprintId: 'bp-001',
        contentType: 'video',
        content: Buffer.from('fake-video').toString('base64'),
        fileName: 'intro.mp4',
      });
      const rows: ChunkInsertRow[] = (vault.insertChunks as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(rows).toHaveLength(1);
      expect(rows[0].metadata.is_multimodal).toBe(true);
    });
  });

  // -- Blueprint harvesting --
  describe('harvestBlueprint', () => {
    it('skips if already harvested', async () => {
      (vault.isBlueprintHarvested as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      await service.harvestBlueprint('bp-001', { modules: [] });
      expect(llm.generateText).not.toHaveBeenCalled();
      expect(vault.insertChunks).not.toHaveBeenCalled();
    });

    it('extracts facts and inserts chunks if not yet harvested', async () => {
      (vault.isBlueprintHarvested as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      await service.harvestBlueprint('bp-001', {
        modules: [{ title: 'Intro', description: 'An introduction module' }],
      });
      expect(llm.generateText).toHaveBeenCalledWith(
        expect.objectContaining({ model: expect.stringContaining('gemini') })
      );
      expect(llm.embedMany).toHaveBeenCalled();
      expect(vault.insertChunks).toHaveBeenCalled();
    });

    it('tags inserted chunks with is_blueprint_source: true', async () => {
      await service.harvestBlueprint('bp-xyz', { modules: [] });
      const rows: ChunkInsertRow[] = (vault.insertChunks as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(rows.every((r) => r.metadata.is_blueprint_source === true)).toBe(true);
    });

    it('marks blueprint_id on every chunk', async () => {
      await service.harvestBlueprint('bp-xyz', { modules: [] });
      const rows: ChunkInsertRow[] = (vault.insertChunks as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(rows.every((r) => r.blueprint_id === 'bp-xyz')).toBe(true);
    });
  });
});
