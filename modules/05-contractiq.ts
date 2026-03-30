/**
 * Demo #5 — ContractIQ (Contract Management + AI)
 * Shows contract list, renewal alerts, AI obligation extraction.
 *
 * Usage: cd demos && npm run demo:contractiq
 */

import { startDemo, endDemo, goTo, beat, scrollDown, scrollTop } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("05-contractiq");

  console.log("🎬  ContractIQ demo");
  await goTo(page, "/dashboard/iq/contracts");
  await beat(2500);

  // KPI strip — let viewer see the numbers
  await beat(2000);

  // Scroll to renewal alerts table
  await scrollDown(page, 300);
  await beat(2500);

  // Scroll to contracts table
  await scrollDown(page, 350);
  await beat(2500);

  // Click a contract row if available to show obligations
  const contractRow = page.locator('table tbody tr').first();
  const hasRow = await contractRow.count();
  if (hasRow) {
    await contractRow.click().catch(() => {});
    await beat(2000);
  }

  // Scroll to obligations table
  await scrollDown(page, 350);
  await beat(2500);

  // Hover AI action buttons
  const parseBtn = page.locator('button:has-text("Parse contract")');
  const hasBtn = await parseBtn.count();
  if (hasBtn) {
    await parseBtn.hover();
    await beat(800);
  }

  const extractBtn = page.locator('button:has-text("Extract obligations")');
  const hasExtract = await extractBtn.count();
  if (hasExtract) {
    await extractBtn.hover();
    await beat(800);
  }

  await scrollTop(page);
  await beat(2000);

  await endDemo(context, "05-contractiq");
})();
