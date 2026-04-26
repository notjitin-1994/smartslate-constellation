# Context-Aware Mapping Engine: Implementation Plan (2026 Standards)

## Research Synthesis & Problem Statement
Current multi-agent orchestration (the "Map Constellation" function) suffers from "Node Isolation Amnesia" and "Context Exhaustion." It blindly passes the entire raw knowledge ledger into a single prompt without awareness of previous nodes, creating disjointed, repetitive storyboards. The system also lacks deterministic modality routing (e.g., treating a Video the same as a Simulation).

Based on 2026 industry standards for Multi-Agent Systems (MAS) and Contextual RAG (e.g., LangGraph patterns, Context Scoping), the solution is a **Stateful, Hierarchical, and Modality-Aware** orchestration engine.

## Phase 1: Persistent Context Layer (State Management)
Agents need a shared memory across node generations. We will implement a `GlobalConstellationState` that tracks the narrative progression and fact usage.

### Technical Tasks:
1.  **Define `GlobalConstellationState` Entity:**
    *   `blueprint_id`: string
    *   `covered_fact_ids`: string[] (To prevent repetition)
    *   `narrative_arc`: string (A running summary of the story so far)
    *   `previous_node_outputs`: string[] (Brief summaries of past nodes)

2.  **Create `StateStore` Adapter:**
    *   Use Supabase to persist this state in the existing `constellation_states` table.
    *   Fetch this state at the beginning of `orchestrate()`.
    *   Update this state at the end of `orchestrate()` using the Integrity Sentinel's audit.

## Phase 2: Contextual Retrieval (Agentic RAG)
Stop dumping the entire `subject_matter_md` into the Architect's prompt. Implement a high-density, low-noise context window.

### Technical Tasks:
1.  **Activate `searchFacts`:** Use the existing (but currently unused) `SupabaseKnowledgeStore.searchFacts()` method.
    *   Query: `${nodeTitle} - ${nodeDescription}`
    *   Threshold: High confidence.
2.  **Strategic Alignment Injection:** Inject the `strategic_alignment_md` (Gap Analysis) into the prompt so the Architect knows what facts are missing and what KPIs must be hit.
3.  **Context Assembly:** The Architect's prompt will now receive a curated `Local Context` (top-K facts) + `Global Context` (the narrative arc from Phase 1).

## Phase 3: Deterministic Modality Routing
Agents perform better with "Structural Scaffolds." We will implement a pre-LLM context router based on the `targetModality`.

### Technical Tasks:
1.  **Create `InstructionalModalityRouter`:**
    *   A static registry of DSL (Domain Specific Language) templates.
    *   *Video Template:* Enforces visual continuity, B-roll `[VISUAL]`, and conversational `[NARRATION]`.
    *   *Simulation Template:* Enforces `[BRANCHING]` logic, success/failure states, and interactive `[ACTIVITY]`.
    *   *Text/Document Template:* Enforces dense `[NARRATION]` and simple `[VISUAL]`.
2.  **Template Injection:** Before calling `generateObject` for the Tactical Schematic, the Orchestrator will inject the specific Modality Template into the Architect's system prompt based on the `targetModality` string.

## Execution Plan (Sequential Integration)
This implementation will be executed systematically to ensure production stability:

1.  **Domain Update:** Update Interfaces (`IOrchestrator`, `KnowledgeLedger`) to support State and Context.
2.  **Infrastructure (State):** Build the `SupabaseStateStore`.
3.  **Infrastructure (Router):** Build the `InstructionalModalityRouter` with the 2026 DSL templates.
4.  **Infrastructure (Orchestrator):** Refactor `AgenticConstellationOrchestrator.ts` to implement the three phases.
5.  **API Update:** Update `/api/architect/draft/route.ts` to supply the state and handle the new orchestration flow.
6.  **Frontend Sync:** Ensure the UI components gracefully handle any new metadata from the updated Schematic.
