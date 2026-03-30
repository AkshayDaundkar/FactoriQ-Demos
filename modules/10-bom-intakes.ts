/**
 * Demo #10 — BOM Intakes (Email → Parsed BOM)
 *
 * Usage: cd demos && npm run demo:bom-intakes
 */

import { startDemo, endDemo, goTo, beat, scrollDown } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("10-bom-intakes");

  console.log("🎬  BOM Intakes demo");
  await goTo(page, "/dashboard/bom-intakes");
  await beat(2500);

  // Scroll through the list
  await scrollDown(page, 300);
  await beat(2000);

  // Open first intake detail if available
  const openLink = page.locator('a:has-text("Open"), a:has-text("View")').first();
  const hasLink = await openLink.count();
  if (hasLink) {
    await openLink.click();
    await beat(3500);
    await page.goBack();
    await beat(1500);
  }

  await scrollDown(page, 300);
  await beat(2000);

  await endDemo(context, "10-bom-intakes");
})();
