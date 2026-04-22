# 🚀 Implementation Plan: Phase 2 - Multi-modal Knowledge Harvesting & Architectural RAG

## 1. Overview
This plan defines the technical execution for **Phase 2: Multi-modal Knowledge Harvesting**. We are expanding the system to ingest not only text-based SOPs and manuals but also **Videos (e.g., Loom recordings)** and **Images (e.g., technical diagrams, UI screenshots)**. The goal is to create a unified semantic knowledge base where the **Generative Learning Architect (GLA)** is grounded in 100% organizational truth across all media types.

## 2. Core Objectives
*   **Unified Multi-modal Ingestion:** Map text, images, and video frames into the same vector space using `gemini-embedding-2-preview`.
*   **Zero-Hallucination Visual Grounding:** Ensure that instructional scripts are visually accurate (e.g., descriptions of UI elements match ingested screenshots).
*   **Institutional Wisdom Synthesis:** Harvest unwritten nuances from SME videos and annotated diagrams.

## 3. Technical Architecture: The "Multi-modal Integrity Shield"

### A. The Tech Stack
*   **Framework:** Next.js 15 (App Router).
*   **Database:** Supabase with `pgvector` (Vector size: 768 or 3072 for Gemini 2.0).
*   **AI Engine:** 
    *   `gemini-embedding-2-preview` for unified cross-modal embeddings.
    *   `gemini-2.0-flash` for high-speed visual analysis and video transcription.
    *   `gemini-3.1-pro` for final instructional synthesis and ULS generation.

### B. Database Schema (Supabase)
We will expand the `knowledge_vault` to support multi-modal assets:

```sql
create table public.knowledge_vault (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references public.blueprint_generator(id),
  content_type text check (content_type in ('text', 'image', 'video', 'pdf')),
  raw_content text, -- Text or auto-generated description of media
  media_url text, -- Link to Supabase Storage
  embedding vector(768), -- Unified vector for all modalities
  metadata jsonb, -- {source, timestamp_start, timestamp_end, page_number}
  created_at timestamptz default now()
);

-- Enable HNSW indexing for multi-modal retrieval
create index on knowledge_vault using hnsw (embedding vector_cosine_ops);
```

## 4. The Multi-modal Ingestion Pipeline

### Step 1: Modality-Specific Processing
*   **Videos:** Segmented into 120-second "Semantic Chunks." Each chunk is processed by Gemini-2.0-Flash to generate a transcript + visual summary.
*   **Images/Diagrams:** Processed via Gemini-2.0-Flash to generate high-fidelity technical descriptions (e.g., "Schematic showing a Type-B Pressure Valve with a red safety toggle").
*   **PDFs:** Multi-modal OCR captures both text and the spatial layout of charts/tables.

### Step 2: Unified Embedding
Every processed asset (regardless of type) is converted into a vector using `gemini-embedding-2-preview`. This allows "Cross-Modal Retrieval" (e.g., a text query finding a video clip).

## 5. The "Zero Hallucination" RAG Loop

### Pass 1: Cross-Modal Semantic Retrieval
*   Query the vault for the top 5 relevant assets (Text + Image + Video).
*   **Constraint:** Only accept assets with similarity > 0.80.

### Pass 2: Multi-modal Grounding (Visual + Textual)
*   The LLM is provided with **both** the text transcript and the **source images/video frames**.
*   **Grounding Prompt:** "You are an Instructional Architect. Describe the UI action based ONLY on the provided [IMAGE_REF]. If the image does not show the 'Save' button, do not narrate its location."

### Pass 3: The NLI Judge (Multi-modal)
*   The "Judge" pass compares the generated script against the original media. 
*   It checks for **Visual Discrepancies** (e.g., script says 'click the top right' but video shows 'bottom left'). If detected, the node is flagged for "Architect Review."

## 6. UI/UX Workflow: The "Universal Vault"

1.  **Ingest Hub:** A unified drag-and-drop zone for PDF, MP4, and PNG files.
2.  **Visual Delta:** A "Source View" alongside the "Script Editor." Clicking a sentence highlights the exact video timestamp or image region that informed it.
3.  **Grounding Status:** Nodes in the `ArchitectureCanvas` show icons indicating their grounding source: 📄 (Text), 🖼️ (Image), 🎥 (Video).

## 7. Development Milestones
*   **M1: Multi-modal Schema & Storage (4 hours):** Supabase table updates and Storage bucket configuration.
*   **M2: Video/Image Processing Engine (8 hours):** Integration of Gemini-2.0 for media summarization and unified embedding.
*   **M3: Cross-Modal RAG Loop (8 hours):** Building the retrieval logic that balances text and visual context.
*   **M4: ArchitectureCanvas Visual Feedback (6 hours):** UI updates to display source citations for media.

## 8. Success Metrics
*   **Multi-modal Fidelity:** 100% of visual descriptions in scripts are grounded in ingested media.
*   **Retrieval Accuracy:** Search queries correctly identify relevant video timestamps 95% of the time.
*   **Handover Detail:** Nova receives direct links to source images for 100% of UI-related instructional nodes.
