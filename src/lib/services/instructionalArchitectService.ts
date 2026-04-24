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
   * Generates a "Grounded Conversationalist" instructional script.
   * Logic: Fluent instructional voice + Deterministic Factual Anchoring.
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] [HYBRID_INIT] Drafting grounded conversational script: ${node.title}`);

    try {
      // --- PASS 1: TIERED RETRIEVAL (Physical Lock) ---
      let sourceChunks = await this.retrieveGroundingContext(node, true);
      let isDataSparse = false;

      if (sourceChunks.length === 0) {
        console.log('[Architect] [LOCK] No specific module data. FallbackBroad (0.85)...');
        sourceChunks = await this.retrieveGroundingContext(node, false);
        if (sourceChunks.length === 0) isDataSparse = true;
      }

      // --- PASS 2: ATOMIC FACT EXTRACTION (The Truth Ledger) ---
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
        - Strategy: ${bp.assessment_strategy?.overview}
        `;
      }

      // --- PASS 3: GROUNDED CONVERSATIONAL SYNTHESIS ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.2, // Slight increase for conversational fluency
        system: `You are a World-Class Instructional Designer. Your goal is to draft a high-fidelity production script.
        
        --- THE GROUNDED CONVERSATIONALIST PROTOCOL ---
        1. VOICE: Use a professional, engaging instructional voice for framing and transitions.
        2. KNOWLEDGE: You are strictly forbidden from inventing factual details. This includes but is not limited to:
           - Program/Course durations (e.g., "5 weeks").
           - Certification names or titles.
           - Specific metrics or passing scores (e.g., "75%").
           - Specific attempt limits or rules.
        3. GAPS: If any of the above administrative or numeric details are required for the script but missing from the [FACT_LEDGER], you MUST use: "[MISSING_DATA: category]".
        4. REFUSAL: If the [FACT_LEDGER] is empty, start with: "!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!"
        
        --- FORMATTING ---
        - H1 for Title.
        - [VISUAL] tags for screen cues.
        - **Instructor:** for dialogue.
        - Every factual claim MUST conclude with a Fact ID from the ledger (e.g., [Fact 4]).`,
        prompt: `Strategic Node: ${node.title}
        Description: ${node.description}
        [STRATEGIC_CONTEXT]: ${strategicContext}
        [FACT_LEDGER]: ${factLedger || 'EMPTY: NO DATA FOUND.'}`,
      });

      // --- PASS 4: ADVERSARIAL INTEGRITY SENTINEL ---
      const audit = await this.performAdversarialAudit(draft, factLedger);

      // More nuanced hallucination flag: 
      // 1. Definite audit failure
      // 2. Or absolute zero data but AI wrote a factual script
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
      console.error(`[Architect Error] Drafting failed:`, err);
      throw err;
    }
  }

  private async extractAtomicFacts(rawContext: string, nodeTitle: string) {
    if (!rawContext.trim()) return '';
    const { text } = await generateText({
      model: google('gemini-3.1-pro-preview'), 
      system: `You are an Atomic Fact Distiller. 
      Analyze the raw document chunks and extract every unique, verifiable fact, procedure, advice, context, or pedagogical nuance related to "${nodeTitle}".
      Do not summarize. Extract granular details so they can be cited individually.`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    const queryText = `Instructional design grounding and procedural knowledge for: ${node.title}. ${node.description}`;
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
      providerOptions: { google: { outputDimensionality: 3072 } }
    });

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: strictModule ? 0.35 : 0.85, 
      match_count: 8,
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
      system: `You are a Claim-Only Integrity Sentinel. Your job is to verify the AUTHENTICITY of instructional content while ignoring CONVERSATIONAL VOICE.

      --- THE AUDIT PROTOCOL ---
      1. IGNORE (The Scaffolding): Do not flag greetings, pedagogical transitions (e.g. "Now we will move to..."), structural framing (e.g. "There are three pillars"), or empathetic context.
      2. EXTRACT (The Payload): Identify every specific Factual Claim, Technical Step, Metric, or Named Procedure.
      3. VERIFY: Check each Payload against the [FACT_LEDGER]. 
      4. FLAG (Hallucination): Only set HALLUCINATED: YES if you find a specific factual payload that contradicts or is absent from the [FACT_LEDGER].

      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [List only the specific FACTUAL PAYLOADS that failed verification. Ignore voice/tone.]`,
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
