# GEMINI Core Mandates: SmartSlate Constellation

## Project Mission
To architect a zero-ambiguity instructional design ecosystem through a multi-agent orchestration layer. This layer, known as the **Constellation Orchestrator**, transforms raw data and learning blueprints into production-ready content developer handovers.

## Foundation Principles
1. **Source Precedence:** The Polaris Blueprint is the ultimate strategic source of truth.
2. **Zero-Ambiguity:** Every deliverable must be clear enough for a content developer to build without further clarification.
3. **Brand Agnostic Mockups:** Visual descriptions and prompts MUST NOT be tied to the application's brand. They must dynamically adapt to the user's institutional art direction.
4. **Pedagogical Rigor:** All instructional design must adhere to proven standards (Merrill's First Principles, Gagne's Nine Events).

## Architectural Protocol (Multi-Agent)
- **Knowledge Analyst:** Ingests and cross-references source data.
- **Constellation Mapper:** Defines the structural and instructional logic.
- **Visual Agent:** Generates brand-agnostic art direction.
- **Integrity Sentinel:** Audits for hallucinations and KPI alignment.
- **Refinement Agent:** Handles iterative surgical updates.

## Technical Safety
- **Credential Integrity:** Never expose Supabase keys or service role keys in logs or client-side code.
- **Surgical Edits:** When refining content, prefer updating specific scenes rather than regenerating entire modules.
- **Parser Stability:** Maintain compatibility with the `ScriptDraftingWorkspace` regex-based parsing engine.
