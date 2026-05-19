# 🛠️ Constellation Generation Engine — Revamp Plan

> Scope: the **generation pipeline** — RAG ingestion, the Instructional Architect,
> the draft API, and the script workspace. Drafted after a full read of
> `src/lib/services/*`, `src/app/api/*`, `src/app/constellation/*`,
> `supabase/migrations/*`, the vision/design docs, and validation against
> current Gemini + pgvector + Vercel AI SDK documentation.

---

## 1. Executive Summary

Constellation today is a **working demo of single-node script drafting**, not the
"Generative Learning Architect" described in `vision_v2.md`. The generation code
is clever but fragile: it leans on free-text markdown + regex parsing, the RAG
retrieval layer is broken against the committed DB schema, several "completed"
features exist only in test files, and the product's actual deliverable — the
**Universal Learning Schema (ULS)** handed to Nova — does not exist in code.

The revamp has three thrusts:

1. **Stabilize** — fix the schema drift and retrieval bugs that make grounding
   unreliable or non-reproducible (P0).
2. **Restructure** — replace tagged-markdown + regex with **schema-first
   structured generation** (Zod), and split the monolithic service classes into
   a clean domain/adapter layout (P1).
3. **Complete the vision** — make the ULS real: pedagogical strategy layer,
   cognitive-load guardrails, and a validated Nova handover (P2).

---

## 2. What It Is vs. What It Does (the gap)

| `vision_v2.md` / `HANDOVER_PROTOCOL.md` promises | Code reality |
| --- | --- |
| Outputs a machine-readable **ULS JSON** for Nova | Outputs tagged markdown; "ULS" modal is `JSON.stringify` of 3 fields |
| **Instructional Strategy Layer** — assigns Merrill modes, cognitive verbs | `pedagogicalMode` is passed through the API but **never used** in the prompt; hardcoded `'Direct Instruction'` |
| **Intelligent Modality Matcher** (marked *COMPLETED*) | Logic exists **only in `modalityMapper.test.ts`**; the app uses `m.delivery_method \|\| 'TEXT'` |
| **Cognitive Load Guardrail** blocks handover at >8.5 | `cognitiveLoadScore` is parsed from text, displayed in a HUD, **gates nothing** |
| **Triple-Pass Integrity Shield** | Retrieve → distill → synthesize → audit exists, but audit scores fall back to `0`/`5` silently on parse failure |
| `types/` dir for "Strict TypeScript definitions" | Directory does not exist; types are duplicated across two service files |
| Handover trigger on `completed → architecting` | Not implemented |

**Conclusion:** the revamp is not cosmetic. The engine needs to produce a real,
validated schema and actually apply the pedagogy the vision sells.

---

## 3. Critical Findings (prioritized)

### P0 — Correctness / reproducibility (the engine is silently broken)

1. **DB schema drift — migrations do not match the code.**
   - `match_knowledge()` in `20260422_create_knowledge_vault.sql` takes **4 params**
     `(query_embedding, match_threshold, match_count, p_blueprint_id)`.
     `instructionalArchitectService.retrieveGroundingContext()` calls it with
     **5** — adding `p_module_id`. Against the committed schema this RPC **fails**.
   - `content_type` CHECK allows `('text','image','video','pdf')` — but the code
     ingests **`docx`**. Inserting a docx row violates the constraint.
   - Code writes a **`user_id`** column (commit `dbcff0f`) that the migration
     never adds.
   - The **`visual_generations`** table — written by `api/architect/draft` and
     read by `ScriptDraftingWorkspace` — has **no migration at all**.
   - *Impact:* the repo is not reproducible. A fresh Supabase project cannot run
     this code. Production has drifted away from version control.

2. **No vector index — every retrieval is a sequential scan.**
   `README`/`implementation-plan.md` claim "HNSW indexing for sub-second
   retrieval." The migration creates **no index** and the comment admits HNSW is
   "limited to 2000 dimensions." Confirmed against pgvector docs: the `vector`
   type caps HNSW at 2,000 dims; **3,072-dim vectors must be indexed via a
   `halfvec` cast** — and the *query* must cast too or the planner ignores the
   index. Today retrieval is O(rows) and will not scale past a few hundred chunks.

