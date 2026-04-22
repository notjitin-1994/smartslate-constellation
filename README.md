# 🌌 Smartslate Constellation: The Architectural Bridge

**Constellation** is the second core engine of the Solara Learning ecosystem. It serves as the **"Architectural Bridge"**, transforming the strategic intent captured in **Polaris** blueprints into production-ready instructional architecture using **Agentic RAG** and automated storyboarding.

---

## 🚀 Live Environment
**Production**: [https://constellation.smartslate.io](https://constellation.smartslate.io)

---

## 🏗️ Core Pillars (The Mission)
1.  **Polaris Data Bridge**: Seamless ingestion of strategic blueprints (Objectives, Personas, High-level Modules).
2.  **Asset Ingest Engine**: Grounding instructional design in real-world organizational data (SOPs, PDFs, Manuals) via Vector Search.
3.  **Instructional Architect**: Automated script drafting, scene-by-scene storyboarding, and interaction mapping.
4.  **The Nexus Handover**: Exporting "Neural Blueprints" to **Nova** (Content Creation) and **Spectrum** (LMS Delivery).

---

## 🛠️ Technical Stack
- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router)
- **UI Library**: [MUI 7](https://mui.com/) (using Grid v2 and modern size props)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, SSR)
- **AI**: [Google Gemini 3.1 Pro](https://ai.google.dev/)
- **Vector**: Supabase Vector (pgvector) for organizational grounding.

---

## 📂 System Architecture
Refer to [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) for a deep dive into the RAG pipeline and Data Bridge logic.

### Directory Structure
```text
src/
├── app/                  # App Router: /handover, /constellation, /assets
├── components/           # UI: ArchitectureCanvas, BlueprintGrid, Sidebar
├── lib/                  # Services: supabase.ts, data-bridge.ts
└── types/                # Strict TypeScript definitions
```

---

## 🛠️ Development Setup

### 1. Requirements
- Node.js 18+
- Supabase Project (Shared with Polaris)

### 2. Environment (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
GEMINI_API_KEY="your-api-key"
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
