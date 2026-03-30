/**
 * Demo #21 — Tally ERP Integration
 *
 * Usage: cd demos && npm run demo:tally
 */

import { startDemo, endDemo, goTo, beat, scrollDown } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("21-tally");

  console.log("🎬  Tally ERP Integration demo");
  await goTo(page, "/dashboard/settings/integrations");
  await beat(2500);

  // Scroll to ERP & Accounting section
  await scrollDown(page, 500);
  await beat(3000); // show Tally card

  // Hover Tally setup/test buttons
  const tallyBtn = page.locator('button:has-text("Set up"), button:has-text("Test sync"), button:has-text("Edit connection")').first();
  const hasBtn = await tallyBtn.count();
  if (hasBtn) {
    await tallyBtn.hover();
    await beat(1500);
  }

  // Show "Coming soon" integrations for credibility
  await scrollDown(page, 300);
  await beat(2500);

  await endDemo(context, "21-tally");
})();
