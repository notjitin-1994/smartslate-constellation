import { test, expect } from '@playwright/test';

const BLUEPRINT_ID = 'bceb2bbd-1908-48a8-b793-084f30ec8753';

const MOCK_BLUEPRINT = {
  id: BLUEPRINT_ID,
  title: 'Interview Mastery Blueprint: Campus to Corporate',
  user_id: 'mock-user',
  blueprint_json: {
    executive_summary: { content: 'Strategic goals for corporate transition.' },
    learning_objectives: { objectives: [{ title: 'apply interview frameworks' }] },
    target_audience: {
      demographics: { roles: ['Graduate', 'Student'], experience_levels: ['Entry-level'] },
    },
    instructional_strategy: {
      modalities: [
        { type: 'Studio Video Lectures', rationale: 'High engagement.' },
        { type: 'Interactive eLearning (SCORM)', rationale: 'Skill application.' },
      ],
    },
    content_outline: {
      modules: [
        {
          module_id: 'NODE_01',
          title: 'The Corporate Mindset',
          description: 'Transitioning from student to professional.',
          delivery_method: 'Video Lectures',
        },
        {
          module_id: 'NODE_02',
          title: 'Personal Branding',
          description: 'Building a professional identity.',
          delivery_method: 'Interactive SCORM',
        },
      ],
    },
  },
};

const MOCK_DRAFT_RESULT = {
  nodeScript: {
    nodeTitle: 'The Corporate Mindset',
    pedagogicalMode: 'Direct Instruction',
    cognitiveVerb: 'explain',
    scaffolding: 'MEDIUM' as const,
    scenes: [
      {
        id: 'scene-01',
        title: 'Scene 1: The Transition',
        narration: 'Every professional journey starts with a shift in mindset. [Fact_ID: 1]',
        visual: {
          artDirection: 'Wide shot of a modern office lobby.',
          generationPrompt: 'Photorealistic wide shot of a corporate lobby, 4K.',
        },
        activity: null,
        branching: null,
        speakerNotes: 'Pause for reflection.',
        citations: ['Fact_ID: 1'],
        dataDeficits: [],
        visualId: 'vis-uuid-001',
      },
    ],
  },
  citations: ['interview_guide.pdf'],
  groundingScore: 8,
  cognitiveLoadScore: 3,
  hallucinationFlag: false,
  semanticDelta: 'All claims grounded.',
  groundingTypes: ['pdf'],
};

test.describe('Full Architectural Loop: Interview Prep', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-test-bypass': 'true' });
  });

  test('loads blueprint and Architecture Canvas heading', async ({ page }) => {
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BLUEPRINT) });
    });
    await page.route('**/rest/v1/constellation_states*', async (route) => {
      if (route.request().method() === 'GET' || route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/ingest/harvest-blueprint', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });

    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });
  });

  test('full loop: blueprint loads, draft runs, scene renders', async ({ page }) => {
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BLUEPRINT) });
    });
    await page.route('**/rest/v1/constellation_states*', async (route) => {
      if (route.request().method() === 'GET' || route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/ingest/harvest-blueprint', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.route('**/api/architect/draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_DRAFT_RESULT }),
      });
    });

    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });

    // Trigger the draft
    await page.locator('button:has-text("Map Constellation")').click();

    // Scene title from the mock should appear in the workspace
    await expect(page.locator('text=Scene 1: The Transition')).toBeVisible({ timeout: 15000 });

    // Grounding score should reflect mock value (8/10)
    await expect(page.locator('text=8/10').first()).toBeVisible({ timeout: 10000 });
  });

  test('vault page loads for the blueprint', async ({ page }) => {
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BLUEPRINT) });
    });
    await page.route('**/rest/v1/knowledge_vault*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/rpc/match_knowledge*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto(`/constellation/vault?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Knowledge Vault")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Ingest Course Assets')).toBeVisible({ timeout: 10000 });
  });
});
