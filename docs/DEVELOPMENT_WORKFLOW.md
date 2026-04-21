# Smartslate Constellation Development Workflow Guide

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions

## 🛠️ Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd smartslate-constellation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
# Supabase Configuration (Sync with Polaris)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Gemini AI Configuration
GEMINI_API_KEY="your-gemini-key"
```

## 🔄 Development Process

### Agentic Development Cycle
1. **Vision Alignment**: Refer to `vision.md` for core pillars.
2. **Strategy**: Map the Polaris Handover data required for the task.
3. **Execution**: Implement surgical updates using the standard React/Next.js patterns.
4. **Validation**: Ensure architectural alignment with the Solara Learning Engine.

## 🎨 Styling Guidelines
1. **Tailwind CSS First**: Use utility classes when possible.
2. **"Deep Space" Aesthetic**: Maintain visual continuity with the Solara ecosystem.
3. **Responsive Design**: Ensure the "Constellation Canvas" works across tablet and desktop.

## 🧪 Testing Strategy
1. **Unit Tests**: Logic for script generation and asset mapping.
2. **Integration Tests**: Supabase data retrieval (Polaris Blueprints).
3. **E2E Tests**: Handover flow from Polaris to Constellation.

---\nThis guide is derived from the Smartslate Standard and adapted for the Constellation architectural bridge.
