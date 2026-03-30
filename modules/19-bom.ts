/**
 * Demo #19 — BOM (Bill of Materials — Table + Graph view)
 *
 * Usage: cd demos && npm run demo:bom
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("19-bom");

  console.log("🎬  BOM demo");
  await goTo(page, "/dashboard/bom");
  await beat(2500);

  // Table view — scroll through
  await scrollDown(page, 400);
  await beat(2500);

  // Switch to Graph view — the visual wow
  const graphBtn = page.locator('button:has-text("Graph")');
  const hasGraph = await graphBtn.count();
  if (hasGraph) {
    await graphBtn.click();
    await beat(3000); // let the graph render

    // Try clicking a root node
    const rootBtn = page.locator('button').filter({ hasText: /^[A-Z0-9-]+$/ }).first();
    const hasRoot = await rootBtn.count();
    if (hasRoot) {
      await rootBtn.click();
      await beat(2500);
    }

    // Zoom controls
    const zoomIn = page.locator('button:has-text("+")').last();
    if (await zoomIn.count()) {
      await zoomIn.click();
      await beat(500);
      await zoomIn.click();
      await beat(1500);
    }
  }

  // Switch back to table
  const tableBtn = page.locator('button:has-text("Table")');
  if (await tableBtn.count()) {
    await tableBtn.click();
    await beat(1500);
  }

  // Export button hover
  const exportBtn = page.locator('button:has-text("Export")');
  if (await exportBtn.count()) {
    await exportBtn.hover();
    await beat(800);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "19-bom");
})();
