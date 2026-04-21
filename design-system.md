# 🌌 Smartslate Constellation: Design System & Visual Language

## 🎨 Visual Identity: "Deep Space"
Constellation utilizes a refined glassmorphism aesthetic characterized by high-contrast neon accents against infinite-depth backgrounds.

### Core Color Palette
*   **Background:** `#020C1B` (Midnight Navy)
*   **Primary Accent:** `#7C69F5` (Vibrant Indigo)
*   **Secondary Accent:** `#A7DADB` (Cyan - from Polaris heritage)
*   **Text (Primary):** `#E2E8F0`
*   **Text (Secondary):** `#94A3B8`

---

## 🧩 Visual Building Blocks (Vibe Components)

### 1. The Constellation Node
*   **Purpose:** Represents an interconnected learning objective or asset.
*   **Visuals:** Pulsing core with orbital data points and a radial grid background.

### 2. Glassmorphic Navigation (Sidebar)
*   **Purpose:** Vertical navigation for the architectural canvas.
*   **Visuals:** `backdrop-filter: blur(12px)` with subtle `1px` borders and active-state neon indicator.

### 3. Blueprint Selection Card
*   **Purpose:** The entry point for Polaris data.
*   **Visuals:** Compact card with "V.4-ALPHA" badge and hover-glow effects.

### 4. Handover Trigger (Premium Action)
*   **Purpose:** The primary "Call to Action" for initializing architecture.
*   **Visuals:** High-end button with atmospheric rings and a "scanning" light flare on hover.

### 5. Strategic Marketing Space
*   **Purpose:** High-fidelity editorial section for upselling/guidance.
*   **Visuals:** Wide card with a "cognitive trajectory" map and gradient text treatments.

---

## 🛠️ Implementation Specs (React/Next.js)

```tsx
const glassStyles = {
  background: 'rgba(124, 105, 245, 0.04)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(124, 105, 245, 0.15)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};
```

*Refer to the full vibe selection component for implementation details.*
