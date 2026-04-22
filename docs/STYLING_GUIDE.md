# 🎨 Constellation "Deep Space" Styling Guide

## 1. Visual Identity
The Constellation interface represents a high-density, professional workstation. The aesthetic is **"Deep Space"**: Midnight backgrounds with vibrant neural accents and high-fidelity glassmorphism.

### Core Palette
- **Background**: `#020C1B` (The Void)
- **Primary**: `#7C69F5` (Vibrant Indigo - Interactive Elements)
- **Secondary**: `#A7DADB` (Teal Mist - Secondary Highlights)
- **Border**: `rgba(124, 105, 245, 0.15)` (Neural Glow)
- **Text Primary**: `#E2E8F0`
- **Text Secondary**: `#94A3B8`

## 2. Component Standards

### Glassmorphism Card
```tsx
const glassStyles = {
  background: 'rgba(124, 105, 245, 0.04)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(124, 105, 245, 0.15)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};
```

### MUI Grid (Modern size props)
**MANDATORY**: Use the `size` prop instead of deprecated `item` and `xs/md` props.
```tsx
<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Content />
  </Grid>
</Grid>
```

### Typography
- **Headings**: `Quicksand` (Weight 600+)
- **Body**: `Lato` or `Inter`
- **Monospace (Data/Labels)**: `JetBrains Mono` or `Roboto Mono`

## 3. Interaction Design
- **Hover Glow**: Interactive nodes should gain a 10px-20px shadow glow of their primary color on hover.
- **Micro-animations**: Use `framer-motion` for all panel transitions. Standard: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`.
- **Neural Paths**: Use secondary teal (`#A7DADB`) for "active" or "synced" status indicators.
