import { supabase } from '@/lib/supabase';
import { generateText, embed } from 'ai';
import { google } from '@ai-sdk/google';

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
  hallucinationFlag: boolean;
  semanticDelta?: string;
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
        hallucinationFlag: true,
        semanticDelta: "No supporting documentation found in the Knowledge Vault."
      };
    }

    // PASS 2: Citation-Enforced Generation (Gemini 1.5 Pro)
    const contextText = sourceChunks
      .map((c: { metadata: { source_name: string }, raw_content: string }, i: number) => `[SOURCE ${i + 1} - ${c.metadata?.source_name || 'Unknown'}]: ${c.raw_content}`)
      .join('\n\n');

    const { text: draft } = await generateText({
      model: google('gemini-1.5-pro'),
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

    // PASS 3: The NLI Judge (Validation Pass with Gemini 2.0 Flash)
    const validation = await this.verifyGrounding(draft, contextText);

    return {
      script: draft,
      citations: sourceChunks.map((c: { metadata: { source_name: string } }) => c.metadata?.source_name || 'Source'),
      groundingScore: validation.score,
      hallucinationFlag: validation.hallucinated,
      semanticDelta: validation.critique
    };
  }

  private async retrieveGroundingContext(node: ArchitecturalNode) {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: `${node.title}: ${node.description}`,
    });

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 5,
      p_blueprint_id: node.blueprintId
    });

    if (error) throw error;
    return data || [];
  }

  private async verifyGrounding(draft: string, sources: string) {
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: `You are a Fact-Checking Judge. Compare the DRAFT against the SOURCES. 
      Identify any claims in the DRAFT that are NOT supported by the SOURCES.
      Output format: 
      SCORE: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [Brief explanation of discrepancies]`,
      prompt: `DRAFT: ${draft}\n\nSOURCES: ${sources}`,
    });

    const score = parseInt(text.match(/SCORE: (\d+)/)?.[1] || '0');
    const hallucinated = text.includes('HALLUCINATED: YES');
    const critique = text.split('CRITIQUE:')[1]?.trim();

    return { score, hallucinated, critique };
  }
}

export const instructionalArchitectService = new InstructionalArchitectService();
