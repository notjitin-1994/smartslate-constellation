import { test, expect } from '@playwright/test';

const BLUEPRINT_ID = '9ed8d030-f189-4cfb-9713-cafd113da263';

const MOCK_BLUEPRINT = {
  id: BLUEPRINT_ID,
  title: 'E2E Test Blueprint',
  user_id: 'mock-user',
  blueprint_json: {
    executive_summary: { content: 'Strategic goals for E2E testing.' },
    content_outline: {
      modules: [
        { module_id: 'NODE_01', title: 'Module 1', description: 'Test Module', delivery_method: 'Video Lectures' },
      ],
    },
  },
};

test.describe('Knowledge Ingestion E2E', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-test-bypass': 'true' });
  });

  test('vault page loads with correct heading and upload area', async ({ page }) => {
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

    // Main heading
    await expect(page.locator('h1:has-text("Knowledge Vault")')).toBeVisible({ timeout: 15000 });

    // Upload drop-zone
    await expect(page.locator('text=Ingest Course Assets')).toBeVisible({ timeout: 10000 });

    // Fact Ledger section
    await expect(page.locator('text=Course Fact Ledger')).toBeVisible({ timeout: 10000 });
  });

  test('file upload triggers batch ingest button', async ({ page }) => {
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BLUEPRINT) });
    });
    await page.route('**/rest/v1/knowledge_vault*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/rpc/match_knowledge*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/api/ingest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { count: 3, contextHeader: 'Test SOP' } }),
      });
    });

    await page.goto(`/constellation/vault?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Ingest Course Assets')).toBeVisible({ timeout: 15000 });

    // Upload a file via the hidden file input inside the drop-zone
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'dummy_sop.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test SOP document with safety procedures.'),
    });

    // After a file is queued, the "Initialize Batch Ingestion" button appears
    await expect(page.locator('button:has-text("Initialize Batch Ingestion")')).toBeVisible({ timeout: 5000 });
  });

  test('ingest process shows harvesting state', async ({ page }) => {
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BLUEPRINT) });
    });
    await page.route('**/rest/v1/knowledge_vault*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/rpc/match_knowledge*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    // Slow mock so we can catch the "Harvesting" state
    await page.route('**/api/ingest', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { count: 2, contextHeader: 'SOP Manual' } }),
      });
    });

    await page.goto(`/constellation/vault?blueprintId=${BLUEPRINT_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Ingest Course Assets')).toBeVisible({ timeout: 15000 });

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'sop_manual.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Safety procedure document for E2E testing.'),
    });

    await page.locator('button:has-text("Initialize Batch Ingestion")').click();

    // Should show harvesting state during processing
    await expect(page.locator('text=Harvesting Course Data')).toBeVisible({ timeout: 5000 });
  });
});
