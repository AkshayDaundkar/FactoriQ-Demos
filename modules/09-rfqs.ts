/**
 * Demo #9 — RFQs & Quotes
 *
 * Usage: cd demos && npm run demo:rfqs
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("09-rfqs");

  console.log("🎬  RFQs & Quotes demo");
  await goTo(page, "/dashboard/rfqs");
  await beat(2500);

  // Show status filter
  const statusSelect = page.locator('select, [role="combobox"]').first();
  await statusSelect.click().catch(() => {});
  await beat(800);
  await statusSelect.press("Escape").catch(() => {});

  // Scroll through list
  await scrollDown(page, 400);
  await beat(2500);

  // Open first RFQ detail
  const viewLink = page.locator('a:has-text("View")').first();
  const hasLink = await viewLink.count();
  if (hasLink) {
    await viewLink.click();
    await beat(3000);
    await page.goBack();
    await beat(1500);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "09-rfqs");
})();
