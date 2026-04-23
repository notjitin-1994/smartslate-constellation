import { supabase } from '@/lib/supabase';
import { generateText, embed } from 'ai';
import { google } from '@/lib/google';

export interface ArchitecturalNode {
  id: string;
  title: string;
  description: string;
  pedagogicalMode: string;
  blueprintId: string;
}

export interface ScriptOutput {
  script: string;
  citations: string[];
  groundingScore: number;
  cognitiveLoadScore: number; // Functional score
  hallucinationFlag: boolean;
  semanticDelta?: string;
  groundingTypes: string[]; // ['text', 'video', etc]
}

export class InstructionalArchitectService {
  /**
   * Generates a grounded instructional script for a specific node
   * using the Triple-Pass Integrity Shield.
   */
  async draftNodeScript(node: ArchitecturalNode): Promise<ScriptOutput> {
    // PASS 1: Strict Semantic Retrieval
    const sourceChunks = await this.retrieveGroundingContext(node);
    
    if (sourceChunks.length === 0) {
      return {
        script: `[GROUNDING_ERROR] No organizational data found for "${node.title}". Please upload relevant SOPs or manuals.`,
        citations: [],
        groundingScore: 0,
        cognitiveLoadScore: 0,
        hallucinationFlag: true,
        semanticDelta: "No supporting documentation found in the Knowledge Vault.",
        groundingTypes: []
      };
    }

    // PASS 2: Citation-Enforced Generation (Gemini 3.1 Pro)
    const contextText = sourceChunks
      .map((c: { metadata: { source_name: string }, raw_content: string }, i: number) => `[SOURCE ${i + 1} - ${c.metadata?.source_name || 'Unknown'}]: ${c.raw_content}`)
      .join('\n\n');

    const { text: draft } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `You are a Generative Learning Architect. Your goal is to draft a high-fidelity instructional script.
      STRICT GROUNDING RULES:
      1. Use ONLY information found in the provided [SOURCE_CHUNKS].
      2. If a fact is not present, do not invent it. Use "[MISSING_DATA]" instead.
      3. Assign a pedagogical mode: ${node.pedagogicalMode}.
      4. End every claim with a citation (e.g., [Source 1]).`,
      prompt: `Strategic Node: ${node.title}
      Description: ${node.description}
      
      [SOURCE_CHUNKS]:
      ${contextText}`,
    });

    // PASS 3: The NLI Judge (Validation & Cognitive Audit with Gemini 3 Flash)
    const audit = await this.performInstructionalAudit(draft, contextText);

    return {
      script: draft,
      citations: sourceChunks.map((c: { metadata: { source_name: string } }) => c.metadata?.source_name || 'Source'),
      groundingScore: audit.groundingScore,
      cognitiveLoadScore: audit.cognitiveLoad,
      hallucinationFlag: audit.hallucinated,
      semanticDelta: audit.critique,
      groundingTypes: Array.from(new Set(sourceChunks.map((c: { content_type: string }) => c.content_type)))
    };
  }

  private async retrieveGroundingContext(node: ArchitecturalNode) {
    console.log(`[Architect] Retrieving context for: ${node.title}`);
    
    const queryText = `Instructional design grounding and procedural knowledge for: ${node.title}. ${node.description}`;

    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2-preview'),
      value: queryText,
      providerOptions: {
        google: {
          outputDimensionality: 3072,
        }
      }
    });

    // Try with a more relaxed threshold first, then fallback.
    // 0.5 is a safe floor for 3072-dim cosine similarity
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5, 
      match_count: 5,
      p_blueprint_id: node.blueprintId
    });

    if (error) {
      console.error('[Architect Retrieval Error]:', error);
      throw error;
    }

    console.log(`[Architect] Found ${data?.length || 0} matching chunks.`);
    return data || [];
  }

  private async performInstructionalAudit(draft: string, sources: string) {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are an Instructional Design Auditor. Analyze the DRAFT against the SOURCES.
      You must evaluate:
      1. GROUNDING: Is every claim supported by the SOURCES?
      2. COGNITIVE LOAD: Evaluate mental effort (0-10) based on terminology density, sentence complexity, and step-count.
      
      Output format: 
      SCORE: [0-10]
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [Analysis of grounding and complexity]`,
      prompt: `DRAFT: ${draft}\n\nSOURCES: ${sources}`,
    });

    const groundingScore = parseInt(text.match(/SCORE: (\d+)/)?.[1] || '0');
    const cognitiveLoad = parseInt(text.match(/COGNITIVE_LOAD: (\d+)/)?.[1] || '5');
    const hallucinated = text.includes('HALLUCINATED: YES');
    const critique = text.split('CRITIQUE:')[1]?.trim();

    return { groundingScore, cognitiveLoad, hallucinated, critique };
  }
}

export const instructionalArchitectService = new InstructionalArchitectService();
