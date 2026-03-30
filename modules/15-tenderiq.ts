/**
 * Demo #15 — TenderIQ (AI Tender Analysis + Bid Comparison)
 *
 * Usage: cd demos && npm run demo:tenderiq
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("15-tenderiq");

  console.log("🎬  TenderIQ demo");
  await goTo(page, "/dashboard/iq/tenders");
  await beat(2500);

  // Show all tenders table
  await scrollDown(page, 300);
  await beat(2000);

  // Show AI action buttons
  const analyzeBtn = page.locator('button:has-text("Analyze tender")');
  const hasAnalyze = await analyzeBtn.count();
  if (hasAnalyze) {
    await analyzeBtn.hover();
    await beat(800);
  }

  const compareBtn = page.locator('button:has-text("Compare bids")');
  const hasCompare = await compareBtn.count();
  if (hasCompare) {
    await compareBtn.hover();
    await beat(800);
    await compareBtn.click();
    console.log("  🤖 Comparing bids...");
    await beat(6000);
  }

  // Scroll through bid comparison result
  await scrollDown(page, 400);
  await beat(3000);
  await scrollDown(page, 400);
  await beat(2000);

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "15-tenderiq");
})();