3. **Embedding config is inconsistent between write and read.**
   Ingestion (`embedMany`/`embed`) passes
   `providerOptions: { google: { outputDimensionality: 3072 } }`. The Architect's
   query embedding in `retrieveGroundingContext()` **omits it**. If the model's
   default dimensionality ≠ 3072, the query vector and stored vectors are
   dimension-mismatched and `<=>` returns garbage or errors.

4. **Embedding model name is suspect.** Code uses `gemini-embedding-2`. The
   migration comment and `SYSTEM_DESIGN.md` say `gemini-embedding-001` /
   `text-embedding-004`. Google's current text-embedding model is
   `gemini-embedding-001` (configurable 768/1536/3072 dims). **Verify
   `gemini-embedding-2` resolves** — if not, all ingestion silently fails.
   *(Note: the chat model IDs `gemini-3.1-pro-preview` and `gemini-3-flash-preview`
   are confirmed valid and current — no change needed there.)*

5. **Retrieval threshold logic is inverted.**
   `match_threshold: strictModule ? 0.3 : 0.75`. The strict, module-scoped pass
   uses the *loose* 0.3 cutoff; the broad fallback uses the *strict* 0.75 cutoff —
   so the fallback returns **fewer** results than the primary. Grounding quality
   is effectively random.

6. **Long pipeline on a default serverless budget.** `api/architect/draft`
   exports no `maxDuration` / `runtime`. One request runs: 1 embedding + a DB RPC
   (+ fallback query) + 3 sequential `generateText` calls (distill, synthesize,
   audit) + N sequential insert-then-`fetch` visual dispatches. This will time
   out on Vercel under realistic input.

### P1 — Architecture / maintainability

7. **Free-text markdown as the data contract.** The Architect emits
   `[VISUAL]`/`[NARRATION]`/`[VISUAL_PROMPT]`… tags; `api/architect/draft` does
   **regex string-surgery** to inject `[VISUAL:uuid]`; `ScriptDraftingWorkspace`
   re-parses it line-by-line with fallback hacks (`auto-scene-init`,
   `intro-buffer`). Three fragile layers where one Zod schema + `streamObject`
   would do. The ingest service *already* uses `generateObject` — the pattern is
   in the codebase, just not applied to the core output.

8. **Service classes mix four concerns.** `InstructionalArchitectService` holds
   DB access, Gemini calls, prompt strings, and parsing. No ports/adapters, so
   none of it is unit-testable without live infrastructure.

9. **Duplicated, divergent types.** `ContentType` and `IngestAsset` are declared
   twice (`instructionalArchitectService.ts`, `knowledgeIngestService.ts`) with
   different shapes (`blueprintId: string` vs `string | null`; `userId` present
   in one). No shared `src/types/`.

10. **Tests don't test the product.** `modalityMapper.test.ts` and
    `visualEngine.test.ts` test **inline copies** of logic, not imported code —
    there is no `modalityMapper.ts`/`visualEngine.ts`. `visualEngine.test.ts` is
    additionally **broken**: it asserts the prompt equals a "neural network in
    deep space" string that does not appear in its own `MOCK_SCRIPT`. Real
    coverage of the generation pipeline ≈ 0%.

11. **Dead / incorrect logic.**
    - `hallucinationFlag` triggers on `!draft.includes('INSUFFICIENT_DOCUMENTATION')`,
      but the prompt never tells the model to emit that token (it uses
      `[DATA_DEFICIT]`). When data is sparse the flag is essentially always set.
    - `chunkText(text, 1000)` actually produces **4000-char** chunks (`size * 4`)
      with **zero overlap** — facts spanning a boundary are split. Misleading name,
      no token-awareness, no overlap.
    - `ingestDocument` silently truncates at `fullText.substring(0, 50000)`.

### P2 — Security & resilience

12. **Authorization gaps.** `api/architect/draft` and
    `api/ingest/harvest-blueprint` perform **no auth check** and no ownership
    check on `blueprintId`. RAG retrieval uses the **admin client (RLS bypass)**.
    A caller can draft scripts grounded on, or harvest, another tenant's vault by
    supplying a `blueprintId`. Every generation route must verify
    `auth.getUser()` and that the user owns the blueprint *before* touching the
    admin client.

13. **No retry / timeout on Gemini calls.** A single transient 429/503 throws and
    crashes the whole pipeline. No backoff, no `abortSignal`.

