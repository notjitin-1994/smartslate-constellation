# Constellation - AI-Powered Instructional Design Platform

## Overview

Constellation is an intelligent instructional design tool that transforms multi-media content into comprehensive learning experiences. Part of the SmartSlate ecosystem, Constellation leverages AI to analyze your content and automatically generate professional instructional design artifacts.

## Features

### 🌟 Core Capabilities

1. **Multi-Media Content Support**
   - Documents (PDF, Word, etc.)
   - Videos
   - Audio files
   - Images
   - Text content
   - Web links
   - Any digital media that can be analyzed by AI

2. **AI-Powered Analysis**
   - Automatic content analysis and summarization
   - Key concept extraction
   - Learning objective identification
   - Difficulty level assessment
   - Duration estimation

3. **Automated Artifact Generation**
   - **Storyboards**: Detailed slide-by-slide course structure with visuals and narration
   - **Voiceover Scripts**: Professional narration scripts with tone and pacing guidance
   - **Color Palettes**: Visual design systems tailored to your content
   - **Sound Inspirations**: Audio design recommendations including mood, genre, and tempo
   - **Learning Objectives**: Clear, measurable learning outcomes
   - **Assessment Questions**: Evaluation materials aligned with objectives
   - **Interaction Designs**: Engaging interactive elements for learner participation
   - **Course Outlines**: Structured learning paths
   - **Lesson Plans**: Detailed teaching guides
   - **Engagement Strategies**: Methods to maintain learner interest
   - **Accessibility Guides**: Inclusive design recommendations
   - **Implementation Notes**: Practical deployment guidance

### 🚀 Workflow Options

#### Begin with a Starmap
- Start with pre-designed templates from Polaris
- Industry best practices built-in
- Faster time to completion
- Perfect for standard training scenarios

#### Begin from Scratch
- Complete creative freedom
- Fully customizable to unique requirements
- AI assists at every step
- Ideal for specialized or innovative content

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account for database and authentication
- OpenAI API key (optional, for enhanced AI features)

### Installation

1. **Clone the repository**
```bash
git clone [repository-url]
cd smartslate-constellation
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp env.example .env
```

Edit `.env` with your credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=http://localhost:5173
VITE_OPENAI_API_KEY=your_openai_api_key (optional)
SESSION_JWT_SECRET=your_jwt_secret
```

4. **Set up the database**

Run the Supabase migrations:
```sql
-- Execute the contents of supabase/schema.sql in your Supabase SQL editor
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Guide

### Creating Your First Constellation

1. **Login to the Application**
   - Navigate to the portal
   - Click on "Constellation" in the Solara section

2. **Access the Dashboard**
   - View existing constellations
   - Click "Create New Constellation"

3. **Choose Your Starting Point**
   - **Begin with a Starmap**: Browse and select from pre-designed templates
   - **Begin from Scratch**: Start with a blank canvas

4. **Add Your Content**
   - Upload files or paste content
   - Provide context for each piece of content
   - Support for multiple media types in a single constellation

5. **Generate Artifacts**
   - Once all content is added, click "Generate Artifacts with AI"
   - AI analyzes your content and creates comprehensive instructional materials
   - Review and download generated artifacts

### Managing Constellations

- **View**: Click on any constellation to see details and artifacts
- **Edit**: Add more content or update existing items
- **Delete**: Remove constellations you no longer need
- **Export**: Download artifacts for use in your LMS or training platform

## Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI API / Custom LLM Service
- **Build Tool**: Vite

### Database Schema

#### Main Tables
- `constellations`: Core constellation data and metadata
- `media_items`: Uploaded content and AI analysis
- `learning_artifacts`: Generated instructional materials
- `starmaps`: Shared templates from Polaris

### Project Structure
```
src/
├── pages/constellation/        # Constellation page components
│   ├── DashboardPage.tsx      # Main dashboard
│   ├── CreateConstellationPage.tsx
│   ├── StarmapSelectPage.tsx  
│   ├── ConstellationEditorPage.tsx
│   └── ConstellationViewPage.tsx
├── services/                   # Business logic
│   ├── constellationService.ts
│   └── llmService.ts
├── types/                      # TypeScript definitions
│   └── constellation.ts
└── router/                     # Application routing
```

## Integration with SmartSlate Ecosystem

### Polaris Integration
- Fetch Starmaps from `polaris.smartslate.io`
- Shared database tables for template access
- Cross-domain authentication via SmartSlate SSO

### Navigation Flow
1. User logs into `app.smartslate.io`
2. Clicks "Constellation" in sidebar
3. Navigates to `constellation.smartslate.io` (or dashboard route)
4. Full access to Constellation features

## API Endpoints

### Constellation Service
- `getUserConstellations()`: Fetch user's constellations
- `getConstellation(id)`: Get single constellation with details
- `createConstellation()`: Create new constellation
- `updateConstellation()`: Update existing constellation
- `deleteConstellation()`: Remove constellation
- `addMediaItem()`: Add content to constellation
- `addArtifact()`: Save generated artifact
- `fetchStarmaps()`: Get available templates
- `uploadFile()`: Upload media files

### LLM Service
- `analyzeMediaItem()`: AI content analysis
- `generateStoryboard()`: Create storyboard artifact
- `generateVoiceoverScript()`: Create narration script
- `generateColorPalette()`: Design color system
- `generateSoundInspirations()`: Audio recommendations
- `generateAllArtifacts()`: Batch artifact generation

## Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Environment Variables (Production)
Set these in your Vercel/hosting dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`
- `VITE_OPENAI_API_KEY`
- `SESSION_JWT_SECRET`

## Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced AI model selection
- [ ] Export to SCORM/xAPI formats
- [ ] Integration with popular LMS platforms
- [ ] Mobile application
- [ ] Offline mode support
- [ ] Version control for constellations
- [ ] Team workspace management
- [ ] Advanced analytics and insights
- [ ] Custom artifact templates

## Support

For issues, questions, or contributions, please contact the SmartSlate development team.

## License

Part of the SmartSlate platform. All rights reserved.
