import { describe, it, expect, vi, beforeEach } from 'vitest';
import { knowledgeIngestService } from './knowledgeIngestService';
import { generateText, embed, embedMany } from 'ai';
import { supabase } from '@/lib/supabase';
import * as unpdf from 'unpdf';

describe('KnowledgeIngestService', () => {
  const mockAsset = {
    blueprintId: 'test-blueprint-id',
    fileName: 'test-doc.txt',
    content: 'This is a test document content about instructional design principles.',
    contentType: 'text' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process text-based content correctly', async () => {
    const result = await knowledgeIngestService.ingest(mockAsset);

    expect(result).toBeDefined();
    expect(generateText).toHaveBeenCalled();
    expect(embedMany).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('knowledge_vault');
  });

  it('should handle PDF documents by extracting text', async () => {
    // Mock unpdf response for this test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.spyOn(unpdf, 'extractText') as any).mockResolvedValue({ 
      text: 'Extracted PDF content for testing purposes.',
      pages: [] 
    });

    const pdfAsset = {
      ...mockAsset,
      fileName: 'test.pdf',
      contentType: 'pdf' as const,
      content: Buffer.from('mock-pdf').toString('base64'),
    };

    const result = await knowledgeIngestService.ingest(pdfAsset);

    expect(result).toBeDefined();
    // Use type narrowing to check count
    if ('count' in result) {
      expect(result.count).toBeGreaterThan(0);
    } else {
      throw new Error('Result should have a count property for documents');
    }
  });

  it('should handle multi-modal assets (images) using vision analysis', async () => {
    const imageAsset = {
      ...mockAsset,
      fileName: 'diagram.png',
      contentType: 'image' as const,
      content: Buffer.from('mock-image').toString('base64'),
    };

    const result = await knowledgeIngestService.ingest(imageAsset);

    expect(result).toBeDefined();
    expect(generateText).toHaveBeenCalled();
    expect(embed).toHaveBeenCalled();
  });

  it('should use contextual retrieval pattern for documents', async () => {
    await knowledgeIngestService.ingest(mockAsset);
    
    const callArgs = vi.mocked(embedMany).mock.calls[0][0];
    expect(callArgs.values[0]).toContain('[CONTEXT:');
  });
});
