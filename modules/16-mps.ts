/**
 * Demo #16 — Master Production Schedule (MPS)
 * Shows KPIs, capacity utilization, component shortage risk.
 *
 * Usage: cd demos && npm run demo:mps
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("16-mps");

  console.log("🎬  Master Plan (MPS) demo");
  await goTo(page, "/dashboard/mps");
  await beat(3000); // KPI strip + donut chart

  // Scroll to capacity utilization bars
  await scrollDown(page, 400);
  await beat(3000);

  // Scroll to component shortage risk table
  await scrollDown(page, 400);
  await beat(3000); // the "at risk" badges are the wow moment

  // Scroll to production summary
  await scrollDown(page, 400);
  await beat(2500);

  // Hover Open Schedule link
  const scheduleLink = page.locator('a:has-text("Open Schedule")').first();
  const hasLink = await scheduleLink.count();
  if (hasLink) {
    await scheduleLink.hover();
    await beat(800);
    await scheduleLink.click();
    await beat(3000); // show schedule page briefly
    await page.goBack();
    await beat(1500);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "16-mps");
})();
