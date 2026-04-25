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
}

export class InstructionalArchitectService {
  /**
   * Generates a grounded conversational instructional script.
   * Implementation: Structured Fact-Verification (0% Hallucination Target).
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] [VERIFY_INIT] Mapping Constellation for: ${node.title}`);

    // --- PASS 0: PRE-FLIGHT DIAGNOSTIC ---
    try {
      const supabase = createAdminClient();
      const { error: healthCheck } = await supabase.from('knowledge_vault').select('id').limit(1);
      if (healthCheck) {
        console.error('[Architect Health] Supabase Access Denied:', healthCheck);
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
        console.log('[Architect] Strict match empty. Fetching module-specific and global blueprint facts...');
        sourceChunks = await this.retrieveGroundingContext(node, false);
        if (sourceChunks.length === 0) isDataSparse = true;
      }

      // --- PASS 2: STRUCTURED FACT DISTILLATION ---
      // Polaris Context - HARDENED DEFENSIVE EXTRACTION
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

      // Merge strategic context into the distillation payload
      const contextText = `[STRATEGIC_BLUEPRINT_CONTEXT]:\n${strategicContext}\n\n` + 
        sourceChunks
          .map((c: any, i: number) => `[SOURCE ${i + 1}]: ${c.raw_content}`)
          .join('\n\n');

      const factLedger = await this.extractAtomicFacts(contextText, node.title);

      // --- PASS 3: CONSTRAINED SYNTHESIS (SCE 2026 OVERHAUL) ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, 
        system: `
<instructional_persona>
  You are a World-Class Instructional Architect. Your mission is to transform raw knowledge into a production-ready Storyboard Constellation. You prioritize technical accuracy, strategic flow, and high-fidelity art direction.
</instructional_persona>

<production_standards>
  You MUST output instructional artifacts using exactly these tags. Every [VISUAL] MUST be accompanied by a [VISUAL_PROMPT].
  
  1. [VISUAL]: A professional director's description of the on-screen elements.
  2. [VISUAL_PROMPT]: MANDATORY. A self-contained, descriptive image generation prompt for Nano Banana Pro. 
     - Focus: 4k, cinematic lighting, deep space zen aesthetic, realistic textures, technical accuracy.
     - Note: This tag must appear immediately after its corresponding [VISUAL] block.
  3. [NARRATION]: Verbatim spoken dialogue. Use a sophisticated, encouraging tone.
  4. [ACTIVITY]: A specific, actionable learner interaction.
  5. [BRANCHING]: A logical decision point (If User picks X, then Y).
  6. [SPEAKER_NOTES]: High-level technical advice for the production team.
</production_standards>

<grounding_protocol>
  1. CLAIM-ONLY: Every instructional fact or step MUST end with its specific Fact ID from the <fact_ledger> (e.g., [Fact 4]).
  2. ZERO-HALLUCINATION: If a metric or rule is not explicitly in the <fact_ledger>, do not include it.
  3. REFUSAL: If the ledger is empty, respond with: "!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!"
</grounding_protocol>

<formatting_rules>
  - Use clean markdown.
  - Do NOT wrap tags in bold (e.g., use [VISUAL], NOT **[VISUAL]**).
  - Ensure clear separation between artifacts using newlines.
</formatting_rules>`,
        prompt: `
<strategic_context>
  - Audience: ${strategicContext}
  - Strategic Node: ${node.title}
  - Target Modality: ${node.targetModality}
</strategic_context>

<fact_ledger>
  ${factLedger || 'EMPTY.'}
</fact_ledger>

TASK: Synthesize the core instructional sequence for this node using only the provided facts.`,
      });

      // --- PASS 4: ADVERSARIAL SENTINEL ---
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
    if (!rawContext.trim()) return '';
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `Distill the provided chunks into a numbered list of UNIQUE Atomic Facts related to "${nodeTitle}". Capture granular details, advice, and metrics.`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    // USE ADMIN CLIENT FOR SERVER-SIDE RAG: Bypasses RLS to allow the Architect to "read" the vault.
    // Security: This key never leaves the server.
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

      if (error) {
        console.error('[Architect DB Error] RPC Failed:', error);
        throw error;
      }

      // If strict match fails, perform a fallback query to ensure we catch global blueprint data
      if (strictModule && (!data || data.length === 0)) {
        const moduleNum = node.id.split('_')[1]?.replace(/^0+/, '') || node.id.replace(/[^\d]/g, '');
        const { data: sourceData, error: fetchError } = await supabase
          .from('knowledge_vault')
          .select('id, content_type, raw_content, media_url, metadata')
          .eq('blueprint_id', node.blueprintId)
          .or(`metadata->>source_name.ilike.%M${moduleNum}%,metadata->>source_name.ilike.%Module ${moduleNum}%,metadata->>source_name.eq.POLARIS_BLUEPRINT`)
          .limit(15);
        
        if (fetchError) {
          console.error('[Architect DB Error] Manual fallback failed:', fetchError);
          throw fetchError;
        }
        return sourceData || [];
      }

      return data || [];
    } catch (err) {
      console.error('[Architect DB Error] Critical Retrieval Crash:', err);
      throw err;
    }
  }

  private async performAdversarialAudit(draft: string, factLedger: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Adversarial Integrity Sentinel. 
      Verify that every factual claim in the DRAFT is explicitly supported by a Fact in the [FACT_LEDGER].
      Ignore conversational framing (greetings, transitions). 
      Only flag actual KNOWLEDGE hallucinations.
      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [List unsupported factual claims only.]`,
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
