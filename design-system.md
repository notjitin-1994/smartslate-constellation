# 🌌 Smartslate Constellation: Design System & Visual Language

## 🎨 Visual Identity: "Deep Space Zen" (V2)
Constellation utilizing a refined, monochromatic deep-space aesthetic. Gradients are abolished in favor of sharp, high-fidelity brand accents.

### Core Color Palette
*   **Background:** `#020617` (Obsidian)
*   **Brand Accent (Primary):** `#A7DADB` (Teal) - Used for structural borders, icons, secondary text, and architectural elements.
*   **Brand Action (CTA):** `#4F46E5` (Indigo) - Reserved STRICTLY for Call-to-Action buttons and active interaction states.
*   **Text (Primary):** `#F8FAFC` (Ghost White)
*   **Text (Muted):** `#64748B` (Slate)

---

## 📐 Structural Rules
1. **Zero Gradients:** All surfaces use solid or semi-transparent fills (`rgba`). Gradients are removed to focus on "Zen" clarity.
2. **Action Isolation:** Indigo (`#4F46E5`) is never used for decoration. It is a "functional" color meaning "Click me."
3. **Architecture Mapping:** All nodes and storyboards utilize Teal (`#A7DADB`) for their visual markers.
4. **Clean Typography:** Remove all underscores (`_`) from UI text. All labels use Title Case or Sentence Case.

---

## 🧩 Visual Building Blocks

### 1. The Architectural Sidebar
*   **Visuals:** `background: rgba(13, 27, 42, 0.75)` with `#A7DADB` (Teal) borders.
*   **Interactions:** Hover states use Teal; Active states use Indigo pulse.

### 2. High-Fidelity Artifacts
*   **Visual Blocks:** `[VISUAL]`, `[NARRATION]`, and `[ACTIVITY]` are styled with solid Teal accents.
*   **Integrity Shield:** Emerald for truth; Rose for gaps; Teal for data density.

### 3. Precision Buttons
*   **Action (Indigo):** Solid `#4F46E5` with sharp corners or precise 12px radii.
*   **Utility (Teal):** Ghost style (transparent with Teal border).

---

## 🛠️ Implementation Specs (Tailwind/MUI)

```tsx
const COLORS = {
  background: '#020617',
  accent: '#A7DADB', // Primary architectural color
  action: '#4F46E5', // CTA only
};

const glassStyles = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(167, 218, 219, 0.1)', // Teal border
};
```
