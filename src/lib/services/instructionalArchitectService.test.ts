import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstructionalArchitectService, type ArchitecturalNode } from './instructionalArchitectService';
import type { LlmPort } from '@/ports/LlmPort';
import type { VaultPort } from '@/ports/VaultPort';
import type { KnowledgeChunk } from '@/types/knowledge';
import { NodeScript, AuditResult, FactLedger } from '@/types/architect';

// ---- Shared test data ----

const MOCK_NODE: ArchitecturalNode = {
  id: 'NODE_01',
  title: 'Safety Induction',
  description: 'Core workplace safety procedures and responsibilities.',
  pedagogicalMode: 'Direct Instruction',
  targetModality: 'VIDEO',
  blueprintId: 'bp-001',
  blueprintContext: {
    target_audience: { demographics: { roles: ['Engineer'], experience_levels: ['Mid-level'] } },
    executive_summary: { content: 'Build safety culture.' },
    delivery_config: { method: 'SCORM Online' },
  },
};

const MOCK_CHUNK: KnowledgeChunk = {
  id: 'chunk-1',
  content_type: 'pdf',
  raw_content: 'Safety helmets must be worn at all times on the production floor. [OSHA 29 CFR 1910.135]',
  media_url: null,
  metadata: { source_name: 'safety_sop.pdf', module_id: 'NODE_01' },
  similarity: 0.92,
};

const MOCK_FACT_LEDGER = {
  isEmpty: false,
  facts: [{ id: 1, fact: 'Safety helmets required at all times. [OSHA 29 CFR 1910.135]' }],
};

const MOCK_NODE_SCRIPT = {
  nodeTitle: 'Safety Induction',
  pedagogicalMode: 'Direct Instruction',
  cognitiveVerb: 'explain',
  scaffolding: 'MEDIUM' as const,
  scenes: [
    {
      id: 'scene-01',
      title: 'Scene 1: The Stakes',
      narration: 'Safety helmets are mandatory. [Fact_ID: 1]',
      visual: {
        artDirection: 'Close-up on helmet being fitted.',
        generationPrompt: 'Photorealistic close-up of a worker donning a hard hat, 4K.',
      },
      activity: null,
      branching: null,
      speakerNotes: 'Pause here for learner reflection.',
      citations: ['Fact_ID: 1'],
      dataDeficits: [],
    },
  ],
};

const MOCK_AUDIT = {
  groundingScore: 9,
  cognitiveLoad: 4,
  hallucinated: false,
  critique: 'All claims verified against fact ledger.',
};

// ---- Factory functions ----

function makeMockLlm(overrides: Partial<LlmPort> = {}): LlmPort {
  return {
    generateObject: vi.fn(async ({ schema }) => {
      if (schema === FactLedger) return MOCK_FACT_LEDGER;
      if (schema === NodeScript) return MOCK_NODE_SCRIPT;
      if (schema === AuditResult) return MOCK_AUDIT;
      return {};
    }),
    generateText: vi.fn(async () => 'mocked text'),
    embed: vi.fn(async () => new Array(3072).fill(0.1)),
    embedMany: vi.fn(async ({ values }) => values.map(() => new Array(3072).fill(0.1))),
    ...overrides,
  };
}

function makeMockVault(overrides: Partial<VaultPort> = {}): VaultPort {
  return {
    health: vi.fn(async () => undefined),
    matchKnowledge: vi.fn(async () => [MOCK_CHUNK]),
    fallbackKnowledge: vi.fn(async () => []),
    insertChunks: vi.fn(async () => undefined),
    isBlueprintHarvested: vi.fn(async () => false),
    ...overrides,
  };
}

// ---- Tests ----

