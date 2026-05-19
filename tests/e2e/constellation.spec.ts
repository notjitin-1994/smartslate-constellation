import { test, expect } from '@playwright/test';

const BLUEPRINT_ID = 'bceb2bbd-1908-48a8-b793-084f30ec8753';

const MOCK_BLUEPRINT = {
  id: BLUEPRINT_ID,
  title: 'E2E Test Blueprint',
  user_id: 'mock-user',
  blueprint_json: {
    executive_summary: { content: 'Build safety culture in manufacturing.' },
    learning_objectives: { objectives: [{ title: 'apply safety procedures' }] },
    target_audience: {
      demographics: { roles: ['Engineer', 'Technician'], experience_levels: ['Mid-level'] },
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
          title: 'Safety Induction',
          description: 'Core PPE requirements and procedures.',
          delivery_method: 'Video Lectures',
        },
        {
          module_id: 'NODE_02',
          title: 'Hazard Recognition',
          description: 'Identifying and reporting workplace hazards.',
          delivery_method: 'Interactive SCORM',
        },
      ],
    },
  },
};

// Mock API response matching the current DraftResult shape
const MOCK_DRAFT_RESULT = {
  nodeScript: {
    nodeTitle: 'Safety Induction',
    pedagogicalMode: 'Direct Instruction',
    cognitiveVerb: 'explain',
    scaffolding: 'MEDIUM',
    scenes: [
      {
        id: 'scene-01',
        title: 'Scene 1: The Stakes',
        narration: 'Every year, thousands of workplace injuries occur. [Fact_ID: 1]',
        visual: {
          artDirection: 'Wide shot of a busy manufacturing floor.',
          generationPrompt: 'Photorealistic wide shot of manufacturing floor, 4K.',
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
  citations: ['safety_sop.pdf'],
  groundingScore: 9,
  cognitiveLoadScore: 4,
  hallucinationFlag: false,
  semanticDelta: 'All claims verified.',
  groundingTypes: ['pdf'],
};

test.describe('Constellation Architecture Canvas', () => {
  test.beforeEach(async ({ page, context }) => {
    // Allow through middleware without a real Supabase session
    await context.setExtraHTTPHeaders({ 'x-test-bypass': 'true' });

    // Mock Supabase blueprint fetch
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BLUEPRINT),
      });
    });

    // Mock constellation state
    await page.route('**/rest/v1/constellation_states*', async (route) => {
      if (route.request().method() === 'GET' || route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });

    // Mock harvest endpoint (fire-and-forget — just 200)
    await page.route('**/api/ingest/harvest-blueprint', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });

    // Mock Supabase auth
    await page.route('**/auth/v1/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'mock-user', email: 'test@test.com' } }),
      });
    });
  });

  test('page loads and shows the Architecture Canvas heading', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });
  });

  test('HUD integrity indicators are rendered', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Integrity')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Grounding')).toBeVisible();
    await expect(page.locator('text=Cognitive')).toBeVisible();
  });

  test('Map Constellation button is present and clickable', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    const mapBtn = page.locator('button:has-text("Map Constellation")');
    await expect(mapBtn).toBeVisible({ timeout: 10000 });
    await expect(mapBtn).toBeEnabled();
  });

  test('draft API response renders scenes in workspace', async ({ page }) => {
    // Mock the draft endpoint to return the structured DraftResult
    await page.route('**/api/architect/draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_DRAFT_RESULT }),
      });
    });

    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });

    // Wait for the canvas to load
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });

    // Trigger draft
    await page.locator('button:has-text("Map Constellation")').click();

    // Workspace should show the scene title
    await expect(page.locator('text=Scene 1: The Stakes')).toBeVisible({ timeout: 15000 });
  });

  test('grounding score updates in HUD after draft', async ({ page }) => {
    await page.route('**/api/architect/draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_DRAFT_RESULT }),
      });
    });

    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await page.locator('button:has-text("Map Constellation")').click();
    // After draft, grounding score should show 9
    await expect(page.locator('text=9/10').first()).toBeVisible({ timeout: 15000 });
  });

  test('ULS modal opens and shows metadata', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });

    // Wait for page to stabilize
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });

    // Click the ULS button (Code2 icon)
    const ulsBtn = page.locator('[aria-label="View Handover Schema"]');
    await expect(ulsBtn).toBeVisible({ timeout: 10000 });
    await ulsBtn.click();

    // Modal should show ULS header
    await expect(page.locator('text=Universal Learning Schema')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=V.1.0-GLA HANDOVER PACKET')).toBeVisible();
  });

  test('ULS modal shows Merrill_First_Principles pedagogical model', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });

    await page.locator('[aria-label="View Handover Schema"]').click();
    await expect(page.locator('text=Merrill_First_Principles').first()).toBeVisible({ timeout: 5000 });
  });

  test('Export to Nova button exists in ULS modal', async ({ page }) => {
    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });

    await page.locator('[aria-label="View Handover Schema"]').click();
    await expect(page.locator('button:has-text("Export to Nova")')).toBeVisible({ timeout: 5000 });
  });

  test('draft API error surfaces an alert', async ({ page }) => {
    await page.route('**/api/architect/draft', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pipeline failed' }),
      });
    });

    // Intercept the alert
    let alertMsg = '';
    page.on('dialog', async (dialog) => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await page.goto(`/constellation?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Architecture Canvas')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Map Constellation")').click();

    // Wait briefly for alert
    await page.waitForTimeout(2000);
    expect(alertMsg).toContain('Map Failed');
  });
});
