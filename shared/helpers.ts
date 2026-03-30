import { Page, chromium, BrowserContext } from "playwright";
import path from "path";
import fs from "fs";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
export const RECORDINGS_DIR = path.join(__dirname, "../recordings");

const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

/**
 * Launch a browser context with video recording enabled,
 * then log in via the real login form so the session cookie
 * is set correctly by the app (avoids storageState restore issues).
 */
export async function launchRecordingContext(moduleName: string): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Set DEMO_EMAIL and DEMO_PASSWORD in demos/.env");
  }

  const browser = await chromium.launch({
    headless: false, // visible browser — looks better for recordings
    slowMo: 50,
    args: ["--window-size=1440,900"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // retina-quality recording
    recordVideo: {
      dir: path.join(RECORDINGS_DIR, moduleName),
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  // Log in silently before starting the demo
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard**`, { timeout: 30_000 });
  await new Promise((r) => setTimeout(r, 2000)); // let session cookie + hydration settle

  console.log(`🔐  Logged in — starting demo: ${moduleName}`);
  return { context, page };
}

/**
 * Type text one character at a time with a human-like delay.
 */
export async function typeSlowly(
  page: Page,
  selector: string,
  text: string,
  delayMs = 55
): Promise<void> {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: delayMs });
  }
}

/**
 * Type into a focused element (no selector needed — element already focused).
 */
export async function typeIntoFocused(
  page: Page,
  text: string,
  delayMs = 55
): Promise<void> {
  for (const char of text) {
    await page.keyboard.type(char, { delay: delayMs });
  }
}

/**
 * Pause for a natural-feeling beat (e.g. reading time, loading wait).
 */
export async function beat(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Navigate to a dashboard route and wait for content to load.
 */
export async function goTo(page: Page, routePath: string): Promise<void> {
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "domcontentloaded" });
  await beat(1500); // wait for React hydration
}

/**
 * Finish the recording: close the context (flushes video to disk).
 */
export async function finishRecording(context: BrowserContext, moduleName: string): Promise<void> {
  await context.close();
  console.log(`✅  Recording saved → recordings/${moduleName}/`);
}
