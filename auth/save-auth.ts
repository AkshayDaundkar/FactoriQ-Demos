/**
 * Run this ONCE before recording any demos.
 * It opens a real browser, logs you into FactoriQ, and saves
 * the session (cookies + localStorage) to auth/state.json.
 *
 * Usage:
 *   cd demos
 *   npm run save-auth
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;
const STATE_PATH = path.join(__dirname, "state.json");

if (!EMAIL || !PASSWORD) {
  console.error("❌  Set DEMO_EMAIL and DEMO_PASSWORD in demos/.env");
  process.exit(1);
}

(async () => {
  console.log("🌐  Opening browser for login…");

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // Fill login form
  await page.fill("#login-email", EMAIL);
  await new Promise((r) => setTimeout(r, 400));
  await page.fill("#login-password", PASSWORD);
  await new Promise((r) => setTimeout(r, 400));
  await page.click('button[type="submit"]');

  console.log("⏳  Waiting for dashboard redirect…");

  // Wait until we land on /dashboard (Firebase + session cookie established)
  await page.waitForURL(`${BASE_URL}/dashboard**`, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // Extra wait for session cookie to be set by /api/auth/session
  await new Promise((r) => setTimeout(r, 2000));

  // Save full auth state
  await context.storageState({ path: STATE_PATH });
  await browser.close();

  console.log(`✅  Auth state saved → auth/state.json`);
  console.log(`    You can now run any demo script.`);
})();
