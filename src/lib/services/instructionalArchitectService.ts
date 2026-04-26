/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase';
import { generateText, embed } from 'ai';
import { google } from '@/lib/google';

export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string;
  contentType: ContentType;
  content: string; // Base64 for media/docs or raw text
  fileName: string;
  metadata?: Record<string, unknown>;
  blueprintContext?: Record<string, unknown> | null;
  useAdmin?: boolean; 
}

export interface ArchitecturalNode {
  id: string;
  title: string;
  description: string;
  pedagogicalMode: string;
  targetModality?: string; 
  blueprintId: string;
  blueprintContext?: Record<string, unknown> | null;
}

export interface ScriptOutput {
  script: string;
  citations: string[];
  groundingScore: number;
  cognitiveLoadScore: number; 
  hallucinationFlag: boolean;
  semanticDelta?: string;
  groundingTypes: string[];
  deliverables?: string[];
  auditLog?: string[];
  schematic?: any;
}

export class InstructionalArchitectService {
  /**
   * Generates a grounded conversational instructional script.
   * Implementation: Structured Fact-Verification (0% Hallucination Target).
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] [VERIFY_INIT] Mapping Constellation with Gemini 3.1 Pro for: ${node.title}`);

    try {
      const supabase = createAdminClient();
      const { error: healthCheck } = await supabase.from('knowledge_vault').select('id').limit(1);
      if (healthCheck) {
        throw new Error(`Database Access Denied: ${healthCheck.message}`);
      }
    } catch (err: any) {
      throw new Error(`Infrastructure Denied: ${err.message}`);
    }

    try {
      // --- PASS 1: TIERED RETRIEVAL ---
      let sourceChunks = await this.retrieveGroundingContext(node, true);
      let isDataSparse = false;

      if (sourceChunks.length === 0) {
        sourceChunks = await this.retrieveGroundingContext(node, false);
        if (sourceChunks.length === 0) isDataSparse = true;
      }

      // --- PASS 2: STRUCTURED FACT DISTILLATION ---
      const bp = node.blueprintContext as any;
      let strategicContext = 'Institutional context unavailable.';
      
      if (bp) {
        try {
          const roles = bp.target_audience?.demographics?.roles || [];
          const levels = bp.target_audience?.demographics?.experience_levels || [];
          const goal = bp.executive_summary?.content || 'Standard Instructional Goal';
          const delivery = bp.delivery_config?.method || bp.delivery_method || 'Standard Online';
          
          strategicContext = `
          - Audience Roles: ${Array.isArray(roles) ? roles.join(', ') : 'General'}
          - Expertise Levels: ${Array.isArray(levels) ? levels.join(', ') : 'Foundational'}
          - Strategic Goal: ${goal}
          - Delivery Infrastructure: ${delivery}
          `;
        } catch (ctxErr) {
          console.warn('[Architect] Context extraction partial failure:', ctxErr);
        }
      }

      const contextText = `[STRATEGIC_BLUEPRINT_CONTEXT]:\n${strategicContext}\n\n` + 
        sourceChunks
          .map((c: any, i: number) => `[SOURCE ${i + 1}]: ${c.raw_content}`)
          .join('\n\n');

      const factLedger = await this.extractAtomicFacts(contextText, node.title);

      // --- PASS 3: CONSTRAINED SYNTHESIS (UPGRADED TO 3.1 PRO) ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, 
        system: `
        You are an elite Instructional Designer. 
        MANDATE:
        - Use ONLY provided facts from the <fact_ledger>.
        - Every claim MUST end with its [Fact_ID: N] citation.
        - BRAND AGNOSTIC: Use a "Universal Cinematic Professional" style.
        - TAGS: [VISUAL], [VISUAL_PROMPT], [NARRATION], [ACTIVITY], [BRANCHING], [SPEAKER_NOTES].
        - Each tag block MUST start on a NEW line.`,
        prompt: `
<strategic_context>
  - Audience: ${strategicContext}
  - Strategic Node: ${node.title}
  - Target Modality: ${node.targetModality}
</strategic_context>

<fact_ledger>
  ${factLedger}
</fact_ledger>

TASK: Architect the instructional sequence.`,
      });

      // --- PASS 4: ADVERSARIAL SENTINEL (UPGRADED TO 3 FLASH) ---
      const audit = await this.performAdversarialAudit(draft, factLedger);

      const isHallucinated = audit.hallucinated || (isDataSparse && draft.length > 200 && !draft.includes('INSUFFICIENT_DOCUMENTATION'));

      return {
        script: draft,
        citations: sourceChunks.map((c: any) => c.metadata?.source_name || 'Source'),
        groundingScore: audit.groundingScore,
        cognitiveLoadScore: audit.cognitiveLoad,
        hallucinationFlag: isHallucinated,
        semanticDelta: audit.critique,
        groundingTypes: Array.from(new Set(sourceChunks.map((c: any) => c.content_type)))
      };
    } catch (err) {
      console.error(`[Architect Error] Pipeline Crash:`, err);
      throw err;
    }
  }

  private async extractAtomicFacts(rawContext: string, nodeTitle: string) {
    if (!rawContext.trim()) return '<fact_ledger>EMPTY</fact_ledger>';
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'), // UPGRADED TO 3 FLASH
      system: `You are a Strict Knowledge Harvester. Extract facts related to "${nodeTitle}". Prefix with [Fact_ID: N].`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text.includes('<fact_ledger>EMPTY</fact_ledger>') ? '<fact_ledger>EMPTY</fact_ledger>' : text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    const supabase = createAdminClient();
    
    const queryText = `Strict procedural data for: ${node.title}. ${node.description}`;
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
    });

    try {
      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: strictModule ? 0.3 : 0.75, 
        match_count: 15,
        p_blueprint_id: node.blueprintId,
        p_module_id: strictModule ? node.id : null
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[Architect DB Error] Retrieval Crash:', err);
      throw err;
    }
  }

  private async performAdversarialAudit(draft: string, factLedger: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'), // UPGRADED TO 3 FLASH
      system: `You are an Adversarial Integrity Sentinel. 
      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [List unsupported factual claims only]`,
      prompt: `DRAFT:\n${draft}\n\n[FACT_LEDGER]:\n${factLedger}`,
    });

    const groundingScore = parseInt(text.match(/SCORE:\s*(\d+)/i)?.[1] || '0');
    const cognitiveLoad = parseInt(text.match(/COGNITIVE_LOAD:\s*(\d+)/i)?.[1] || '5');
    const hallucinated = /HALLUCINATED:\s*YES/i.test(text);
    const critique = text.split(/CRITIQUE:/i)[1]?.trim();

    return { groundingScore, cognitiveLoad, hallucinated, critique };
  }
}

export const instructionalArchitectService = new InstructionalArchitectService();
