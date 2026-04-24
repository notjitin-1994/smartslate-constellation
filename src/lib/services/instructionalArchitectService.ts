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

      // Only broad fallback if strict match found NOTHING
      if (sourceChunks.length === 0) {
        console.log('[Architect] [LOCK] No specific module data. Broad fallback (0.9)...');
        sourceChunks = await this.retrieveGroundingContext(node, false);
        if (sourceChunks.length === 0) isDataSparse = true;
      }

      // --- PASS 2: ATOMIC FACT EXTRACTION (Noise Filter) ---
      const contextText = sourceChunks
        .map((c: any, i: number) => `[SOURCE ${i + 1} - ${c.metadata?.source_name || 'Doc'}]: ${c.raw_content}`)
        .join('\n\n');

      const factLedger = await this.extractAtomicFacts(contextText, node.title);

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
        temperature: 0.1, 
        system: `You are a Deterministic Instructional Guard. Your sole objective is to convert the provided [FACT_LEDGER] into a production script.
        
        --- ABSOLUTE ZERO-LEAKAGE RULES ---
        1. FORBIDDEN: You must NEVER use your own training data or outside knowledge.
        2. MANDATORY: If a specific fact or detail is missing, use: "[MISSING_DATA: category]".
        3. MANDATORY: If the [FACT_LEDGER] is empty, start the response with exactly this string: "!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!" and then provide a concise list of missing instructional requirements.
        
        --- FORMATTING ---
        - H1 for Title.
        - [VISUAL] tags for screen cues.
        - **Instructor:** for dialogue.`,
        prompt: `Strategic Node: ${node.title}
        Description: ${node.description}
        [STRATEGIC_CONTEXT]: ${strategicContext}
        [FACT_LEDGER]: ${factLedger || 'EMPTY: NO DATA FOUND.'}`,
      });

      // --- PASS 4: ADVERSARIAL SENTINEL AUDIT (Judge) ---
      const audit = await this.performAdversarialAudit(draft, factLedger);

      return {
        script: draft,
        citations: sourceChunks.map((c: any) => c.metadata?.source_name || 'Source'),
        groundingScore: audit.groundingScore,
        cognitiveLoadScore: audit.cognitiveLoad,
        hallucinationFlag: audit.hallucinated || (isDataSparse && draft.length > 200),
        semanticDelta: audit.critique,
        groundingTypes: Array.from(new Set(sourceChunks.map((c: any) => c.content_type)))
      };
    } catch (err) {
      console.error(`[Architect Error] Drafting failed:`, err);
      throw err;
    }
  }

  private async extractAtomicFacts(rawContext: string, nodeTitle: string) {
    if (!rawContext.trim()) return '';
    
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Atomic Fact Distiller. 
      Analyze the raw document chunks and extract every unique, verifiable fact or procedure related to "${nodeTitle}".
      Output only a numbered list of atomic facts. Strip away all fluff.`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    const queryText = `Strict procedural data for: ${node.title}. ${node.description}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
      providerOptions: { google: { outputDimensionality: 3072 } }
    });

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: strictModule ? 0.3 : 0.85, 
      match_count: 5,
      p_blueprint_id: node.blueprintId,
      p_module_id: strictModule ? node.id : null
    });

    if (strictModule && (!data || data.length === 0)) {
      const moduleNum = node.id.split('_')[1]?.replace(/^0+/, '');
      const { data: sourceData } = await supabase
        .from('knowledge_vault')
        .select('id, content_type, raw_content, media_url, metadata')
        .eq('blueprint_id', node.blueprintId)
        .or(`metadata->>source_name.ilike.%M${moduleNum}%,metadata->>source_name.ilike.%Module ${moduleNum}%`)
        .limit(5);
      if (sourceData && sourceData.length > 0) return sourceData;
    }

    if (error) throw error;
    return data || [];
  }

  private async performAdversarialAudit(draft: string, factLedger: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Adversarial Integrity Sentinel. 
      Compare the DRAFT script against the [FACT_LEDGER].
      Identify any claim, fact, or detail in the DRAFT that is not explicitly in the [FACT_LEDGER].
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
