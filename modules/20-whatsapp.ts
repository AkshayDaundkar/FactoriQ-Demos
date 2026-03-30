/**
 * Demo #20 — WhatsApp Integration
 *
 * Usage: cd demos && npm run demo:whatsapp
 */

import { startDemo, endDemo, goTo, beat, scrollDown } from "../shared/base";

(async () => {
  const { context, page } = await startDemo("20-whatsapp");

  console.log("🎬  WhatsApp Integration demo");
  await goTo(page, "/dashboard/settings/integrations");
  await beat(2500);

  // Show Communication Channels section
  await beat(2000);

  // Scroll to WhatsApp card
  await scrollDown(page, 300);
  await beat(2500);

  // Hover the WhatsApp configure button
  const waBtn = page.locator('button:has-text("Configure")').first();
  const hasBtn = await waBtn.count();
  if (hasBtn) {
    await waBtn.hover();
    await beat(1500);
  }

  // Show webhook endpoints section
  await scrollDown(page, 400);
  await beat(3000); // show the webhook URL — credibility moment

  await endDemo(context, "20-whatsapp");
})();
