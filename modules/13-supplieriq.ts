/**
 * Demo #13 — SupplierIQ (AI Supplier Discovery + Scoring)
 *
 * Usage: cd demos && npm run demo:supplieriq
 */

import { startDemo, endDemo, goTo, beat, scrollDown, typeSlowly } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("13-supplieriq");

  console.log("🎬  SupplierIQ demo");
  await goTo(page, "/dashboard/iq/supplier");
  await beat(2500);

  // Show supplier scoring section — hover Run AI Score
  const scoreBtn = page.locator('button:has-text("Run AI score")');
  await scoreBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await scoreBtn.hover();
  await beat(1000);

  // Scroll to supplier discovery section
  await scrollDown(page, 350);
  await beat(2000);

  // Type in the discover textarea
  const discoverTextarea = page.locator('textarea').first();
  const hasTextarea = await discoverTextarea.count();
  if (hasTextarea) {
    await discoverTextarea.click();
    await typeSlowly(page, "Electronic components for PCB assembly", 65);
    await beat(800);

    const suggestBtn = page.locator('button:has-text("Suggest suppliers")');
    const hasSuggest = await suggestBtn.count();
    if (hasSuggest) {
      await suggestBtn.hover();
      await beat(600);
      await suggestBtn.click();
      console.log("  🤖 Discovering suppliers...");
      await beat(8000); // wait for AI suggestions to load
    }
  }

  // Show qualification runs table
  await scrollDown(page, 400);
  await beat(2500);

  await endDemo(context, "13-supplieriq");
})();
