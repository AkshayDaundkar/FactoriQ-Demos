/**
 * Shared base for all demo scripts.
 * Handles: browser launch, login, skip onboarding, video recording.
 */

import { Page, chromium, BrowserContext } from "playwright";
import path from "path";
import fs from "fs";

export const BASE_URL   = process.env.BASE_URL   ?? "http://localhost:3000";
const EMAIL             = process.env.DEMO_EMAIL;
const PASSWORD          = process.env.DEMO_PASSWORD;
const RECORDINGS_ROOT   = path.join(__dirname, "../recordings");

export const beat = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function typeSlowly(page: Page, text: string, delayMs = 60) {
  for (const char of text) {
    await page.keyboard.type(char, { delay: delayMs });
  }
}

export async function scrollDown(page: Page, px = 300) {
  await page.evaluate((amount) => window.scrollBy({ top: amount, behavior: "smooth" }), px);
}

export async function scrollTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/** Navigate to a route and wait for React to hydrate. */
export async function goTo(page: Page, routePath: string) {
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "domcontentloaded" });
  await beat(1500);
}

/**
 * Launch browser with video recording, log in, skip onboarding.
 * Returns ready-to-use page landed on /dashboard.
 */
export async function startDemo(moduleName: string): Promise<{ context: BrowserContext; page: Page }> {
  if (!EMAIL || !PASSWORD) throw new Error("Set DEMO_EMAIL and DEMO_PASSWORD in demos/.env");

  const recordDir = path.join(RECORDINGS_ROOT, moduleName);
  if (!fs.existsSync(recordDir)) fs.mkdirSync(recordDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 40,
    args: ["--window-size=1440,900"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: { dir: recordDir, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  // ── Scene 0: Show landing page briefly ────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await beat(2500);
  await scrollDown(page, 300);
  await beat(1500);
  await scrollTop(page);
  await beat(800);

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await beat(800);
  await page.click("#login-email");
  await typeSlowly(page, EMAIL!, 75);
  await beat(400);
  await page.click("#login-password");
  await typeSlowly(page, PASSWORD!, 75);
  await beat(600);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard**`, { timeout: 30_000 });
  await beat(1500);

  // ── Skip onboarding if shown ───────────────────────────────────────────────
  if (page.url().includes("/onboarding")) {
    const skipBtn = page.locator('button:has-text("Skip for now")');
    await skipBtn.waitFor({ state: "visible", timeout: 8_000 });
    await beat(800);
    await skipBtn.click();
    await beat(1500);
  }

  console.log(`🔐  Logged in — starting: ${moduleName}`);
  return { context, page };
}

/** Close context and flush video to disk. */
export async function endDemo(context: BrowserContext, moduleName: string) {
  await context.close();
  console.log(`\n✅  Recording saved → recordings/${moduleName}/`);
}
