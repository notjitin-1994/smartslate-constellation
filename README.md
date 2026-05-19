# 🌌 Smartslate Constellation: The Architectural Bridge

**Constellation** is the second core engine of the Solara Learning ecosystem. It serves as the **"Architectural Bridge"**, transforming the strategic intent captured in **Polaris** blueprints into production-ready instructional architecture using **Frontier RAG** and automated storyboarding.

---

## 🚀 Live Environment
**Production**: [https://constellation.smartslate.io](https://constellation.smartslate.io)

---

## 🏗️ Core Pillars (The Mission)
1.  **Zen Architecture Workspace**: A world-class, immersive environment for focused instructional design and script drafting.
2.  **Intelligent Modality Matcher**: Automated mapping of modules to the optimal delivery method (Video, SCORM, Case Study) based on Polaris strategic DNA.
3.  **Dual-Persistence Sync Engine**: Real-time synchronization between Local Storage and Supabase ensures zero-loss of instructional work across devices.
4.  **Triple-Pass Integrity Shield**: Rigid grounding protocol that enforces zero-leakage, ensures content is derived *only* from user data, and identifies descriptive gaps.

---

## 🛠️ Technical Stack
- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router)
- **UI Library**: [MUI 7](https://mui.com/) & [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Formatting**: [React Markdown](https://reactmarkdown.com/) with **GFM** and **Rehype-Raw** for premium data rendering.
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Real-time, Auth, SSR)
- **AI Frontier**: [Google Gemini 3.1 Pro & 3.0 Flash](https://ai.google.dev/) (2026 Edition)
- **AI SDK**: [Vercel AI SDK v6](https://sdk.vercel.ai/) — schema-first `generateObject` throughout
- **Vector Engine**: `gemini-embedding-001` (3072-dim vectors, HNSW via `halfvec` cast)
- **Pedagogy Layer**: Merrill's First Principles + Bloom's Taxonomy — resolved per-node at synthesis time

---

## 📂 System Architecture
Refer to [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) for a deep dive into the RAG pipeline and Data Bridge logic.

### Directory Structure
```text
src/
├── app/                  # App Router: /constellation, /api/architect, /api/ingest
├── components/           # UI: ScriptDraftingWorkspace, KnowledgeVaultModal, Sidebar
├── domain/               # Pure domain logic — pedagogy, ULS schema, builder
│   ├── pedagogy/         # merrillStrategy.ts, cognitiveLoad.ts
│   └── uls/              # schema.ts (Zod), builder.ts (assembles ULS from DraftResults)
├── ports/                # LlmPort, VaultPort interfaces (hexagonal boundary)
├── adapters/             # GeminiLlmAdapter, SupabaseVaultAdapter
├── lib/                  # Services, hooks, utilities: retry, chunking, logger, routeAuth
└── types/                # Shared TS types: architect.ts, knowledge.ts
```

---

## 🛠️ Development Setup

### 1. Requirements
- Node.js 20+
- Supabase Project (Shared with Polaris)

### 2. Environment (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
```

### 3. Installation
```bash
npm install
npm run dev
```

---

## 📜 Legal & Vision
- **Vision**: [vision.md](./vision.md)
- **License**: Proprietary (Smartslate Ecosystem)
