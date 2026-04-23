import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Full Architectural Loop: Interview Prep', () => {
  const blueprintId = 'bceb2bbd-1908-48a8-b793-084f30ec8753';

  test.beforeEach(async ({ context }) => {
    // Use the bypass header to avoid middleware redirect
    await context.setExtraHTTPHeaders({
      'x-test-bypass': 'true'
    });
  });

  test('should map modalities, ingest document, and draft grounded script', async ({ page }) => {
    // 0. Mock Supabase Responses
    await page.route('**/rest/v1/blueprint_generator*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: blueprintId,
          title: 'Interview Mastery Blueprint: Campus to Corporate',
          blueprint_json: {
            executive_summary: { content: 'Strategic goals for corporate transition.' },
            learning_objectives: { objectives: [{ title: 'apply' }] },
            instructional_strategy: {
              modalities: [
                { type: 'Studio Video Lectures', rationale: 'High engagement.' },
                { type: 'Interactive eLearning (SCORM)', rationale: 'Skill application.' }
              ]
            },
            content_outline: { 
              modules: [
                { 
                  title: 'The Corporate Mindset & Personal Branding', 
                  delivery_method: 'Video Lectures',
                  description: 'Transitioning from student to professional.',
                  learning_activities: [{ type: 'Video', activity: 'Intro', duration: '10m' }]
                }
              ] 
            }
          }
        })
      });
    });

    // 1. Navigate to Constellation
    console.log('🚀 Navigating to Constellation with bypass...');
    await page.goto(`/constellation?blueprintId=${blueprintId}`, { waitUntil: 'networkidle' });

    // 2. Verify Modality Mapping in Sidebar
    console.log('🔍 Verifying Modality Mapping...');
    
    // Explicitly wait for "Neural Nodes" text
    const neuralNodesHeader = page.locator('text=Neural Nodes');
    await expect(neuralNodesHeader).toBeVisible({ timeout: 20000 });
    
    // Find node and check icon
    const nodeItem = page.locator('div').filter({ hasText: /^NODE_01$/ }).first();
    await expect(nodeItem).toBeVisible();
    
    // Check for the Video icon (lucide-video)
    const videoIcon = page.locator('svg.lucide-video').first();
    await expect(videoIcon).toBeVisible();
    console.log('✅ Modality correctly mapped to Video.');

    // 3. Open Knowledge Vault and Ingest
    console.log('📥 Opening Knowledge Vault...');
    await page.click('button:has-text("Open Knowledge Vault")');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(process.cwd(), 'tests/fixtures/integration_test_sop.txt'));
    
    await page.route('**/api/ingest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { count: 1, contextHeader: 'Mocked Context' } })
      });
    });

    await page.click('button:has-text("Initialize Ingest Engine")');

    // 4. Wait for Synthesizing
    await expect(page.locator('h3:has-text("Synthesizing Wisdom")')).toBeVisible();
    await page.waitForTimeout(2000); 

    // 5. Trigger Drafting
    await page.route('**/api/architect/draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          data: { 
            script: '# Module Title\n## Introduction\n**Instructor:** Hello world [Source 1].',
            citations: ['Source 1'],
            groundingScore: 9,
            hallucinationFlag: false,
            cognitiveLoadScore: 3,
            groundingTypes: ['text']
          } 
        })
      });
    });

    console.log('🎨 Drafting Modality-Aware Script...');
    const draftBtn = page.locator('button:has-text("Draft Script")');
    await expect(draftBtn).toBeVisible({ timeout: 15000 });
    await draftBtn.click();

    // 6. Verify Production Script Output
    await expect(page.locator('div:has-text("Production Script")').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('span:has-text("Verified Grounded")')).toBeVisible();
    
    console.log('🎉 E2E Full Loop Verified: SUCCESS');
  });
});
