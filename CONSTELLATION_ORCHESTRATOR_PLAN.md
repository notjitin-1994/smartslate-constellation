# Constellation Orchestrator: Multi-Agent Instructional Design Blueprint

## Vision
Transform raw user facts and Polaris Blueprints into zero-ambiguity, production-ready instructional storyboards. The system uses a multi-agent architecture to ensure pedagogical rigor, brand flexibility, and extreme technical clarity for content developers.

## Core Agents

### 1. Knowledge Analyst Agent (Salvaged & Enhanced)
- **Source:** `src/lib/services/knowledgeIngestService.ts`
- **Role:** Extract atomic facts from documents (PDF, DOCX, Text) and multi-modal assets.
- **Mandate:** Cross-reference user-provided data with the Polaris Blueprint. Identify "Strategic Anchors" (KPIs, Demographics, Timelines).

### 2. Constellation Mapping Agent (New)
- **Role:** Strategic Instructional Architect.
- **Mandate:** Map the "Fact Ledger" from the Analyst Agent to 2026 Instructional Design standards (Gagne's Nine Events, Merrill's First Principles). 
- **Output:** The structural logic and pedagogical flow of the module.

### 3. Mockup & Visual Agent (New - Brand Agnostic)
- **Role:** Visual Storyboard Artist.
- **Mandate:** Generate high-fidelity `[VISUAL]` descriptions and `[VISUAL_PROMPT]` tags.
- **Constraint:** **Brand Agnostic.** It must adapt to the "Institutional Art Direction" provided in the blueprint or user data, rather than sticking to a hardcoded application style.

### 4. Adversarial Integrity Sentinel (Existing - Enhanced)
- **Role:** Quality Assurance & Hallucination Guard.
- **Mandate:** Ensure 100% groundedness. Every claim must have a [Fact_ID]. Flag any deviation from the provided blueprint or user data.

### 5. Iterative Refinement Agent (New)
- **Role:** User Collaboration Partner.
- **Mandate:** Handle post-generation changes. Perform surgical updates to specific scenes or modules based on natural language feedback without breaking the entire constellation.

## Technical Alignment
- **UI:** Maintain compatibility with the `ScriptDraftingWorkspace.tsx` Bento Grid parser.
- **Data:** Reuse `knowledge_vault` and `starmaps` tables as the primary state ledger.
- **Schema:** Use tags understood by the current parser (`[VISUAL]`, `[NARRATION]`, `[ACTIVITY]`, `[BRANCHING]`, `[SPEAKER_NOTES]`, `[VISUAL_PROMPT]`) while mapping new data types (KPIs, Accessibility) into these existing blocks.

## Roadmap
1. **Phase 1:** Deep review and hardening of the Knowledge Ingestion Service.
2. **Phase 2:** Implementation of the `ConstellationOrchestrator` service.
3. **Phase 3:** Refactoring Prompt Contracts for Brand-Agnostic Mockups.
4. **Phase 4:** Deployment to Vercel Development Environment.
