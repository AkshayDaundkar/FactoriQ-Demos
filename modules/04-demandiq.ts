/**
 * Demo #4 — DemandIQ (AI Demand Forecasting)
 * Shows running a demand forecast and getting stock policy recommendations.
 *
 * Usage: cd demos && npm run demo:demandiq
 */

import { startDemo, endDemo, goTo, beat, scrollDown } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("04-demandiq");

  console.log("🎬  DemandIQ demo");
  await goTo(page, "/dashboard/iq/demand");
  await beat(2500);

  // Show the forecast controls
  await scrollDown(page, 200);
  await beat(1500);

  // Click Run Demand Forecast
  const forecastBtn = page.locator('button:has-text("Run demand forecast")');
  await forecastBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await forecastBtn.hover();
  await beat(600);
  await forecastBtn.click();
  console.log("  🤖 Running demand forecast...");

  // Wait for AI result panel to appear (up to 60s)
  await page.waitForFunction(
    () => document.body.innerText.includes("forecast") || document.body.innerText.includes("Forecast"),
    { timeout: 60_000 }
  ).catch(() => {});
  await beat(3000); // read the forecast result

  // Scroll to stock policies table
  await scrollDown(page, 400);
  await beat(2000);

  // Click Recommend Stock Policy
  const policyBtn = page.locator('button:has-text("Recommend stock policy")');
  const hasPolicy = await policyBtn.count();
  if (hasPolicy) {
    await policyBtn.hover();
    await beat(600);
    await policyBtn.click();
    console.log("  🤖 Running stock policy recommendation...");
    await beat(5000);
  }

  await scrollDown(page, 400);
  await beat(3000);

  await endDemo(context, "04-demandiq");
})();