14. **Silent failure everywhere.** Visual-dispatch errors are swallowed
    (`.catch(console.error)`); audit-score regex failures default to `0`/`5` and
    are shown to the user as a real "Grounding/Cognitive" reading. `console.log`
    is the only observability — no request IDs, no structured logs.

---

## 4. Target Architecture

Apply a **hexagonal (ports-and-adapters)** split so the pedagogy is testable
without Gemini or Supabase, and the markdown contract disappears.

```
src/
├── types/                       # NEW — single source of truth
│   ├── uls.ts                   # Universal Learning Schema (Zod + inferred TS)
│   ├── knowledge.ts             # KnowledgeChunk, IngestAsset, ContentType
│   └── architect.ts             # ArchitecturalNode, ScriptOutput, AuditResult
│
├── domain/                      # NEW — pure, no I/O, 100% unit-tested
│   ├── pedagogy/
│   │   ├── modalityMapper.ts    # promote the test-only logic to real code
│   │   ├── cognitiveLoad.ts     # Miller 7±2 chunking + CLG gate
│   │   └── merrillStrategy.ts   # mode + cognitive-verb assignment
│   ├── chunking.ts              # token-aware chunking WITH overlap
│   └── uls/
│       ├── schema.ts            # the ULS Zod schema
│       └── builder.ts           # ScriptOutput[] -> validated ULS
│
├── ports/                       # NEW — interfaces the domain depends on
│   ├── LlmPort.ts               # generate/stream/embed (no provider leak)
│   └── VaultPort.ts             # retrieve/insert knowledge chunks
│
├── adapters/                    # NEW — implements the ports
│   ├── gemini/                  # @ai-sdk/google; model IDs centralized here
│   └── supabase/                # vault repo, RLS-aware + admin variants
│
├── lib/services/                # orchestration only — wires domain + adapters
│   ├── instructionalArchitectService.ts
│   └── knowledgeIngestService.ts
│
└── app/api/                     # thin: auth -> Zod validate -> service -> stream
```

**Output contract.** Replace the tagged-markdown blob with one schema:

```ts
// types/architect.ts (sketch)
const Scene = z.object({
  id: z.string(),
  title: z.string(),
  narration: z.string(),
  visual: z.object({ artDirection: z.string(), generationPrompt: z.string() }),
  activity: z.string().nullable(),
  branching: z.string().nullable(),
  speakerNotes: z.string().nullable(),
  citations: z.array(z.string()),       // Fact_IDs
  dataDeficits: z.array(z.string()),    // explicit gaps, replaces [DATA_DEFICIT]
});
const NodeScript = z.object({
  nodeTitle: z.string(),
  pedagogicalMode: z.enum(['TASK_CENTERED','ACTIVATION','DEMONSTRATION','APPLICATION','INTEGRATION']),
  cognitiveVerb: z.string(),
  scaffolding: z.enum(['LOW','MEDIUM','HIGH']),
  scenes: z.array(Scene),
});
```

This deletes the `ScriptDraftingWorkspace` regex parser **and** the
`api/architect/draft` string-surgery. `visualId` becomes a real field, not a
substring injected back into prose. Stream it with `streamObject` /
`streamText({ output: Output.object(...) })` so the workspace renders scenes
progressively and the route stays within `maxDuration`.

---

## 5. Phased Implementation Plan

### Phase 0 — Stabilize (P0, ~1–2 days, no behaviour change)

- [ ] **Reconcile the schema.** Diff the live Supabase DB against
      `20260422_create_knowledge_vault.sql`. Write forward migrations capturing
      every drift: `user_id` column + RLS update; `content_type` CHECK extended
      with `'docx'`; the real `match_knowledge` signature (with module scoping);
      and a `visual_generations` migration (currently untracked entirely).
- [ ] **Add the vector index.** Migration:
      `CREATE INDEX ON knowledge_vault USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);`
      and rewrite `match_knowledge` to compare with the matching
      `embedding::halfvec(3072) <=> $1::halfvec(3072)` cast so the planner uses it.
- [ ] **Pin embedding config.** Centralize the model ID + `outputDimensionality:
      3072` in one adapter constant; verify `gemini-embedding-2` resolves (fall
      back to `gemini-embedding-001` if not). Apply the *same* options to the
      Architect's query `embed()` call.
- [ ] **Fix the threshold inversion** — strict pass strict, fallback loose — or
      drop dual thresholds for one tuned value + `match_count`.
