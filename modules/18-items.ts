/**
 * Demo #18 — Items (Product Catalog / Master Data)
 *
 * Usage: cd demos && npm run demo:items
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop, typeSlowly } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("18-items");

  console.log("🎬  Items demo");
  await goTo(page, "/dashboard/items");
  await beat(2500);

  // Scroll through items
  await scrollDown(page, 400);
  await beat(2500);

  // Search for a specific item
  const searchBox = page.locator('input[placeholder*="Search"]').first();
  if (await searchBox.count()) {
    await searchBox.click();
    await typeSlowly(page, "MAKE", 70);
    await beat(1500);
    await searchBox.clear();
    await beat(800);
  }

  // Hover New Item button
  const newBtn = page.locator('button:has-text("New item")');
  const hasNew = await newBtn.count();
  if (hasNew) {
    await newBtn.hover();
    await beat(600);
    await newBtn.click();
    await beat(1500); // modal opens
    await page.keyboard.press("Escape");
    await beat(800);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "18-items");
})();
