/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NodeScript,
  AuditResult,
  FactLedger,
  type NodeScriptType,
  type AuditResultType,
  type FactLedgerType,
  type DraftResult,
} from '@/types/architect';
import type { LlmPort } from '@/ports/LlmPort';
import type { VaultPort } from '@/ports/VaultPort';
import type { KnowledgeChunk } from '@/types/knowledge';
import { createLogger, type Logger } from '@/lib/logger';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '@/lib/google';
import { resolveInstructionalStrategy } from '@/domain/pedagogy/merrillStrategy';
import { geminiLlmAdapter } from '@/adapters/gemini/GeminiLlmAdapter';
import { supabaseVaultAdapter } from '@/adapters/supabase/SupabaseVaultAdapter';

export interface ArchitecturalNode {
  id: string;
  title: string;
  description: string;
  pedagogicalMode: string;
  targetModality?: string;
  blueprintId: string;
  blueprintContext?: Record<string, unknown> | null;
}

export class InstructionalArchitectService {
  constructor(
    private readonly llm: LlmPort,
    private readonly vault: VaultPort
  ) {}

  async draftNodeScript(
    node: ArchitecturalNode,
    correlationId?: string
  ): Promise<DraftResult> {
    const log: Logger = createLogger(correlationId);
    log.info('pipeline.start', { nodeId: node.id, nodeTitle: node.title });

    // PASS 0: PRE-FLIGHT
    await this.vault.health();

    // PASS 1: TIERED RETRIEVAL
    let sourceChunks = await this.retrieveGroundingContext(node, true, log);
    let isDataSparse = false;

    if (sourceChunks.length === 0) {
      log.info('retrieval.strict.empty — falling back to broad pass');
      sourceChunks = await this.retrieveGroundingContext(node, false, log);
      if (sourceChunks.length === 0) isDataSparse = true;
    }

    log.info('retrieval.done', { chunkCount: sourceChunks.length, isDataSparse });

    // Build strategic context
    const bp = node.blueprintContext as any;
    let strategicContext = 'Institutional context unavailable.';
    if (bp) {
      try {
        const roles = bp.target_audience?.demographics?.roles || [];
        const levels = bp.target_audience?.demographics?.experience_levels || [];
        const goal = bp.executive_summary?.content || 'Standard Instructional Goal';
        const delivery = bp.delivery_config?.method || bp.delivery_method || 'Standard Online';
        strategicContext = [
          `Audience Roles: ${Array.isArray(roles) ? roles.join(', ') : 'General'}`,
          `Expertise Levels: ${Array.isArray(levels) ? levels.join(', ') : 'Foundational'}`,
          `Strategic Goal: ${goal}`,
          `Delivery Infrastructure: ${delivery}`,
        ].join(' | ');
      } catch (err) {
        log.warn('context.extraction.partial', { err: String(err) });
      }
    }

    const rawContextText =
      `[STRATEGIC_BLUEPRINT_CONTEXT]: ${strategicContext}\n\n` +
      sourceChunks.map((c, i) => `[SOURCE ${i + 1}]: ${c.raw_content}`).join('\n\n');

    // PASS 2: STRUCTURED FACT DISTILLATION
    log.info('distillation.start');
    const factLedger = await this.extractAtomicFacts(rawContextText, node.title, log);
    const factText = factLedger.isEmpty
      ? 'EMPTY — no relevant source material found.'
      : factLedger.facts.map((f) => `[Fact_ID: ${f.id}] ${f.fact}`).join('\n');
    log.info('distillation.done', { factCount: factLedger.facts.length, isEmpty: factLedger.isEmpty });

    // PASS 3: SCHEMA-FIRST SYNTHESIS
    log.info('synthesis.start');
    const strategy = resolveInstructionalStrategy(node.pedagogicalMode || 'Direct Instruction');
    const nodeScript = await this.llm.generateObject({
      model: 'gemini-3.1-pro-preview',
      schema: NodeScript,
      system: `You are an elite Instructional Designer and Storyboard Artist with deep expertise in cognitive load theory, Merrill's First Principles of Instruction, and high-engagement branching scenarios.

MERRILL PHASE GUIDE:
- ACTIVATION: Open with a knowledge-activation hook — a question, familiar analogy, or prior experience bridge. Do NOT start with objectives.
- DEMONSTRATION: Lead with a worked example, annotated walkthrough, or expert think-aloud. Narration explains WHY, not just WHAT.
- APPLICATION: Present a realistic problem with at least one branching decision and explicit corrective feedback in speakerNotes.
- INTEGRATION: Bridge to the learner's real work context. Activity must require real-world application, not a quiz.
- TASK_CENTERED: Anchor every scene to a single authentic professional task. Every decision mirrors a real job choice.

STRICT DOMAIN AMNESIA: You know ZERO domain facts other than what is in the <fact_ledger>. Use your ID expertise to structure and pace — never introduce statistics, rules, or data from training data. Every narration claim MUST be traceable to a Fact_ID in the scene's citations array.

DATA SCARCITY PROTOCOL: If the fact ledger is EMPTY or critically insufficient, build a structural skeleton. Use each scene's dataDeficits array to list what source material is needed. Do NOT hallucinate facts.

VISUAL DIRECTION: artDirection = elite director's shot (composition, focal point, instructional purpose). generationPrompt = self-contained 4K cinematic prompt — inject specific fact text/terminology visible on-screen. NEVER use: "Deep Space", "Zen", "Obsidian", "Neural Network", "Glow", "Constellation", "Teal accents".

AIM FOR 3–6 scenes per node. scaffolding: LOW=remember/understand, MEDIUM=apply/analyze, HIGH=evaluate/create.`,
      prompt: `<strategic_context>
Node: ${node.title}
Audience: ${strategicContext}
Merrill Phase: ${strategy.merrillMode} — ${strategy.merrillPhase}
Target Cognitive Verb: ${strategy.cognitiveVerb} (Bloom: ${strategy.bloomLevel})
Phase Guidance: ${strategy.promptGuidance}
Target Modality: ${node.targetModality || 'TEXT'}
</strategic_context>

<fact_ledger>
${factText}
</fact_ledger>

Architect the instructional sequence for this node following the Merrill phase above. Set the nodeScript.cognitiveVerb to "${strategy.cognitiveVerb}". If facts are present, build a grounded high-fidelity script. If the ledger is sparse, build a structural skeleton using the DATA SCARCITY PROTOCOL.`,
    });
    log.info('synthesis.done', { sceneCount: nodeScript.scenes.length });

    // PASS 4: ADVERSARIAL AUDIT
    log.info('audit.start');
    const audit = await this.performAdversarialAudit(nodeScript, factLedger, log);
    log.info('audit.done', {
      groundingScore: audit.groundingScore,
      cognitiveLoad: audit.cognitiveLoad,
      hallucinated: audit.hallucinated,
    });

    const allDeficits = nodeScript.scenes.flatMap((s) => s.dataDeficits);
    const isHallucinated = audit.hallucinated || (isDataSparse && allDeficits.length === 0);

    log.info('pipeline.complete', { hallucinationFlag: isHallucinated });

    return {
      nodeScript,
      citations: sourceChunks.map((c) => (c.metadata as any)?.source_name || 'Source'),
      groundingScore: audit.groundingScore,
      cognitiveLoadScore: audit.cognitiveLoad,
      hallucinationFlag: isHallucinated,
      semanticDelta: audit.critique,
      groundingTypes: Array.from(new Set(sourceChunks.map((c) => c.content_type))),
    };
  }

