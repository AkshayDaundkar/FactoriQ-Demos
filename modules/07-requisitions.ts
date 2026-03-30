/**
 * Demo #7 — Requisitions (Planned Orders / Open Demand)
 *
 * Usage: cd demos && npm run demo:requisitions
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("07-requisitions");

  console.log("🎬  Requisitions demo");
  await goTo(page, "/dashboard/requisitions");
  await beat(2500);

  // Show search filtering
  const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  const hasSearch = await searchBox.count();
  if (hasSearch) {
    await searchBox.click();
    await beat(300);
    await searchBox.fill("BUY");
    await beat(1500);
    await searchBox.clear();
    await beat(800);
  }

  // Scroll through the list
  await scrollDown(page, 400);
  await beat(2500);
  await scrollDown(page, 400);
  await beat(2000);
  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "07-requisitions");
})();