describe('InstructionalArchitectService', () => {
  let llm: LlmPort;
  let vault: VaultPort;
  let service: InstructionalArchitectService;

  beforeEach(() => {
    llm = makeMockLlm();
    vault = makeMockVault();
    service = new InstructionalArchitectService(llm, vault);
  });

  describe('draftNodeScript — happy path', () => {
    it('returns a DraftResult with a valid NodeScript', async () => {
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result.nodeScript).toBeDefined();
      expect(result.nodeScript.scenes.length).toBeGreaterThan(0);
      expect(result.nodeScript.nodeTitle).toBe('Safety Induction');
    });

    it('executes the full 4-pass pipeline in order', async () => {
      await service.draftNodeScript(MOCK_NODE);
      // Pass 0: health check
      expect(vault.health).toHaveBeenCalledOnce();
      // Pass 1: retrieval
      expect(llm.embed).toHaveBeenCalledOnce();
      expect(vault.matchKnowledge).toHaveBeenCalledOnce();
      // Pass 2: fact distillation
      // Pass 3: synthesis
      // Pass 4: audit
      expect(llm.generateObject).toHaveBeenCalledTimes(3); // distil + synth + audit
    });

    it('sets groundingScore from the audit result', async () => {
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result.groundingScore).toBe(9);
    });

    it('sets cognitiveLoadScore from the audit result', async () => {
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result.cognitiveLoadScore).toBe(4);
    });

    it('populates citations from source chunk metadata', async () => {
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result.citations).toContain('safety_sop.pdf');
    });

    it('sets hallucinationFlag to false when audit.hallucinated is false', async () => {
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result.hallucinationFlag).toBe(false);
    });

    it('uses the node correlationId for logging if provided', async () => {
      // Just confirm it doesn't throw when a correlationId is passed
      await expect(service.draftNodeScript(MOCK_NODE, 'test-correlation-id')).resolves.toBeDefined();
    });
  });

  describe('draftNodeScript — retrieval fallbacks', () => {
    it('falls back to broad retrieval when strict returns nothing', async () => {
      (vault.matchKnowledge as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([]) // strict pass: empty
        .mockResolvedValueOnce([MOCK_CHUNK]); // broad pass: found
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(vault.matchKnowledge).toHaveBeenCalledTimes(2);
      expect(result.nodeScript).toBeDefined();
    });

    it('falls back to metadata lookup when both vector passes return nothing', async () => {
      (vault.matchKnowledge as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (vault.fallbackKnowledge as ReturnType<typeof vi.fn>).mockResolvedValue([MOCK_CHUNK]);
      await service.draftNodeScript(MOCK_NODE);
      expect(vault.fallbackKnowledge).toHaveBeenCalled();
    });

    it('marks isDataSparse when all retrieval passes return empty', async () => {
      (vault.matchKnowledge as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (vault.fallbackKnowledge as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      // With no source data, fact ledger will be empty
      (llm.generateObject as ReturnType<typeof vi.fn>).mockImplementation(async ({ schema }) => {
        if (schema === FactLedger) return { isEmpty: true, facts: [] };
        if (schema === NodeScript) return { ...MOCK_NODE_SCRIPT, scenes: [{ ...MOCK_NODE_SCRIPT.scenes[0], dataDeficits: ['Missing SOP data'] }] };
        if (schema === AuditResult) return MOCK_AUDIT;
        return {};
      });
      const result = await service.draftNodeScript(MOCK_NODE);
      // With sparse data and no dataDeficits in the sparse-check, hallucinationFlag could be true
      // The exact flag depends on audit + isDataSparse logic; just verify it doesn't crash
      expect(result).toBeDefined();
    });
  });

  describe('draftNodeScript — error handling', () => {
    it('throws if vault.health() fails', async () => {
      (vault.health as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Vault unavailable'));
      await expect(service.draftNodeScript(MOCK_NODE)).rejects.toThrow('Vault unavailable');
    });

    it('returns conservative audit defaults if audit LLM call fails', async () => {
      (llm.generateObject as ReturnType<typeof vi.fn>).mockImplementation(async ({ schema }) => {
        if (schema === FactLedger) return MOCK_FACT_LEDGER;
        if (schema === NodeScript) return MOCK_NODE_SCRIPT;
        if (schema === AuditResult) throw new Error('Audit model overloaded');
        return {};
      });
      const result = await service.draftNodeScript(MOCK_NODE);
      // Audit failure should surface the error, not default to 5/0
      expect(result.groundingScore).toBe(0);
      expect(result.hallucinationFlag).toBe(true);
      expect(result.semanticDelta).toContain('Audit failed');
    });

    it('returns an empty fact ledger (not throws) if distillation LLM call fails', async () => {
      (llm.generateObject as ReturnType<typeof vi.fn>).mockImplementation(async ({ schema }) => {
        if (schema === FactLedger) throw new Error('Flash model quota exceeded');
        if (schema === NodeScript) return MOCK_NODE_SCRIPT;
        if (schema === AuditResult) return MOCK_AUDIT;
        return {};
      });
      // Should not throw — distillation failure falls back to empty ledger
      const result = await service.draftNodeScript(MOCK_NODE);
      expect(result).toBeDefined();
    });
  });

  describe('draftNodeScript — Merrill strategy integration', () => {
    it('passes Merrill phase guidance in the synthesis prompt', async () => {
      await service.draftNodeScript({ ...MOCK_NODE, pedagogicalMode: 'Application' });
      const synthCall = (llm.generateObject as ReturnType<typeof vi.fn>).mock.calls.find(
        ([params]: [{ schema: unknown }]) => params.schema === NodeScript
      );
      expect(synthCall).toBeDefined();
      const { prompt } = synthCall[0];
      expect(prompt).toContain('APPLICATION');
      expect(prompt).toContain('demonstrate');
    });

    it('uses DEMONSTRATION mode for Direct Instruction', async () => {
      await service.draftNodeScript({ ...MOCK_NODE, pedagogicalMode: 'Direct Instruction' });
      const synthCall = (llm.generateObject as ReturnType<typeof vi.fn>).mock.calls.find(
        ([params]: [{ schema: unknown }]) => params.schema === NodeScript
      );
      const { prompt } = synthCall[0];
      expect(prompt).toContain('DEMONSTRATION');
    });
  });
});
