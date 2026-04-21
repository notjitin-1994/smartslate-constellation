# Smartslate Constellation Project Structure

## 📁 Overview

This document provides a comprehensive overview of the Smartslate Constellation project structure, architecture, and organization. The project is a Next.js 15 application with Supabase integration, focusing on instructional architecture and storyboard generation.

## 🏗️ Architecture Overview

```
smartslate-constellation/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and configurations
│   └── types/                    # TypeScript type definitions
├── public/                       # Static assets
├── docs/                         # Documentation
├── package.json                  # Dependencies and scripts
└── Configuration files
```

## 📂 Directory Structure

### Root Level
- **`package.json`** - Project dependencies and scripts
- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`.env.local`** - Environment variables (not in version control)
- **`README.md`** - Project overview and setup instructions
- **`vision.md`** - Project vision and functional pillars

### Source Code (`src/`)

#### App Router (`src/app/`)
```
src/app/
├── api/                          # API routes
│   ├── architecture/             # Architecture generation endpoints
│   ├── assets/                   # Asset ingestion and mapping
│   └── storyboards/              # Storyboard generation
├── constellation/                # Constellation main interface
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
└── page.tsx                      # Landing/Handover page
```

#### Components (`src/components/`)
```
src/components/
├── architecture/                 # Architecture visualization
├── assets/                       # Asset management UI
├── storyboards/                  # Storyboard canvas and editors
├── layout/                       # Layout components
└── ui/                           # Reusable UI components
```

### Documentation (`docs/`)
```
docs/
├── COMPONENT_LIBRARY.md          # Component library guide
├── DEVELOPMENT_WORKFLOW.md       # Development process
├── PROJECT_STRUCTURE.md          # This file
└── STYLING_GUIDE.md              # Styling guidelines
```

## 🎨 Styling Architecture
- **Tailwind CSS**: Utility-first CSS framework
- **Material-UI**: Component library with custom theme
- **Glass Morphism**: Consistent glass effect across components
- **Color Palette**: "Deep Space" theme (#020C1B background, #7C69F5 accents)

---\nThis document is derived from the Smartslate Standard and should be updated as Constellation evolves.
