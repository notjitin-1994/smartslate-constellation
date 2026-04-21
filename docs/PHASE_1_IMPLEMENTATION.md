# 🌌 Constellation Phase 1: Handover & Integration Plan

## 1. Objective
Establish the "Architectural Bridge" by creating a seamless data and UI transition from **Polaris** to **Constellation**. This phase focuses on user state detection, blueprint ingestion, and tiered access logic.

## 2. Functional Requirements: The Logic Branching

### A. User State Detection
Constellation will query the shared Supabase backend to determine the user's "Handover Profile":
1.  **Subscription Check:** Query `user_profiles.subscription_tier`.
2.  **Blueprint Check:** Query `blueprint_generator` for records where `user_id = current_user` and `status = 'completed'`.

### B. Experience Branching
| User State | UI Experience | Primary Actions |
| :--- | :--- | :--- |
| **No Polaris Sub** | **Marketing/Upsell Mode:** "Unlock Strategic Intent with Polaris" | 1. Get Polaris Subscription<br>2. Build Constellation from Scratch |
| **Has Sub + No Blueprints** | **Guidance Mode:** "Start with a Strategy" | 1. Create New Blueprint on Polaris<br>2. Build Constellation from Scratch |
| **Has Sub + Has Blueprints** | **Handover Mode:** "Select a Blueprint to Architect" | 1. Select Blueprint Card<br>2. Build Constellation from Scratch |

## 3. Tiered Access & Pricing (Polaris V4 Parity)
Constellation will inherit the exact limits and pricing structure of Polaris V4 to maintain ecosystem consistency.

### Subscription Tiers
*   **Individual:** `free`, `explorer`, `navigator`, `voyager`
*   **Team:** `crew`, `fleet`, `armada`

### Usage Limits (Blueprints/Architecture Jobs per Month)
*   `free`: 2
*   `explorer`: 5
*   `navigator`: 25
*   `voyager`: 50
*   `crew/fleet/armada`: 10-60 (per seat)

## 4. Aesthetic Strategy: "The Deep Space Bridge"

### Visual Continuity
*   **Background:** `#020C1B` (Midnight Navy)
*   **Accents:** `#7C69F5` (Vibrant Indigo) for interactive nodes.
*   **UI Pattern:** **Glassmorphism**. Transparent cards with `backdrop-blur-xl` and `border-white/10`.

### Component Design
1.  **Blueprint Selection Grid:**
    *   Cards will display Polaris metadata: Title, Created Date, Key Modules.
    *   Hover state: "Initialize Architecture" glow effect.
2.  **Marketing/Empty States:**
    *   High-fidelity SVG illustrations of a "Neural Network" being built.
    *   Premium typography using **Quicksand** (Headings) and **Lato** (Body).
    *   Clear, high-contrast primary buttons with gradient shadows.

## 5. Technical Implementation Path

### Data Layer (Supabase)
*   **Table Ingestion:** Read-only access to `blueprint_generator`.
*   **New Table:** `constellation_architectures` to store the output of the architectural phase (Storyboards, Scripts).
    *   `id`: UUID
    *   `polaris_blueprint_id`: FK (Optional for "from scratch")
    *   `architecture_json`: JSONB
    *   `status`: enum (draft, generating, completed)

### Service Layer (Agentic)
*   **HandoverService:** Logic to fetch and format Polaris data for Constellation ingestion.
*   **TierGuard:** Middleware to enforce Polaris V4 usage limits based on `user_profiles`.

## 6. Development Tools & Skills
*   **Frontend Design Skill:** To generate the "Deep Space" UI components.
*   **Supabase Best Practices Skill:** For optimized cross-table queries.
*   **Context7 MCP:** To maintain Next.js 15 / MUI 6 technical parity.

---
*Document Version: 1.0*
*Status: Strategy Finalized*
