/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { generateText, embed } from 'ai';
import { google } from '@/lib/google';

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
   * Generates a strictly grounded instructional script.
   * Implementation: Zero-Leakage "Atomic Fact" Architecture (arXiv:2512.14731)
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] [INTEGRITY_INIT] Drafting strictly grounded script: ${node.title}`);

    try {
      // --- PASS 1: TIERED RETRIEVAL (Physical Lock) ---
      let sourceChunks = await this.retrieveGroundingContext(node, true);
      let isDataSparse = false;

      if (sourceChunks.length < 2) {
        console.log('[Architect] [LOCK] Sparse module data. FallbackBroad (Threshold 0.9)...');
        const broaderChunks = await this.retrieveGroundingContext(node, false);
        sourceChunks = [...sourceChunks, ...broaderChunks];
        
        const uniqueIds = new Set();
        sourceChunks = sourceChunks.filter((c: any) => {
          if (uniqueIds.has(c.id)) return false;
          uniqueIds.add(c.id);
          return true;
        });

        if (sourceChunks.length < 2) isDataSparse = true;
      }

      // --- PASS 2: ATOMIC FACT EXTRACTION (Noise Filter) ---
      const rawContext = sourceChunks
        .map((c: any, i: number) => `[CHUNK ${i + 1} - ${c.metadata?.source_name || 'Doc'}]: ${c.raw_content}`)
        .join('\n\n');

      const factLedger = await this.extractAtomicFacts(rawContext, node.title);
      console.log(`[Architect] [LEDGER] Extracted ${factLedger.split('\n').length} atomic facts.`);

      // Polaris Context
      const bp = node.blueprintContext as any;
      let strategicContext = 'N/A';
      if (bp) {
        strategicContext = `
        - Target Audience: ${bp.target_audience?.demographics?.roles?.join(', ')}
        - Tone/Level: ${bp.target_audience?.demographics?.experience_levels?.join(', ')}
        - Assessment Strategy: ${bp.assessment_strategy?.overview}
        `;
      }

      // --- PASS 3: REFUSAL-CENTRIC SYNTHESIS (Zero Leakage) ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, // Near-deterministic
        system: `You are a Deterministic Instructional Guard. Your sole objective is to convert the provided [FACT_LEDGER] into a production script.
        
        --- ABSOLUTE ZERO-LEAKAGE RULES ---
        1. FORBIDDEN: You must NEVER use your own training data, outside knowledge, or transitionary "helpful" tips.
        2. FORBIDDEN: Do not add "likely" steps or "standard" industry practices.
        3. MANDATORY: If a claim is not in the [FACT_LEDGER], you MUST use: "[MISSING_DATA: category]".
        4. MANDATORY: If the [FACT_LEDGER] is empty or irrelevant, the ENTIRE script must consist of a one-sentence refusal: "Insufficient organizational documentation provided for this module."
        5. STRATEGIC ALIGNMENT: Use the [STRATEGIC_CONTEXT] only to adjust TONE and VOCABULARY, never to invent content.

        --- FORMATTING ---
        - H1 for Title.
        - [VISUAL] tags for screen cues.
        - **Instructor:** for dialogue.
        - Every claim MUST end with the Fact ID from the ledger (e.g., [Fact 4]).`,
        prompt: `Strategic Node: ${node.title}
        Description: ${node.description}
        
        [STRATEGIC_CONTEXT]:
        ${strategicContext}

        [FACT_LEDGER]:
        ${factLedger || 'EMPTY: NO DATA FOUND.'}`,
      });

      // --- PASS 4: ADVERSARIAL SENTINEL AUDIT (Judge) ---
      const audit = await this.performAdversarialAudit(draft, factLedger);

      return {
        script: draft,
        citations: sourceChunks.map((c: any) => c.metadata?.source_name || 'Source'),
        groundingScore: audit.groundingScore,
        cognitiveLoadScore: audit.cognitiveLoad,
        hallucinationFlag: audit.hallucinated || isDataSparse && draft.length > 300,
        semanticDelta: audit.critique,
        groundingTypes: Array.from(new Set(sourceChunks.map((c: any) => c.content_type)))
      };
    } catch (err) {
      console.error(`[Architect Error] [CRITICAL] Drafting failed:`, err);
      throw err;
    }
  }

  private async extractAtomicFacts(rawContext: string, nodeTitle: string) {
    if (!rawContext.trim()) return '';
    
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Atomic Fact Distiller. 
      Analyze the raw document chunks and extract every unique, verifiable fact or procedure related to "${nodeTitle}".
      Output only a numbered list of atomic facts. Strip away all fluff, marketing speak, and generic introductions.
      Example:
      Fact 1: The user must click the 'Save' button to proceed.
      Fact 2: System latency is expected to be under 200ms.`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    console.log(`[Architect] Generating query embedding for: ${node.title} (Strict: ${strictModule})`);
    const queryText = `Strict procedural data for: ${node.title}. ${node.description}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
      providerOptions: { google: { outputDimensionality: 3072 } }
    });

    // Tier 1: Try exact module ID match
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: strictModule ? 0.3 : 0.85, 
      match_count: 5,
      p_blueprint_id: node.blueprintId,
      p_module_id: strictModule ? node.id : null
    });

    // Tier 2: If strict failed, try source-name proximity (e.g., M1 matches NODE_01)
    if (strictModule && (!data || data.length < 2)) {
      console.log(`[Architect] [RETRY] No exact module match. Trying source-name proximity for ${node.id}...`);
      const moduleNum = node.id.split('_')[1]?.replace(/^0+/, ''); // '01' -> '1'
      
      const { data: sourceData, error: sourceError } = await supabase
        .from('knowledge_vault')
        .select('id, content_type, raw_content, media_url, metadata')
        .eq('blueprint_id', node.blueprintId)
        .or(`metadata->>source_name.ilike.%M${moduleNum}%,metadata->>source_name.ilike.%Module ${moduleNum}%`)
        .limit(5);
        
      if (!sourceError && sourceData && sourceData.length > 0) {
        return sourceData;
      }
    }

    if (error) {
      console.error('[Architect DB Error]:', error);
      throw error;
    }
    return data || [];
  }

  private async performAdversarialAudit(draft: string, factLedger: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Adversarial Integrity Sentinel. 
      Compare the DRAFT script against the [FACT_LEDGER].
      Identify "Foreign Intelligence"—any claim, fact, or instructional detail in the DRAFT that is not explicitly found in the [FACT_LEDGER].
      A single un-supported claim results in HALLUCINATED: YES.
      
      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [List every single "Foreign Intelligence" claim detected.]`,
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
