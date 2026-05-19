# 🚀 Implementation Plan: Smartslate Constellation

## ✅ Phase 0: Schema Stabilization (COMPLETED)

- Reconciled DB schema drift: `user_id` column, `docx` content_type, `visual_generations` table
- Added HNSW vector index via `halfvec` cast for 3072-dim vectors
- Fixed embedding model: `gemini-embedding-001` (was `gemini-embedding-2`)
- Fixed retrieval threshold inversion (strict=0.75, fallback=0.3)
- Added `maxDuration = 300` and `runtime = 'nodejs'` to all generation routes
- Forward migration: `supabase/migrations/20260519_stabilize_knowledge_vault.sql` applied to production

---

## ✅ Phase 1: Schema-First Generation (COMPLETED)

- Replaced tagged-markdown + regex with Zod schemas + `generateObject` throughout
- `src/types/architect.ts` — `NodeScript`, `Scene`, `AuditResult`, `FactLedger` Zod schemas
- `src/types/knowledge.ts` — `ContentType`, `IngestAsset`, `KnowledgeChunk`
- `ScriptDraftingWorkspace` — deleted multi-pass line parser, consumes `Scene[]` directly
- `extractAtomicFacts` and `performAdversarialAudit` both use `generateObject` (no regex)
- `modalityMapper.ts` promoted from test-only to real module, wired into `constellation/page.tsx`

---

## ✅ Phase 2: Hexagonal Refactor + Resilience + Security (COMPLETED)

- `src/ports/` — `LlmPort`, `VaultPort` interfaces
- `src/adapters/` — `GeminiLlmAdapter`, `SupabaseVaultAdapter`
- `src/lib/retry.ts` — exponential backoff with jitter for 429/503/rate-limit
- `src/lib/chunking.ts` — sentence-boundary, 800-token target, 80-token overlap
- `src/lib/logger.ts` — JSON-lines structured logging with correlation IDs
- `src/lib/routeAuth.ts` — `requireBlueprintOwner`, `requireAuth`, `authErrorResponse`
- All generation routes protected with auth + ownership check before admin client use
- Both services refactored to depend only on ports (fully unit-testable with mocks)

---

## ✅ Phase 3: Real ULS Handover + Pedagogical Intelligence (COMPLETED)

### Merrill Strategy Layer
- `src/domain/pedagogy/merrillStrategy.ts` — maps raw `pedagogicalMode` to one of five
  Merrill First Principles phases (ACTIVATION, DEMONSTRATION, APPLICATION, INTEGRATION, TASK_CENTERED)
- Resolved `merrillMode`, `cognitiveVerb`, `bloomLevel`, and `promptGuidance` injected into every
  synthesis prompt (Pass 3) so the AI generates mode-appropriate content, not generic direct instruction

### Cognitive Load Guardrail
- `src/domain/pedagogy/cognitiveLoad.ts` — `assessCLG()`, `CLG_THRESHOLD = 8.5`
- HUD cognitive bar turns amber when active node CLG > 8.5
- CLG warning chip in header when any drafted node exceeds threshold
- `POST /api/architect/export` returns HTTP 422 with violating node list when CLG gate fails

### Universal Learning Schema
- `src/domain/uls/schema.ts` — Zod `ULSSchema` matching HANDOVER_PROTOCOL §4
- `src/domain/uls/builder.ts` — `buildULS()` assembles validated ULS from all `DraftResult` objects
- "View Handover Schema" modal renders the real ULS: metadata, guardrails, per-node table, full JSON

### Nova Export Endpoint
- `POST /api/architect/export` — auth → ULS schema validation → CLG gate → status transition
- Blueprint status transitions `completed → architecting` on successful export
- Endpoint rejects invalid ULS payloads with structured Zod error details

### Unit Tests (domain layer)
- `src/domain/pedagogy/merrillStrategy.test.ts`
- `src/domain/pedagogy/cognitiveLoad.test.ts`
- `src/domain/uls/schema.test.ts`
- `src/domain/uls/builder.test.ts`

---

## 📜 Current Status

| Layer | Status |
|---|---|
| DB Schema | ✅ Stable — migrations applied, HNSW index active |
| Embedding | ✅ `gemini-embedding-001`, 3072-dim, consistent write/read |
| Retrieval | ✅ Tiered (strict→broad→metadata fallback), thresholds correct |
| Generation | ✅ Schema-first (`generateObject`) — no regex on AI output |
| Architecture | ✅ Hexagonal — services depend on ports, adapters implement them |
| Auth | ✅ All routes protected; ownership checked before admin client |
| Pedagogy | ✅ Merrill phase + Bloom verb resolved and injected per node |
| ULS | ✅ Real schema built from DraftResults; validated before export |
| CLG Gate | ✅ Blocks Nova export when any node CLG > 8.5 |
| Tests | ✅ Domain layer unit-tested (merrillStrategy, cognitiveLoad, ULS schema, builder) |