- [ ] **Budget the route.** Add `export const runtime = 'nodejs'` and
      `export const maxDuration` to `api/architect/draft` and `api/ingest`.
- [ ] **Gate:** a fresh Supabase project provisioned only from `migrations/`
      runs a full draft end-to-end.

### Phase 1 — Schema-first generation (P1, ~3–5 days)

- [ ] Create `src/types/` and delete the duplicated `ContentType`/`IngestAsset`.
- [ ] Define the `NodeScript`/`Scene` Zod schema (§4).
- [ ] Rewrite `draftNodeScript` to emit structured output via `streamObject` /
      `Output.object`. The "PASS 3 synthesis" prompt keeps the pedagogy rules but
      drops the tag-formatting rules — the schema enforces structure.
- [ ] Convert `extractAtomicFacts` and `performAdversarialAudit` to
      `generateObject` (typed `factLedger[]` and `{score, cognitiveLoad,
      hallucinated, critique}`) — kills the brittle `SCORE:` regex and the `0/5`
      silent defaults.
- [ ] Rewrite `ScriptDraftingWorkspace` to consume `Scene[]` directly; delete the
      multi-pass line parser.
- [ ] Move visual dispatch out of the response path: persist `visualId` on each
      `Scene`, enqueue generation jobs, let the existing Realtime subscription
      hydrate URLs. No more regex surgery on the script.
- [ ] Extract `domain/pedagogy/modalityMapper.ts` from the test file; wire it
      into `constellation/page.tsx` so the "Intelligent Modality Matcher" is
      actually real. Repoint `modalityMapper.test.ts` at the imported function;
      fix the broken assertions in `visualEngine.test.ts`.

### Phase 2 — Hexagonal refactor + resilience (P1/P2, ~3–4 days)

- [ ] Introduce `ports/` (`LlmPort`, `VaultPort`) and `adapters/`; services
      become orchestration only.
- [ ] Add auth + ownership checks to **every** generation route before any admin
      client use; keep RLS-bypass strictly server-side and post-authorization.
- [ ] Wrap all Gemini calls with retry + exponential backoff + `abortSignal`
      (tied to `maxDuration`).
- [ ] Token-aware `chunking.ts` with overlap; remove the 50k-char truncation
      (chunk-then-segment large docs instead).
- [ ] Structured logging with a per-request correlation ID; surface real audit
      failures instead of defaulting scores.
- [ ] Real tests against imported domain code: `modalityMapper`, `cognitiveLoad`
      chunking, ULS builder, `uls/schema` round-trips. Target ≥80% on `domain/`.

### Phase 3 — Complete the vision: real ULS handover (P2, ~4–6 days)

- [ ] Implement `domain/uls/schema.ts` matching `HANDOVER_PROTOCOL.md` §4.
- [ ] Implement the **Instructional Strategy Layer**: actually use
      `pedagogicalMode` + assign cognitive verbs / scaffolding (Merrill + Bloom)
      in the prompt and schema.
- [ ] Implement the **Cognitive Load Guardrail**: block handover when a node's
      CLG score exceeds the threshold (`HANDOVER_PROTOCOL` says 8.5); offer
      auto-chunking via `cognitiveLoad.ts`.
- [ ] Build `uls/builder.ts` → assemble validated ULS from all node scripts;
      make the "View Handover Schema" modal render the **real** ULS.
- [ ] Implement the `completed → architecting` status transition and a validated
      Nova export endpoint (Zod-checked before commit).
- [ ] Update `README.md`, `SYSTEM_DESIGN.md`, `implementation-plan.md` to match
      reality (embedding model, indexing, ULS status).

---

## 6. Risks & Sequencing Notes

- **Phase 0 is blocking.** Until the schema is reconciled, every later phase
  builds on sand and cannot be tested reproducibly. Do it first, alone.
- **Schema migration to `halfvec`** changes the query path — ship the index
  migration and the `match_knowledge` rewrite together, then re-verify recall.
- **The structured-output switch (Phase 1) is the highest-leverage change** but
  touches the Architect, the draft route, and the workspace at once — land it
  behind a flag or on a branch with the e2e Playwright test green.
- **Confirm `gemini-embedding-2`** before Phase 0 sign-off; an invalid embedding
  model means ingestion has been failing silently and the vault may be empty.
- Estimated total: **~15–22 working days**, Phase 0 → 3 in order.
```
