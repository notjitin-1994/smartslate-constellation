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
   * ZERO training data usage allowed.
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    console.log(`[Architect] Drafting script with Strict Grounding: ${node.title}`);

    try {
      // PASS 1: Tiered Retrieval
      // Tier A: Strict Module Match
      let sourceChunks = await this.retrieveGroundingContext(node, true);
      let isDataSparse = false;

      // Tier B: Fallback to Blueprint-wide if module-specific is missing
      if (sourceChunks.length < 2) {
        console.log('[Architect] Sparse module data. Falling back to broader blueprint search...');
        const broaderChunks = await this.retrieveGroundingContext(node, false);
        sourceChunks = [...sourceChunks, ...broaderChunks];
        
        // Remove duplicates by ID
        const uniqueIds = new Set();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sourceChunks = sourceChunks.filter((c: any) => {
          if (uniqueIds.has(c.id)) return false;
          uniqueIds.add(c.id);
          return true;
        });

        if (sourceChunks.length < 2) isDataSparse = true;
      }

      // Context Extractor from Polaris Blueprint
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bp = node.blueprintContext as any;
      let strategicContext = 'N/A';
      if (bp) {
        strategicContext = `
        - Target Audience: ${bp.target_audience?.demographics?.roles?.join(', ')}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        - Learning Preferences: ${bp.target_audience?.learning_preferences?.modalities?.map((m: any) => `${m.type} (${m.percentage}%)`).join(', ')}
        - Assessment Strategy: ${bp.assessment_strategy?.overview}
        `;
      }

      const contextText = sourceChunks
        .map((c: { metadata: { source_name: string }, raw_content: string }, i: number) => `[SOURCE ${i + 1} - ${c.metadata?.source_name || 'Unknown'}]: ${c.raw_content}`)
        .join('\n\n');

      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, // Minimal creativity for high grounding
        system: `You are a World-Class Generative Learning Architect. Your goal is to draft a high-fidelity instructional script based EXCLUSIVELY on provided organizational data.

        --- CRITICAL GROUNDING RULES (ZERO LEAKAGE) ---
        1. Use ONLY information found in the provided [SOURCE_CHUNKS].
        2. DO NOT use your own training data, general knowledge, or internet research.
        3. If a specific fact, step, or rule is not present in the sources, you MUST use a descriptive placeholder tag in this format: "[MISSING_DATA: Describe the specific missing information, e.g., 'Internal Referral Link' or 'Global Policy Page Number']". Be as specific as possible about WHAT is missing based on the instructional requirement.
        4. If the [SOURCE_CHUNKS] contain barely any relevant information for the module "${node.title}", start the script with a prominent warning: "> ⚠️ **INSUFFICIENT DOCUMENTATION DETECTED**: This script is limited by a lack of specific grounding assets for this module. Please upload more relevant SOPs or manuals."
        
        --- POLARIS STRATEGIC CONTEXT ---
        ${strategicContext}

        --- TARGET MODALITY ---
        This script is for: ${node.targetModality || 'Standard eLearning'}.

        --- FORMATTING ---
        - H1 for Title.
        - [VISUAL] tags for screen cues.
        - **Instructor:** for dialogue.
        - End every single claim with a citation (e.g., [Source 1]).`,
        prompt: `Strategic Node: ${node.title}
        Description: ${node.description}
        Data Status: ${isDataSparse ? 'SPARSE/MISSING' : 'SUFFICIENT'}
        
        [SOURCE_CHUNKS]:
        ${contextText || 'NO SOURCE DATA PROVIDED.'}`,
      });

      // PASS 3: The NLI Judge (Audit)
      const audit = await this.performInstructionalAudit(draft, contextText);

      return {
        script: draft,
        citations: sourceChunks.map((c: { metadata: { source_name: string } }) => c.metadata?.source_name || 'Source'),
        groundingScore: audit.groundingScore,
        cognitiveLoadScore: audit.cognitiveLoad,
        hallucinationFlag: audit.hallucinated || (isDataSparse && draft.length > 500),
        semanticDelta: audit.critique,
        groundingTypes: Array.from(new Set(sourceChunks.map((c: { content_type: string }) => c.content_type)))
      };
    } catch (err) {
      console.error(`[Architect Error] Drafting failed:`, err);
      throw err;
    }
  }

  private async retrieveGroundingContext(node: ArchitecturalNode, strictModule: boolean) {
    const queryText = `Instructional design grounding and procedural knowledge for: ${node.title}. ${node.description}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: queryText,
      providerOptions: { google: { outputDimensionality: 3072 } }
    });

    // Use the new RPC with optional p_module_id
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: strictModule ? 0.4 : 0.8, // Low threshold for specific match, high for broad fallback
      match_count: 5,
      p_blueprint_id: node.blueprintId,
      p_module_id: strictModule ? node.id : null
    });

    if (error) {
      console.error('[Architect DB Error]:', error);
      throw error;
    }
    return data || [];
  }

  private async performInstructionalAudit(draft: string, sources: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Instructional Design Auditor. Analyze the DRAFT against the SOURCES.
      Your primary mission is to detect HALLUCINATIONS (information in DRAFT not found in SOURCES).
      
      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [Detailed analysis of grounding. Flag any sentence that uses training data instead of user sources.]`,
      prompt: `DRAFT: ${draft}\n\nSOURCES: ${sources}`,
    });

    const groundingScore = parseInt(text.match(/SCORE:\s*(\d+)/i)?.[1] || '0');
    const cognitiveLoad = parseInt(text.match(/COGNITIVE_LOAD:\s*(\d+)/i)?.[1] || '5');
    const hallucinated = /HALLUCINATED:\s*YES/i.test(text);
    const critique = text.split('CRITIQUE:')[1]?.trim();

    return { groundingScore, cognitiveLoad, hallucinated, critique };
  }
}

export const instructionalArchitectService = new InstructionalArchitectService();