  private async extractAtomicFacts(
    rawContext: string,
    nodeTitle: string,
    log: Logger
  ): Promise<FactLedgerType> {
    if (!rawContext.trim()) return { isEmpty: true, facts: [] };

    try {
      return await this.llm.generateObject({
        model: 'gemini-3-flash-preview',
        schema: FactLedger,
        system: `You are a Strict Knowledge Harvester. Extract every unique fact, metric, definition, and procedural step from the provided source chunks that is relevant to "${nodeTitle}".

RULES:
1. Capture granular details, advice, and organizational specifics.
2. Do NOT use knowledge outside the provided chunks.
3. If no relevant facts exist, set isEmpty to true and return an empty facts array.`,
        prompt: `[RAW_CHUNKS]:\n${rawContext}`,
      });
    } catch (err) {
      log.error('distillation.failed', { err: String(err) });
      return { isEmpty: true, facts: [] };
    }
  }

  private async retrieveGroundingContext(
    node: ArchitecturalNode,
    strictModule: boolean,
    log: Logger
  ): Promise<KnowledgeChunk[]> {
    const queryText = `Strict procedural data for: ${node.title}. ${node.description}`;

    const queryEmbedding = await this.llm.embed({
      model: EMBEDDING_MODEL,
      value: queryText,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });

    const chunks = await this.vault.matchKnowledge({
      queryEmbedding,
      matchThreshold: strictModule ? 0.75 : 0.3,
      matchCount: 15,
      blueprintId: node.blueprintId,
      moduleId: strictModule ? node.id : null,
    });

    // If strict module pass returned nothing, try a metadata-based fallback
    if (strictModule && chunks.length === 0) {
      const moduleNum =
        node.id.split('_')[1]?.replace(/^0+/, '') || node.id.replace(/[^\d]/g, '');

      log.info('retrieval.metadata-fallback', { moduleNum });

      return this.vault.fallbackKnowledge({
        blueprintId: node.blueprintId,
        moduleNum,
        limit: 15,
      });
    }

    return chunks;
  }

