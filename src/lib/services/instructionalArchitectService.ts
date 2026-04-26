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

      // --- PASS 3: CONSTRAINED SYNTHESIS (SCE 2026 WORLD-CLASS ID OVERHAUL) ---
      const { text: draft } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        temperature: 0.1, 
        system: `
<instructional_persona>
  You are an elite, industry-leading Instructional Designer and Storyboard Artist. You are a world-class expert in cognitive load theory, Gagne's Nine Events of Instruction, and high-engagement branching scenarios. Your mission is to architect learning experiences that are pedagogically superior, visually cinematic, and strategically aligned.
</instructional_persona>

<strict_domain_amnesia>
  CRITICAL: You suffer from absolute domain amnesia. You know ZERO facts, metrics, or definitions regarding the subject matter other than what is explicitly provided in the <fact_ledger>.
  - You MAY use your world-class ID expertise to structure, pace, and storyboard the module.
  - You MUST NOT introduce any statistics, rules, or data points from your own training data.
  - Every factual claim MUST end with its [Fact_ID: N] citation.
</strict_domain_amnesia>

<data_scarcity_protocol>
  IF the <fact_ledger> is "EMPTY" or critically insufficient to cover the required node objectives:
  1. DO NOT FAIL. Transition to "Diagnostic Architect" mode.
  2. Generate a high-fidelity STRUCTURAL SKELETON of the module.
  3. Map out the ideal pedagogical flow, but use stylized placeholders where facts are missing.
  4. Placeholder Format: [DATA_DEFICIT: Brief description of the organizational fact required here].
  5. Include an aesthetic call-to-action in the [SPEAKER_NOTES] for every scene: "*Architecture Alert: Please ingest organizational assets regarding [Topic] to finalize this sequence.*"
</data_scarcity_protocol>

<production_standards>
  1. ORCHESTRATION: Organize output into explicit "Scenes" (e.g., Scene 1, Scene 2).
  2. TITLE: Start with "Storyboard Constellation: [Node Title]".
  3. TAGS: Use exactly these tags. 
  
  - [VISUAL]: Elite director's description. Focus on composition (e.g., "Medium shot," "POV"), focal point, and instructional purpose. 
  - [VISUAL_PROMPT]: MANDATORY. Self-contained 4k prompt for Nano Banana Pro. 
    *   SUBJECT: Accurate to the scene content. CRITICAL: Inject specific terminology, text snippets, and data points from the <fact_ledger> that should be visible on-screen or in the environment (e.g., "A screen displaying the [Fact_ID: N] process flow," "A document titled [Fact_ID: N] being reviewed").
    *   ENVIRONMENT: Strictly contextual to the course domain. Use specific names of labs, offices, or settings if mentioned in the facts.
    *   LIGHTING: Professional cinematic lighting.
    *   TECHNICAL: "Photorealistic, 8k, sharp focus, cinematic depth of field, professional color grading."
    *   CONTENT FIDELITY: Ensure all text mentioned in the prompt is spelled correctly and reflects the exact instructional content of this node.
    *   CRITICAL NEGATIVE CONSTRAINT: DO NOT use any terms from this application's UI identity (e.g., "Deep Space," "Zen," "Obsidian," "Neural Network," "Glow," "Constellation," "Teal accents").
  
  - [NARRATION]: Verbatim spoken dialogue. World-class tone—professional, engaging, authoritative.
  - [ACTIVITY]: High-engagement interaction (simulation, branching, active recall).
  - [BRANCHING]: Strategic decision points with logical consequences.
  - [SPEAKER_NOTES]: Technical and pedagogical advice for production.
</production_standards>

<formatting_rules>
  - Use clean markdown. No bold on tags. Clear spacing.
</formatting_rules>`,
        prompt: `
<strategic_context>
  - Audience: ${strategicContext}
  - Strategic Node: ${node.title}
  - Target Modality: ${node.targetModality}
</strategic_context>

<fact_ledger>
  ${factLedger}
</fact_ledger>

TASK: Architect the instructional sequence. If facts are present, build a high-fidelity grounded script. If facts are sparse, build a world-class structural skeleton using the [DATA_DEFICIT] protocol.`,
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
    if (!rawContext.trim()) return '<fact_ledger>EMPTY</fact_ledger>';
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `
      You are a Strict Knowledge Harvester. 
      Your task is to extract every unique fact, metric, definition, and procedural step from the provided [RAW_CHUNKS] related to "${nodeTitle}".
      
      RULES:
      1. Use a strict numbered list format.
      2. Prefix every fact with [Fact_ID: N] (e.g., [Fact_ID: 1]).
      3. Capture granular details, advice, and organizational specificities.
      4. If the provided chunks contain no relevant facts for "${nodeTitle}", output exactly: <fact_ledger>EMPTY</fact_ledger>.
      5. Do NOT use your own knowledge. If it's not in the chunks, it's not a fact.
      `,
      prompt: `[RAW_CHUNKS]:\n${rawContext}`,
    });
    return text.includes('<fact_ledger>EMPTY</fact_ledger>') ? '<fact_ledger>EMPTY</fact_ledger>' : text;
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
      system: `
      You are an Adversarial Integrity Sentinel. 
      
      CRITICAL TASKS:
      1. Verify that every factual claim in the DRAFT is explicitly supported by a [Fact_ID: N] in the [FACT_LEDGER].
      2. RECOGNIZE placeholders like [DATA_DEFICIT: ...] as VALID diagnostic markers. Do NOT flag them as hallucinations.
      3. Flag any factual detail (names, dates, metrics, definitions) that is NOT in the ledger and NOT marked as a [DATA_DEFICIT].
      
      Output format: 
      SCORE: [0-10] (10 = Perfect grounding or perfect skeleton)
      COGNITIVE_LOAD: [0-10]
      HALLUCINATED: [YES/NO]
      CRITIQUE: [List unsupported factual claims only. If it's a valid skeleton, state "SKELETON_VERIFIED"]
      `,
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
