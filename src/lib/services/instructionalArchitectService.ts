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
   * Generates a grounded conversational instructional script.
   * Implementation: Structured Fact-Verification (0% Hallucination Target).
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] [VERIFY_INIT] Drafting script: ${node.title}`);

    try {
      // --- PASS 1: TIERED RETRIEVAL ---
      let sourceChunks = await this.retrieveGroundingContext(node, true);
      let isDataSparse = false;

      if (sourceChunks.length === 0) {
        sourceChunks = await this.retrieveGroundingContext(node, false);
        if (sourceChunks.length === 0) isDataSparse = true;
      }

      // --- PASS 2: STRUCTURED FACT DISTILLATION ---
      const contextText = sourceChunks
        .map((c: any, i: number) => `[SOURCE ${i + 1}]: ${c.raw_content}`)
        .join('\n\n');

      const factLedger = await this.extractAtomicFacts(contextText, node.title);

      // Polaris Context
      const bp = node.blueprintContext as any;
      let strategicContext = 'N/A';
      if (bp) {
        strategicContext = `
        - Audience: ${bp.target_audience?.demographics?.roles?.join(', ')}
        - Level: ${bp.target_audience?.demographics?.experience_levels?.join(', ')}
        - Goal: ${bp.executive_summary?.content}
        `;
      }

      // --- PASS 3: CONSTRAINED SYNTHESIS ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, 
        system: `You are a Deterministic Instructional Designer. Your goal is to draft a script using ONLY the [FACT_LEDGER].
        
        --- MANDATORY PROTOCOLS ---
        1. CLAM-ONLY GROUNDING: Every sentence that conveys a fact, step, or rule MUST end with its specific Fact ID (e.g., [Fact 4]).
        2. SCAFFOLDING: You may use professional instructional framing and greetings, but never invent new factual details.
        3. REFUSAL: If the [FACT_LEDGER] is empty, start with: "!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!"
        4. GAPS: Use "[MISSING_DATA: category]" for required but undocumented info.`,
        prompt: `Strategic Context: ${strategicContext}\nStrategic Node: ${node.title}\n[FACT_LEDGER]:\n${factLedger || 'EMPTY.'}`,
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
      console.error(`[Architect Error]:`, err);
      throw err;
    }
  }

  private async extractAtomicFacts(rawContext: string, nodeTitle: string) {
    if (!rawContext.trim()) return '';
    const { text } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `Distill the provided chunks into a numbered list of UNIQUE Atomic Facts related to "${nodeTitle}". Capture granular details, advice, and metrics.`,
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
      match_count: 10,
      p_blueprint_id: node.blueprintId,
      p_module_id: strictModule ? node.id : null
    });

    if (strictModule && (!data || data.length === 0)) {
      const moduleNum = node.id.split('_')[1]?.replace(/^0+/, '');
      const { data: sourceData } = await supabase
        .from('knowledge_vault')
        .select('id, content_type, raw_content, media_url, metadata')
        .eq('blueprint_id', node.blueprintId)
        .or(`metadata->>source_name.ilike.%M${moduleNum}%,metadata->>source_name.ilike.%Module ${moduleNum}%,metadata->>source_name.eq.POLARIS_BLUEPRINT`)
        .limit(10);
      if (sourceData && sourceData.length > 0) return sourceData;
    }

    if (error) throw error;
    return data || [];
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
