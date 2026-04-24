/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase as defaultClient } from '@/lib/supabase';
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
        system: `You are a World-Class Instructional Architect. Your goal is to draft a production-ready storyboard (Constellation) using ONLY the [FACT_LEDGER].
        
        --- PRODUCTION ARTIFACT STANDARDS ---
        You MUST use the following tags to categorize all instructional content:
        1. [VISUAL]: Describe what appears on screen (graphics, text, layout). Use a director's tone.
        2. [NARRATION]: The verbatim spoken dialogue for the instructor/voiceover.
        3. [ACTIVITY]: Describe a specific learner interaction (e.g. "Drag and drop the correct pillar").
        4. [BRANCHING]: Define a decision point and its outcomes (e.g. "If User picks A, show B").
        5. [SPEAKER_NOTES]: Technical tips for the final content producer.

        --- MANDATORY PROTOCOLS ---
        1. CLAIM-ONLY GROUNDING: Every sentence that conveys a fact, step, or rule MUST end with its specific Fact ID (e.g., [Fact 4]).
        2. SCAFFOLDING: Use professional instructional framing, but never invent new factual details.
        3. REFUSAL: If the [FACT_LEDGER] is empty, start with: "!!!INSUFFICIENT_DOCUMENTATION_DETECTED!!!"`,
        prompt: `Strategic Context: ${strategicContext}\nStrategic Node: ${node.title}\nTarget Modality: ${node.targetModality}\n[FACT_LEDGER]:\n${factLedger || 'EMPTY.'}`,
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
      model: google('gemini-3.1-pro-preview'),
      system: `Distill the provided chunks into a numbered list of UNIQUE Atomic Facts related to "${nodeTitle}". Capture granular details, advice, and metrics.`,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text;
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    const supabase = defaultClient;
    const queryText = `Strict procedural data for: ${node.title}. ${node.description}`;
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
      providerOptions: { google: { outputDimensionality: 3072 } }
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
