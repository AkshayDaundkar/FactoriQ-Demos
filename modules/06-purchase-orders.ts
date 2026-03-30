/**
 * Demo #6 — Purchase Orders (BuyIQ + full lifecycle)
 * Shows the PO list, BuyIQ AI generation, and status lifecycle.
 *
 * Usage: cd demos && npm run demo:orders
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("06-purchase-orders");

  console.log("🎬  Purchase Orders demo");

  // Show Requisitions first — the starting point of the flow
  await goTo(page, "/dashboard/requisitions");
  await beat(2500);
  await scrollDown(page, 300);
  await beat(2000);
  await scrollTop(page);
  await beat(1000);

  // Navigate to Orders
  await goTo(page, "/dashboard/orders");
  await beat(2500);

  // Hover BuyIQ button — the wow moment
  const buyiqBtn = page.locator('button:has-text("Generate POs")');
  await buyiqBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await buyiqBtn.hover();
  await beat(1500);

  // Show the status filter
  const statusSelect = page.locator('select, [role="combobox"]').first();
  await statusSelect.click().catch(() => {});
  await beat(800);
  await statusSelect.press("Escape").catch(() => {});

  // Scroll through PO list
  await scrollDown(page, 400);
  await beat(2500);
  await scrollDown(page, 400);
  await beat(2000);

  // Open first PO detail
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

  await endDemo(context, "06-purchase-orders");
})();
