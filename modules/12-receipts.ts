/**
 * Demo #12 — Receipts / GRN (Goods Receipt Notes)
 *
 * Usage: cd demos && npm run demo:receipts
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("12-receipts");

  console.log("🎬  Receipts (GRN) demo");
  await goTo(page, "/dashboard/receipts");
  await beat(2500);

  // Show the new receipt form
  await beat(1500);

  // Click PO Line dropdown to show it's populated
  const poDropdown = page.locator('select').first();
  if (await poDropdown.count()) {
    await poDropdown.click();
    await beat(1000);
    await poDropdown.press("Escape");
  }

  // Scroll to receipts history table
  await scrollDown(page, 400);
  await beat(2500); // show on-time / QC badges

  await scrollDown(page, 400);
  await beat(2000);

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "12-receipts");
})();
