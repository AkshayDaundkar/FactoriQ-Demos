/**
 * Demo #3 — Overview Dashboard
 * Shows KPI cards, procurement flow, charts and mini tables.
 *
 * Usage: cd demos && npm run demo:dashboard
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("03-dashboard");

  console.log("🎬  Dashboard overview demo");
  await goTo(page, "/dashboard");
  await beat(3000); // let viewer take in the full dashboard

  // Hover over KPI cards to show interactivity
  const kpiCards = page.locator('a[href*="/dashboard/"]').first();
  await kpiCards.hover().catch(() => {});
  await beat(800);

  // Scroll slowly through the full dashboard
  await scrollDown(page, 350);
  await beat(2500); // procurement flow section

  await scrollDown(page, 350);
  await beat(2500); // charts section

  await scrollDown(page, 350);
  await beat(2500); // recent POs + mini tables

  await scrollDown(page, 350);
  await beat(2000);

  await scrollTop(page);
  await beat(2000); // end on the KPI overview

  await endDemo(context, "03-dashboard");
})();
