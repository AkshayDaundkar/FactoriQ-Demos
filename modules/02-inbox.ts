/**
 * Demo #2 — Inbox (Email → Procurement automation)
 * Shows how inbound emails are captured and processed automatically.
 *
 * Usage: cd demos && npm run demo:inbox
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("02-inbox");

  console.log("🎬  Inbox demo");
  await goTo(page, "/dashboard/inbox");
  await beat(2000);

  // Show the full table — scroll slowly through the list
  await scrollDown(page, 400);
  await beat(2000);
  await scrollDown(page, 400);
  await beat(2000);
  await scrollTop(page);
  await beat(1000);

  // Click the status filter to show filtering in action
  const statusFilter = page.locator('select, [role="combobox"]').first();
  await statusFilter.click().catch(() => {});
  await beat(800);

  // Open the first email in the list
  const firstViewLink = page.locator('a:has-text("View"), a:has-text("Open")').first();
  const hasLink = await firstViewLink.count();
  if (hasLink) {
    await firstViewLink.click();
    await beat(3000); // show the email detail
    await page.goBack();
    await beat(1500);
  }

  // Show the "Sync now" button
  const syncBtn = page.locator('button:has-text("Sync")').first();
  const hasSync = await syncBtn.count();
  if (hasSync) {
    await syncBtn.hover();
    await beat(800);
  }

  await scrollDown(page, 300);
  await beat(2000);

  await endDemo(context, "02-inbox");
})();
