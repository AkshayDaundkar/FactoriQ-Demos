/**
 * Demo #14 — RiskIQ (Supply Chain Risk Assessment)
 *
 * Usage: cd demos && npm run demo:riskiq
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("14-riskiq");

  console.log("🎬  RiskIQ demo");
  await goTo(page, "/dashboard/iq/risk");
  await beat(2500);

  // Show KPI strip — critical alerts
  await beat(2000);

  // Click Run Risk Assessment
  const riskBtn = page.locator('button:has-text("Run risk assessment")');
  await riskBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await riskBtn.hover();
  await beat(800);
  await riskBtn.click();
  console.log("  🤖 Running risk assessment...");

  // Wait for AI result to appear
  await beat(8000);

  // Scroll to risk alerts table
  await scrollDown(page, 400);
  await beat(3000); // show severity badges (critical, high, medium)

  await scrollDown(page, 400);
  await beat(2000);

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "14-riskiq");
})();
