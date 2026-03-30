/**
 * Demo #8 — Vendor Invoices (3-way matching)
 *
 * Usage: cd demos && npm run demo:invoices
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("08-vendor-invoices");

  console.log("🎬  Vendor Invoices demo");
  await goTo(page, "/dashboard/vendor-invoices");
  await beat(2500);

  // Show + New Invoice button
  const newBtn = page.locator('button:has-text("New invoice")');
  await newBtn.waitFor({ state: "visible", timeout: 8_000 }).catch(() => {});
  await newBtn.hover();
  await beat(800);
  await newBtn.click();
  await beat(1500); // form slides open

  // Fill the form fields slowly so viewer can see them
  const vendorSelect = page.locator('select').first();
  if (await vendorSelect.count()) {
    await vendorSelect.click();
    await beat(600);
    await vendorSelect.press("Escape");
  }

  // Close the form
  await newBtn.click().catch(() => {});
  await beat(1000);

  // Show the 3-way match button
  await scrollDown(page, 300);
  await beat(2000);

  const matchBtn = page.locator('button:has-text("3-way match")').first();
  const hasMatch = await matchBtn.count();
  if (hasMatch) {
    await matchBtn.hover();
    await beat(1200);
  }

  await scrollDown(page, 300);
  await beat(2000);
  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "08-vendor-invoices");
})();
