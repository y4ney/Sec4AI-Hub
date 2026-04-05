import { chromium } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import { renameSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE = 'http://127.0.0.1:5173';
const VIEWPORT = { width: 1440, height: 900 };

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  // 1. Ensure index and wiki are ready
  console.log('📑 Generating index...');
  execSync('node gen-index.mjs', { cwd: ROOT, stdio: 'inherit' });
  execSync(
    'rm -rf public/wiki && mkdir -p public/wiki && cp -r wiki/openclaw-threat-model public/wiki/ && cp -r wiki/ai-agent-threat-model public/wiki/',
    { cwd: ROOT, stdio: 'inherit' },
  );

  // 2. Start dev server
  console.log('🌐 Starting dev server...');
  const server = spawn('npx', ['vite', '--port', '5173', '--no-open'], {
    cwd: ROOT,
    stdio: 'pipe',
  });
  await delay(4000);

  // 3. Launch browser with video recording
  console.log('🎬 Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: join(ROOT, 'scripts'), size: VIEWPORT },
  });
  const page = await context.newPage();

  try {
    // === Scene 1: Landing page ===
    console.log('📹 Scene 1: Landing page');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await delay(5000); // wait for typewriter

    // === Scene 2: Navigate to AI Agent ===
    console.log('📹 Scene 2: AI Agent');
    await page.hover('.nav-menu-trigger');
    await delay(800);
    await page.locator('.nav-menu-item:text("AI Agent")').click();
    await delay(2500);

    // === Scene 3: Browse AI Agent list ===
    console.log('📹 Scene 3: AI Agent list');
    await page.mouse.wheel(0, 500);
    await delay(1500);
    await page.mouse.wheel(0, 500);
    await delay(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(1000);

    // === Scene 4: Threat detail ===
    console.log('📹 Scene 4: Threat detail');
    const firstThreat = page.locator('.table-row[data-nav="ai-agent-threat"]').first();
    if (await firstThreat.isVisible()) {
      await firstThreat.click();
      await delay(2500);
      await page.mouse.wheel(0, 400);
      await delay(2000);
      await page.mouse.wheel(0, 400);
      await delay(1500);
      // Next page
      const nextBtn = page.locator('.pn-btn.pn-next');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await delay(2500);
      }
    }

    // === Scene 5: Playbook detail ===
    console.log('📹 Scene 5: Playbook detail');
    await page.locator('.bc-link[data-nav="ai-agent-home"]').click();
    await delay(2000);
    await page.mouse.wheel(0, 600);
    await delay(1000);
    const playbook = page.locator('.cli-row[data-nav="ai-agent-playbook"]').first();
    if (await playbook.isVisible()) {
      await playbook.click();
      await delay(2500);
      await page.mouse.wheel(0, 400);
      await delay(1500);
      await page.mouse.wheel(0, 400);
      await delay(1500);
    }

    // === Scene 6: Global search ===
    console.log('📹 Scene 6: Search');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await delay(2000);
    await page.locator('#search-input').click();
    await page.keyboard.type('prompt', { delay: 120 });
    await delay(3000);
    await page.keyboard.press('Escape');
    await delay(500);

    // === Scene 7: OpenClaw ===
    console.log('📹 Scene 7: OpenClaw');
    await page.hover('.nav-menu-trigger');
    await delay(500);
    await page.locator('.nav-menu-item:text("OpenClaw")').click();
    await delay(2500);
    await page.mouse.wheel(0, 500);
    await delay(1500);
    const ocThreat = page.locator('.table-row[data-nav="openclaw-threat"]').first();
    if (await ocThreat.isVisible()) {
      await ocThreat.click();
      await delay(2500);
      await page.mouse.wheel(0, 200);
      await delay(2000);
    }

    // === Scene 8: Severity filter ===
    console.log('📹 Scene 8: Severity filter');
    await page.locator('.bc-link[data-nav="openclaw-home"]').click();
    await delay(1500);
    const sevFilter = page.locator('.stat-block[data-filter]').first();
    if (await sevFilter.isVisible()) {
      await sevFilter.click();
      await delay(3000);
    }

    // === Scene 9: Back to landing ===
    console.log('📹 Scene 9: Back to landing');
    await page.locator('.navbar-brand').click();
    await delay(4000);

    console.log('🎬 Recording complete!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    const video = page.video();
    const srcPath = await video.path();
    await context.close();
    await browser.close();
    server.kill();

    const outPath = join(ROOT, 'demo-video.webm');
    renameSync(srcPath, outPath);
    console.log(`\n✅ Video saved to: ${outPath}`);
    console.log('💡 Convert to MP4: ffmpeg -i demo-video.webm -c:v libx264 -preset fast demo-video.mp4');
  }
}

run().catch(console.error);
