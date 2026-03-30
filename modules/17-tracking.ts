/**
 * Demo #17 — Real-Time Tracking (Gantt + Work Orders)
 *
 * Usage: cd demos && npm run demo:tracking
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("17-tracking");

  console.log("🎬  Real-Time Tracking demo");
  await goTo(page, "/dashboard/tracking");
  await beat(2500);

  // KPI strip
  await beat(2000);

  // Scroll to work order table (All tab)
  await scrollDown(page, 300);
  await beat(2500);

  // Click Schedule tab to show Gantt chart
  const scheduleTab = page.locator('[role="tab"]:has-text("Schedule"), button:has-text("Schedule")').first();
  const hasTab = await scheduleTab.count();
  if (hasTab) {
    await scheduleTab.click();
    await beat(3000); // Gantt is the visual wow
    await scrollDown(page, 200);
    await beat(2000);
  }

  // Click Inventory tab
  const inventoryTab = page.locator('[role="tab"]:has-text("Inventory"), button:has-text("Inventory")').first();
  const hasInvTab = await inventoryTab.count();
  if (hasInvTab) {
    await inventoryTab.click();
    await beat(2500);
  }

  // Click People tab
  const peopleTab = page.locator('[role="tab"]:has-text("People"), button:has-text("People")').first();
  const hasPeople = await peopleTab.count();
  if (hasPeople) {
    await peopleTab.click();
    await beat(2500);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "17-tracking");
})();
