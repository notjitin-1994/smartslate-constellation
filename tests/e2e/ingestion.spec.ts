import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Knowledge Ingestion E2E', () => {
  const blueprintId = '9ed8d030-f189-4cfb-9713-cafd113da263';

  test('should open vault, upload file, and show progress', async ({ page }) => {
    // 0. Mock Supabase Responses to bypass RLS and Auth for testing
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: blueprintId,
          title: 'E2E Test Blueprint',
          blueprint_json: {
            executive_summary: { content: 'Strategic goals for E2E testing.' },
            content_outline: { modules: [{ title: 'Module 1', description: 'Test Module' }] }
          }
        })
      });
    });

    // Navigate to the constellation page
    await page.goto(`/constellation?blueprintId=${blueprintId}`, { waitUntil: 'networkidle' });

    // 1. Open Knowledge Vault
    const openVaultBtn = page.locator('button:has-text("Open Knowledge Vault")');
    await expect(openVaultBtn).toBeVisible({ timeout: 10000 });
    await openVaultBtn.click();

    // 2. Verify Modal is open
    await expect(page.getByText(/Ground your architecture with multi-modal assets/i)).toBeVisible();

    // 3. Upload a file
    const filePath = path.join(process.cwd(), 'tests/fixtures/dummy_sop.txt');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Click to upload/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    // 4. Verify file is in the list
    await expect(page.getByText('dummy_sop.txt')).toBeVisible();

    // 5. Initialize Ingest Engine
    const initializeBtn = page.getByRole('button', { name: /Initialize Ingest Engine/i });
    await initializeBtn.click();

    // 6. Verify "Synthesizing Wisdom" state
    await expect(page.getByText(/Synthesizing Wisdom/i)).toBeVisible();

    // 7. Wait for completion (look for the checkmark icon or 100%)
    await page.waitForSelector('text=100%', { timeout: 30000 });
    
    // 8. Close modal
    await page.getByRole('button').filter({ has: page.locator('svg[class*="lucide-x"]') }).first().click();

    // 9. Verify Grounding Status changed in the node (optional visual check)
    // For now, just ensure modal closes without error
    await expect(page.getByText(/Knowledge Vault/i)).not.toBeVisible();
    
    console.log('✅ E2E Ingestion Test Passed');
  });
});
