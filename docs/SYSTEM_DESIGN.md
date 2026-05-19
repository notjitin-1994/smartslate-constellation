# 🏗️ Constellation System Design

## 1. High-Level Flow: The Architectural Bridge

```
Polaris Blueprint ──► Constellation Architect ──► ULS JSON ──► Nova
      +
Org Assets (PDF/DOCX/video) ──► Knowledge Vault (pgvector)
```

The Constellation pipeline is a 4-pass agentic RAG loop, fully structured via Zod schemas.
No free-text markdown contracts — every AI output is validated at the schema boundary.

---

## 2. Embedding Model & Vector Index

- **Model**: `gemini-embedding-001` — 3072-dimensional text embeddings (not `gemini-embedding-2`).
- **Index**: HNSW via `halfvec` cast — `(embedding::halfvec(3072)) halfvec_cosine_ops`.
  The standard `vector` type caps HNSW at 2000 dims; `halfvec` is required for 3072.
- **Query**: The similarity query also casts: `embedding::halfvec(3072) <=> $1::halfvec(3072)`
  so the planner uses the index.
- **Retrieval thresholds**: strict module pass at 0.75, broad fallback at 0.3.

---

## 3. The 4-Pass Architect Pipeline

### Pass 0 — Pre-flight
`vault.health()` — confirms the DB connection before any LLM spend.

### Pass 1 — Tiered Retrieval
1. Strict pass: vector similarity + module ID metadata filter (threshold 0.75, limit 15).
2. Falls back to broad pass (threshold 0.3) if strict returns nothing.
3. Falls back to metadata-only query if broad also returns nothing (marks `isDataSparse`).

### Pass 2 — Structured Fact Distillation
`generateObject(FactLedger)` — Gemini Flash extracts atomic facts from the retrieved chunks.
Returns `{ isEmpty, facts: [{ id, fact }] }`. No regex parsing.

### Pass 3 — Schema-First Synthesis
`generateObject(NodeScript)` — Gemini Pro synthesizes the instructional script.

**Merrill Strategy Layer** (Phase 3 addition):
Before calling the model, `resolveInstructionalStrategy(pedagogicalMode)` maps the raw mode
string to one of five Merrill phases:
- `ACTIVATION` — knowledge-activation hook, recall verb
- `DEMONSTRATION` — worked example, explain verb
- `APPLICATION` — realistic problem + branching, demonstrate verb
- `INTEGRATION` — real-world transfer, design verb
- `TASK_CENTERED` — authentic task anchor, analyze verb

The resolved `merrillMode`, `merrillPhase`, `cognitiveVerb`, and `promptGuidance` are injected
into the synthesis prompt. The AI is instructed to set `cognitiveVerb` accordingly.

Output: `NodeScript` — `{ nodeTitle, pedagogicalMode, cognitiveVerb, scaffolding, scenes[] }`.
Each scene has `narration`, `visual`, `activity`, `branching`, `speakerNotes`, `citations`, `dataDeficits`.

### Pass 4 — Adversarial Audit
`generateObject(AuditResult)` — Gemini Flash validates every narration claim against the
fact ledger. Returns `{ groundingScore, cognitiveLoad, hallucinated, critique }`.
Audit failures surface real error text (not silent 0/5 defaults).

---

## 4. Universal Learning Schema (ULS)

Built client-side by `src/domain/uls/builder.ts` from all drafted `DraftResult` objects.

```typescript
ULSSchema = {
  uls_version: '1.0-GLA',
  meta: { polaris_id, strategy_alignment, generated_at, total_nodes, nodes_completed },
  pedagogical_model: 'Merrill_First_Principles',
  architecture_nodes: [{
    node_id, title, mode, cognitive_verb, scaffolding,
    cognitive_load, grounding_score, hallucination_flag,
    instructional_script: { visual_treatment, narration, on_screen_text },
    asset_grounding: [...citation strings],
    synthetic_required: boolean,
  }],
  guardrails: { max_cognitive_load, reading_level, clg_threshold: 8.5, clg_passed },
}
```

**Cognitive Load Guardrail (CLG)**: `POST /api/architect/export` validates the ULS and returns
HTTP 422 if any node's `cognitive_load > 8.5`. The blueprint status is only updated to
`architecting` when the ULS passes all checks.

---

## 5. Knowledge Ingest Pipeline

- PDF: `unpdf` → `extractText`
- DOCX: `mammoth` → `extractRawText`
- Images/video: `sdkGenerateText` with Gemini multimodal (direct file content pass-through)
- **Segregation**: Documents ≤ 200,000 chars → LLM-based module segregation via `generateObject(SegregationSchema)`.
  Assigns each passage to the most relevant module. Falls back to generic chunking for larger docs.
- **Chunking**: `src/lib/chunking.ts` — sentence-boundary splits, ~800-token target, 80-token overlap.
- **Harvest**: Blueprint JSON → fact extraction → embedding → vault (skipped if already done).

---

## 6. Security Model

All generation routes require authentication before touching the admin client:
- `requireBlueprintOwner(blueprintId)` — verifies the session user owns the blueprint
  (reads via anon-key SSR client, then checks `blueprint_generator.user_id` via admin client).
- `requireAuth()` — authentication-only check for global (non-blueprint) asset ingestion.

---

## 7. Hexagonal Architecture

```
Domain (pure)          Ports (interfaces)    Adapters (I/O)
─────────────────      ──────────────────    ─────────────────
merrillStrategy.ts  ←  LlmPort              GeminiLlmAdapter
cognitiveLoad.ts    ←  VaultPort            SupabaseVaultAdapter
uls/schema.ts
uls/builder.ts

Services (orchestration only)
──────────────────────────────
InstructionalArchitectService(llm: LlmPort, vault: VaultPort)
KnowledgeIngestService(llm: LlmPort, vault: VaultPort)
```

Domain code has zero I/O dependencies — fully unit-testable with mock ports.

---

## 8. Resilience

- **Retry**: `withRetry()` in `src/lib/retry.ts` — exponential backoff + ±25% jitter on
  429/503/rate-limit/quota/ECONNRESET. Default: 3 attempts, base 1 s, max 10 s.
- **Route budget**: `export const maxDuration = 300` on architect/draft and ingest routes.
- **Logging**: `createLogger()` in `src/lib/logger.ts` — JSON-lines with per-request correlation IDs.
