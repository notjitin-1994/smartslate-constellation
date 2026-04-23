# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ingestion.spec.ts >> Knowledge Ingestion E2E >> should open vault, upload file, and show progress
- Location: tests\e2e\ingestion.spec.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Open Knowledge Vault")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button:has-text("Open Knowledge Vault")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic:
        - img
      - generic [ref=e8]:
        - img "Architectural context" [ref=e10]
        - generic [ref=e12]:
          - generic [ref=e13]:
            - heading "Design the Future of Learning" [level=1] [ref=e14]
            - paragraph [ref=e15]: Connect your vision to the Architectural Bridge. Automated workflows for the modern creator.
          - generic [ref=e16]:
            - generic [ref=e17]:
              - img [ref=e19]
              - generic [ref=e21]:
                - heading "ScriptGen Intelligence" [level=3] [ref=e22]
                - paragraph [ref=e23]: Generate production-ready scripts from core learning objectives instantly.
            - generic [ref=e24]:
              - img [ref=e26]
              - generic [ref=e28]:
                - heading "Automated Storyboarding" [level=3] [ref=e29]
                - paragraph [ref=e30]: Translate concepts into visual sequences with precision-mapped assets.
            - generic [ref=e31]:
              - img [ref=e33]
              - generic [ref=e35]:
                - heading "Strategic Blueprinting" [level=3] [ref=e36]
                - paragraph [ref=e37]: Map cognitive trajectories through high-fidelity editorial frameworks.
      - generic [ref=e39]:
        - generic [ref=e40]:
          - heading "System Authentication" [level=2] [ref=e41]
          - paragraph [ref=e42]: Enter credentials to synchronize
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]: Email Identity
              - generic [ref=e47]:
                - img [ref=e49]
                - textbox "Email Identity" [ref=e52]:
                  - /placeholder: identity@smartslate.com
                - group:
                  - generic: Email Identity
            - generic [ref=e53]:
              - generic [ref=e54]: Access Key
              - generic [ref=e55]:
                - img [ref=e57]
                - textbox "Access Key" [ref=e60]:
                  - /placeholder: ••••••••
                - button [ref=e62] [cursor=pointer]:
                  - img [ref=e63]
                - group:
                  - generic: Access Key
          - button "Recover Access Key" [ref=e67] [cursor=pointer]
          - button "Initialize Handover" [ref=e68] [cursor=pointer]:
            - text: Initialize Handover
            - img [ref=e70]
          - generic [ref=e74]: OR
          - button "Sync with Google" [ref=e76] [cursor=pointer]:
            - img [ref=e77]
            - text: Sync with Google
        - generic [ref=e82]:
          - text: New to Constellation?
          - button "Request Deployment" [ref=e83] [cursor=pointer]
      - generic [ref=e85]:
        - generic [ref=e86]:
          - generic [ref=e87]: Status
          - generic [ref=e90]: PROTOCOL_READY
        - generic [ref=e92]:
          - generic [ref=e93]: Version
          - generic [ref=e94]: CONSTELLATION.4.0
  - button "Open Next.js Dev Tools" [ref=e100] [cursor=pointer]:
    - img [ref=e101]
  - alert [ref=e104]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | 
  4  | test.describe('Knowledge Ingestion E2E', () => {
  5  |   const blueprintId = '9ed8d030-f189-4cfb-9713-cafd113da263';
  6  | 
  7  |   test('should open vault, upload file, and show progress', async ({ page }) => {
  8  |     // 0. Mock Supabase Responses to bypass RLS and Auth for testing
  9  |     await page.route('**/rest/v1/blueprint_generator*', async (route) => {
  10 |       await route.fulfill({
  11 |         status: 200,
  12 |         contentType: 'application/json',
  13 |         body: JSON.stringify({
  14 |           id: blueprintId,
  15 |           title: 'E2E Test Blueprint',
  16 |           blueprint_json: {
  17 |             executive_summary: { content: 'Strategic goals for E2E testing.' },
  18 |             content_outline: { modules: [{ title: 'Module 1', description: 'Test Module' }] }
  19 |           }
  20 |         })
  21 |       });
  22 |     });
  23 | 
  24 |     // Navigate to the constellation page
  25 |     await page.goto(`/constellation?blueprintId=${blueprintId}`, { waitUntil: 'networkidle' });
  26 | 
  27 |     // 1. Open Knowledge Vault
  28 |     const openVaultBtn = page.locator('button:has-text("Open Knowledge Vault")');
> 29 |     await expect(openVaultBtn).toBeVisible({ timeout: 10000 });
     |                                ^ Error: expect(locator).toBeVisible() failed
  30 |     await openVaultBtn.click();
  31 | 
  32 |     // 2. Verify Modal is open
  33 |     await expect(page.getByText(/Ground your architecture with multi-modal assets/i)).toBeVisible();
  34 | 
  35 |     // 3. Upload a file
  36 |     const filePath = path.join(process.cwd(), 'tests/fixtures/dummy_sop.txt');
  37 |     const fileChooserPromise = page.waitForEvent('filechooser');
  38 |     await page.getByText(/Click to upload/i).click();
  39 |     const fileChooser = await fileChooserPromise;
  40 |     await fileChooser.setFiles(filePath);
  41 | 
  42 |     // 4. Verify file is in the list
  43 |     await expect(page.getByText('dummy_sop.txt')).toBeVisible();
  44 | 
  45 |     // 5. Initialize Ingest Engine
  46 |     const initializeBtn = page.getByRole('button', { name: /Initialize Ingest Engine/i });
  47 |     await initializeBtn.click();
  48 | 
  49 |     // 6. Verify "Synthesizing Wisdom" state
  50 |     await expect(page.getByText(/Synthesizing Wisdom/i)).toBeVisible();
  51 | 
  52 |     // 7. Wait for completion (look for the checkmark icon or 100%)
  53 |     await page.waitForSelector('text=100%', { timeout: 30000 });
  54 |     
  55 |     // 8. Close modal
  56 |     await page.getByRole('button').filter({ has: page.locator('svg[class*="lucide-x"]') }).first().click();
  57 | 
  58 |     // 9. Verify Grounding Status changed in the node (optional visual check)
  59 |     // For now, just ensure modal closes without error
  60 |     await expect(page.getByText(/Knowledge Vault/i)).not.toBeVisible();
  61 |     
  62 |     console.log('✅ E2E Ingestion Test Passed');
  63 |   });
  64 | });
  65 | 
```