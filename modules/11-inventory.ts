/**
 * Demo #11 — Inventory (Stock levels + low-stock alerts)
 *
 * Usage: cd demos && npm run demo:inventory
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("11-inventory");

  console.log("🎬  Inventory demo");
  await goTo(page, "/dashboard/inventory");
  await beat(2500);

  // Show the stock adjustment form
  await beat(1500);

  // Scroll to low-stock alerts section
  await scrollDown(page, 350);
  await beat(3000); // this is the wow — low stock alerts in red

  // Scroll to full inventory table
  await scrollDown(page, 400);
  await beat(2500);
  await scrollDown(page, 400);
  await beat(2000);

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "11-inventory");
})();
