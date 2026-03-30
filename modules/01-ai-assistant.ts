/**
 * Demo #1 — AI Assistant
 *
 * Full flow:
 *   1. Show landing page (website)
 *   2. Navigate to /login and log in
 *   3. Skip onboarding
 *   4. Navigate to AI Assistant page
 *   5. Open chat, type 5 questions, show answers
 *
 * Usage:
 *   cd demos && npm run demo:ai-assistant
 */

import { Page, chromium } from "playwright";
import path from "path";
import fs from "fs";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = process.env.BASE_URL   ?? "http://localhost:3000";
const EMAIL      = process.env.DEMO_EMAIL;
const PASSWORD   = process.env.DEMO_PASSWORD;
const MODULE     = "01-ai-assistant";
const RECORDINGS = path.join(__dirname, "../recordings", MODULE);

if (!EMAIL || !PASSWORD) {
  console.error("❌  Set DEMO_EMAIL and DEMO_PASSWORD in demos/.env");
  process.exit(1);
}
if (!fs.existsSync(RECORDINGS)) fs.mkdirSync(RECORDINGS, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

const beat = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function typeSlowly(page: Page, text: string, delayMs = 60) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: delayMs });
  }
}

/** Wait until the AI finishes responding (textarea re-enables when done). */
async function waitForAIResponse(page: Page, timeoutMs = 450_000) {
  await page.waitForFunction(
    () => {
      const ta = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Ask anything about your operations…"]'
      );
      return ta !== null && !ta.disabled;
    },
    { timeout: timeoutMs }
  );
}

async function ask(page: Page, textarea: ReturnType<Page["locator"]>, question: string) {
  await textarea.click();
  await beat(300);
  await typeSlowly(page, question);
  await beat(500);
  await page.keyboard.press("Enter");
  console.log(`  ❓ Asked: "${question}"`);

  // Wait for AI to start responding (textarea gets disabled)
  await page.waitForFunction(
    () => {
      const ta = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Ask anything about your operations…"]'
      );
      return ta !== null && ta.disabled;
    },
    { timeout: 10_000 }
  ).catch(() => { /* may already be responding */ });

  // Wait for AI to finish (textarea re-enables)
  await waitForAIResponse(page);
  console.log(`  ✅ Response received`);

  // Scroll down through the response so viewer can read it
  await page.evaluate(() => {
    const chatBody = document.querySelector('[class*="overflow-y-auto"]') as HTMLElement | null;
    if (chatBody) chatBody.scrollBy({ top: 300, behavior: "smooth" });
    else window.scrollBy({ top: 300, behavior: "smooth" });
  });
  await beat(2000); // 2 extra seconds to read
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 40,
    args: ["--window-size=1440,900", "--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: { dir: RECORDINGS, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  // ── Scene 1: Show the landing page ─────────────────────────────────────────
  console.log("🎬  Scene 1: Landing page");
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await beat(3000); // let viewer see the homepage

  // Scroll down to show product features
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await beat(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(1000);

  // ── Scene 2: Navigate to login ──────────────────────────────────────────────
  console.log("🎬  Scene 2: Login");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await beat(1000);

  // Type email slowly so viewer can see it
  await page.click("#login-email");
  await typeSlowly(page, EMAIL!, 80);
  await beat(500);

  await page.click("#login-password");
  await typeSlowly(page, PASSWORD!, 80);
  await beat(700);

  await page.click('button[type="submit"]');
  await beat(500);

  // ── Scene 3: Wait for dashboard, skip onboarding ────────────────────────────
  console.log("🎬  Scene 3: Skip onboarding");
  await page.waitForURL(`${BASE_URL}/dashboard**`, { timeout: 30_000 });
  await beat(1500);

  // If we land on onboarding, skip it
  if (page.url().includes("/onboarding")) {
    const skipBtn = page.locator('button:has-text("Skip for now")');
    await skipBtn.waitFor({ state: "visible", timeout: 8_000 });
    await beat(800); // pause so viewer sees the onboarding screen
    await skipBtn.click();
    await beat(1500);
  }

  // ── Scene 4: Navigate to AI Assistant page ──────────────────────────────────
  console.log("🎬  Scene 4: AI Assistant");
  await page.goto(`${BASE_URL}/dashboard/agent`, { waitUntil: "domcontentloaded" });
  await beat(2000); // let viewer read the capabilities cards

  // Scroll down to show tips, then back up
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: "smooth" }));
  await beat(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(1000);

  // ── Scene 5: Open the chat panel ───────────────────────────────────────────
  console.log("🎬  Scene 5: Open chat");
  const chatBtn = page.locator('button[aria-label="Open AI assistant"]');
  await chatBtn.waitFor({ state: "visible", timeout: 15_000 });
  await chatBtn.hover();
  await beat(600);
  await chatBtn.click();
  await beat(1500); // let panel animate open

  const textarea = page.locator('textarea[placeholder="Ask anything about your operations…"]');
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  await beat(500);

  // ── Scene 6: Ask 5 questions ────────────────────────────────────────────────
  console.log("🎬  Scene 6: Asking questions");

  await ask(page, textarea, "Give me an operations overview");
  await beat(1500);

  await ask(page, textarea, "Which vendors have delayed deliveries this quarter?");
  await beat(1500);

  await ask(page, textarea, "What is our total pending PO value this month?");
  await beat(1500);

  await ask(page, textarea, "Which items are running low on stock?");
  await beat(1500);

  await ask(page, textarea, "Show me the top 3 vendors by spend");
  await beat(3000); // hold longer on the last answer

  // ── Scene 7: Close chat, pull back to dashboard ─────────────────────────────
  console.log("🎬  Scene 7: Closing chat");
  await page.keyboard.press("Escape");
  await beat(800);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  await beat(3000); // end frame

  await context.close();
  console.log(`\n✅  Recording saved → recordings/${MODULE}/`);
})();