  private async performAdversarialAudit(
    nodeScript: NodeScriptType,
    factLedger: FactLedgerType,
    log: Logger
  ): Promise<AuditResultType> {
    const narrations = nodeScript.scenes
      .map((s, i) => `Scene ${i + 1} (${s.title}) narration: ${s.narration}`)
      .join('\n\n');

    const factText = factLedger.isEmpty
      ? 'EMPTY'
      : factLedger.facts.map((f) => `[Fact_ID: ${f.id}] ${f.fact}`).join('\n');

    const deficitScenes = nodeScript.scenes
      .filter((s) => s.dataDeficits.length > 0)
      .map((s) => s.title)
      .join(', ');

    try {
      return await this.llm.generateObject({
        model: 'gemini-3-flash-preview',
        schema: AuditResult,
        system: `You are an Adversarial Integrity Sentinel.

TASKS:
1. Verify every factual claim in the NARRATIONS is explicitly supported by a Fact_ID in the FACT_LEDGER.
2. Treat scenes whose dataDeficits field is non-empty as valid structural skeletons — do NOT flag those as hallucinated.
3. Flag only factual details (names, dates, metrics, definitions) that are NOT in the ledger and NOT in a data deficit scene.

groundingScore: 10 = all claims anchored or legitimately skeletal. 0 = pure hallucination.
cognitiveLoad: estimated learner cognitive demand (0 = trivial, 10 = overwhelming).`,
        prompt: `NARRATIONS:\n${narrations}\n\nFACT_LEDGER:\n${factText}\n\nData-deficit scenes (expect skeletons): ${deficitScenes || 'none'}`,
      });
    } catch (err) {
      log.error('audit.failed — using conservative defaults', { err: String(err) });
      // Surface the real failure rather than defaulting silently
      return { groundingScore: 0, cognitiveLoad: 5, hallucinated: true, critique: `Audit failed: ${String(err)}` };
    }
  }
}

export type { DraftResult, NodeScriptType };

// Default singleton wired to real adapters
export const instructionalArchitectService = new InstructionalArchitectService(
  geminiLlmAdapter,
  supabaseVaultAdapter
);
