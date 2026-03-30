/**
 * FactoriQ — Full End-to-End Product Demo
 *
 * Story: "A day managing procurement at a manufacturing company using FactoriQ"
 *
 * Chapters:
 *   1.  Landing page
 *   2.  Login → Dashboard overview
 *   3.  Master Data — Items, BOM, Vendors
 *   4.  Demand & Planning — Requisitions → MPS
 *   5.  BuyIQ — Generate POs from open demand
 *   6.  RFQs — Request quotes from vendors
 *   7.  Inbox — Incoming vendor emails / quotes
 *   8.  Receipts (GRN) — Record goods received
 *   9.  Vendor Invoices — 3-way match
 *  10.  Inventory — Stock levels after receiving
 *  11.  DemandIQ — AI demand forecast + stock policy
 *  12.  SupplierIQ — Discover & score suppliers
 *  13.  RiskIQ — Supply chain risk assessment
 *  14.  ContractIQ — Contract management + obligations
 *  15.  TenderIQ — Tender analysis + bid comparison
 *  16.  Real-Time Tracking — Work orders + Gantt
 *  17.  AI Assistant — Ask 5 questions about the whole system
 *  18.  Integrations — WhatsApp + Tally
 *  19.  Back to Dashboard — the full picture
 *
 * Usage:
 *   cd demos && npm run demo:full
 */

import { chromium, Page, BrowserContext } from "playwright";
import path from "path";
import fs from "fs";

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE_URL   = process.env.BASE_URL   ?? "http://localhost:3000";
const EMAIL      = process.env.DEMO_EMAIL!;
const PASSWORD   = process.env.DEMO_PASSWORD!;
const MODULE     = "00-full-demo";
const RECORD_DIR = path.join(__dirname, "../recordings", MODULE);

if (!EMAIL || !PASSWORD) { console.error("Set DEMO_EMAIL + DEMO_PASSWORD in .env"); process.exit(1); }
if (!fs.existsSync(RECORD_DIR)) fs.mkdirSync(RECORD_DIR, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────────
const beat = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function type(page: Page, text: string, delay = 65) {
  for (const ch of text) await page.keyboard.type(ch, { delay });
}

async function go(page: Page, route: string) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await beat(1800);
}

async function scrollBy(page: Page, px: number) {
  await page.evaluate((n) => window.scrollBy({ top: n, behavior: "smooth" }), px);
}
async function scrollTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/** Click a button by partial text — silently skips if not found */
async function clickBtn(page: Page, text: string, hoverFirst = true) {
  const btn = page.locator(`button:has-text("${text}")`).first();
  if (!await btn.count()) return false;
  await btn.waitFor({ state: "visible", timeout: 6000 }).catch(() => {});
  if (hoverFirst) { await btn.hover(); await beat(700); }
  await btn.click();
  return true;
}

/** Wait for AI to finish (textarea re-enabled) */
async function waitForAI(page: Page, timeout = 90_000) {
  await page.waitForFunction(
    () => {
      const ta = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Ask anything about your operations…"]'
      );
      return ta !== null && !ta.disabled;
    },
    { timeout }
  ).catch(() => {});
}

function chapter(n: number, title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Chapter ${n}: ${title}`);
  console.log(`${"─".repeat(60)}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 45,
    args: ["--window-size=1440,900"],
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: { dir: RECORD_DIR, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 1 — Landing Page
  // ════════════════════════════════════════════════════════════════════════════
  chapter(1, "Landing Page");
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await beat(2500);
  await scrollBy(page, 400);
  await beat(2000);
  await scrollBy(page, 400);
  await beat(2000);
  await scrollBy(page, 400);
  await beat(1500);
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 2 — Login → Dashboard
  // ════════════════════════════════════════════════════════════════════════════
  chapter(2, "Login → Dashboard Overview");
  await go(page, "/login");
  await beat(800);

  await page.click("#login-email");
  await type(page, EMAIL, 80);
  await beat(400);
  await page.click("#login-password");
  await type(page, PASSWORD, 80);
  await beat(700);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard**`, { timeout: 30_000 });
  await beat(1500);

  // Skip onboarding if shown
  if (page.url().includes("/onboarding")) {
    const skip = page.locator('button:has-text("Skip for now")');
    await skip.waitFor({ state: "visible", timeout: 8_000 }).catch(() => {});
    await beat(800);
    await skip.click();
    await beat(1500);
  }

  // Dashboard — KPI strip, charts, mini tables
  await go(page, "/dashboard");
  await beat(3000);
  await scrollBy(page, 380);
  await beat(2500); // procurement flow cards
  await scrollBy(page, 380);
  await beat(2500); // charts
  await scrollBy(page, 380);
  await beat(2500); // mini tables
  await scrollTop(page);
  await beat(1500);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 3 — Master Data: Items → BOM → Vendors
  // ════════════════════════════════════════════════════════════════════════════
  chapter(3, "Master Data — Items, BOM, Vendors");

  // Items
  await go(page, "/dashboard/items");
  await beat(2000);
  await scrollBy(page, 350);
  await beat(2000);

  // Search to show MAKE vs BUY distinction
  const itemSearch = page.locator('input[placeholder*="Search"]').first();
  if (await itemSearch.count()) {
    await itemSearch.click();
    await type(page, "MAKE", 70);
    await beat(1500);
    await itemSearch.fill("");
    await beat(700);
  }

  // Hover New Item button
  const newItemBtn = page.locator('button:has-text("New item")');
  if (await newItemBtn.count()) {
    await newItemBtn.hover();
    await beat(600);
    await newItemBtn.click();
    await beat(1500); // modal opens — viewer sees the fields
    await page.keyboard.press("Escape");
    await beat(800);
  }

  // BOM — table then graph
  await go(page, "/dashboard/bom");
  await beat(2000);
  await scrollBy(page, 300);
  await beat(1500);

  const graphBtn = page.locator('button:has-text("Graph")');
  if (await graphBtn.count()) {
    await graphBtn.click();
    await beat(3000); // BOM graph is the visual wow
  }

  const tableBtn = page.locator('button:has-text("Table")');
  if (await tableBtn.count()) {
    await tableBtn.click();
    await beat(1200);
  }

  // Vendors
  await go(page, "/dashboard/vendors");
  await beat(2000);
  await scrollBy(page, 300);
  await beat(2000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 4 — Demand & Planning: Requisitions → MPS
  // ════════════════════════════════════════════════════════════════════════════
  chapter(4, "Demand & Planning — Requisitions → MPS");

  await go(page, "/dashboard/requisitions");
  await beat(2500);
  await scrollBy(page, 400);
  await beat(2500);
  await scrollBy(page, 400);
  await beat(2000);
  await scrollTop(page);
  await beat(1000);

  // MPS — capacity + shortage risk
  await go(page, "/dashboard/mps");
  await beat(3000); // KPIs + donut
  await scrollBy(page, 400);
  await beat(3000); // capacity utilisation bars
  await scrollBy(page, 400);
  await beat(3000); // component shortage risk table — the wow
  await scrollBy(page, 400);
  await beat(2500); // production summary
  await scrollTop(page);
  await beat(1000);

  // Open Schedule
  const scheduleLink = page.locator('a:has-text("Open Schedule")').first();
  if (await scheduleLink.count()) {
    await scheduleLink.hover();
    await beat(600);
    await scheduleLink.click();
    await beat(3000);
    await page.goBack();
    await beat(1500);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 5 — BuyIQ: Generate POs from Open Demand
  // ════════════════════════════════════════════════════════════════════════════
  chapter(5, "BuyIQ — Generate POs from Open Demand");

  await go(page, "/dashboard/orders");
  await beat(2500);

  // Show existing POs — scroll through
  await scrollBy(page, 350);
  await beat(2500);

  // Open first PO detail to show lifecycle
  const poViewLink = page.locator('a:has-text("View")').first();
  if (await poViewLink.count()) {
    await poViewLink.click();
    await beat(3500); // PO detail — line items, status, approvals
    await scrollBy(page, 350);
    await beat(2000);
    await page.goBack();
    await beat(1500);
  }

  // Hover BuyIQ button — show it exists
  const buyiqBtn = page.locator('button:has-text("Generate POs")');
  if (await buyiqBtn.count()) {
    await buyiqBtn.hover();
    await beat(2000); // hold on this — it's a key feature moment
  }

  // PO Audit Log — shows full AI trail
  await go(page, "/dashboard/audit");
  await beat(2000);
  await scrollBy(page, 350);
  await beat(2500);
  await scrollBy(page, 350);
  await beat(2000);
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 6 — RFQs & Quotes
  // ════════════════════════════════════════════════════════════════════════════
  chapter(6, "RFQs & Quotes");

  await go(page, "/dashboard/rfqs");
  await beat(2500);
  await scrollBy(page, 350);
  await beat(2000);

  // Open an RFQ detail
  const rfqView = page.locator('a:has-text("View")').first();
  if (await rfqView.count()) {
    await rfqView.click();
    await beat(3500);
    await scrollBy(page, 350);
    await beat(2000);
    await page.goBack();
    await beat(1500);
  }

  // Quotes
  await go(page, "/dashboard/quotes");
  await beat(2000);
  await scrollBy(page, 350);
  await beat(2000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 7 — Inbox: Vendor Emails Captured Automatically
  // ════════════════════════════════════════════════════════════════════════════
  chapter(7, "Inbox — Vendor Emails Captured Automatically");

  await go(page, "/dashboard/inbox");
  await beat(2500);
  await scrollBy(page, 400);
  await beat(2000);

  const inboxView = page.locator('a:has-text("View"), a:has-text("Open")').first();
  if (await inboxView.count()) {
    await inboxView.click();
    await beat(3500); // email detail — parsed document
    await scrollBy(page, 350);
    await beat(2000);
    await page.goBack();
    await beat(1500);
  }

  // BOM Intakes (emails → parsed BOMs)
  await go(page, "/dashboard/bom-intakes");
  await beat(2000);
  await scrollBy(page, 300);
  await beat(2000);

  const bomView = page.locator('a:has-text("Open"), a:has-text("View")').first();
  if (await bomView.count()) {
    await bomView.click();
    await beat(3000);
    await page.goBack();
    await beat(1500);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 8 — Receipts: Record Goods Received
  // ════════════════════════════════════════════════════════════════════════════
  chapter(8, "Receipts (GRN) — Record Goods Received");

  await go(page, "/dashboard/receipts");
  await beat(2500);

  // Show the form with all fields
  const poLineDropdown = page.locator('select').first();
  if (await poLineDropdown.count()) {
    await poLineDropdown.click();
    await beat(1000);
    await poLineDropdown.press("Escape");
    await beat(500);
  }

  // Scroll to QC checkbox
  await scrollBy(page, 250);
  await beat(1500);

  // Scroll to receipts table — show On Time + QC badges
  await scrollBy(page, 400);
  await beat(3000);
  await scrollBy(page, 400);
  await beat(2500);
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 9 — Vendor Invoices: 3-Way Match
  // ════════════════════════════════════════════════════════════════════════════
  chapter(9, "Vendor Invoices — 3-Way Match");

  await go(page, "/dashboard/vendor-invoices");
  await beat(2500);

  // Show new invoice form
  const newInvBtn = page.locator('button:has-text("New invoice")');
  if (await newInvBtn.count()) {
    await newInvBtn.hover();
    await beat(600);
    await newInvBtn.click();
    await beat(1500);

    // Fill in the invoice number to show the form
    const invNumInput = page.locator('input[placeholder*="INV"]');
    if (await invNumInput.count()) {
      await invNumInput.click();
      await type(page, "INV-2025-042", 70);
      await beat(800);
      await invNumInput.fill(""); // clear — we're just showing, not submitting
    }

    // Close form
    await clickBtn(page, "Cancel", false);
    await beat(800);
  }

  // Hover 3-way match button — the wow
  const matchBtn = page.locator('button:has-text("3-way match")').first();
  if (await matchBtn.count()) {
    await matchBtn.hover();
    await beat(2000); // hold — explain what this does
    await matchBtn.click();
    await beat(4000); // wait for match result
  }

  await scrollBy(page, 300);
  await beat(2000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 10 — Inventory: Stock After Receiving
  // ════════════════════════════════════════════════════════════════════════════
  chapter(10, "Inventory — Live Stock Levels");

  await go(page, "/dashboard/inventory");
  await beat(2500);
  await scrollBy(page, 400);
  await beat(3000); // low-stock alerts in red — this is important
  await scrollBy(page, 400);
  await beat(2500);
  await scrollBy(page, 400);
  await beat(2000);
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 11 — DemandIQ: AI Forecast + Stock Policy
  // ════════════════════════════════════════════════════════════════════════════
  chapter(11, "DemandIQ — AI Demand Forecast + Stock Policy");

  await go(page, "/dashboard/iq/demand");
  await beat(2500);

  // Run forecast
  const forecastBtn = page.locator('button:has-text("Run demand forecast")');
  if (await forecastBtn.count()) {
    await forecastBtn.hover();
    await beat(800);
    await forecastBtn.click();
    console.log("  🤖 Running demand forecast...");
    await page.waitForFunction(
      () => document.querySelector('[class*="violet"]') !== null,
      { timeout: 60_000 }
    ).catch(() => {});
    await beat(1000);
  }

  // Scroll to AI result panel
  await scrollBy(page, 300);
  await beat(3000); // read forecast analysis
  await scrollBy(page, 300);
  await beat(2000);

  // Recommend stock policy
  const policyBtn = page.locator('button:has-text("Recommend stock policy")');
  if (await policyBtn.count()) {
    await policyBtn.hover();
    await beat(800);
    await policyBtn.click();
    console.log("  🤖 Running stock policy recommendation...");
    await beat(8000);
  }

  await scrollBy(page, 400);
  await beat(3000); // stock policy table
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 12 — SupplierIQ: Discover & Score Suppliers
  // ════════════════════════════════════════════════════════════════════════════
  chapter(12, "SupplierIQ — AI Supplier Discovery + Scoring");

  await go(page, "/dashboard/iq/supplier");
  await beat(2500);

  // Supplier discovery — type a search
  const discoverTA = page.locator('textarea').first();
  if (await discoverTA.count()) {
    await discoverTA.click();
    await type(page, "Electronic components for PCB assembly", 60);
    await beat(800);

    const suggestBtn = page.locator('button:has-text("Suggest suppliers")');
    if (await suggestBtn.count()) {
      await suggestBtn.hover();
      await beat(600);
      await suggestBtn.click();
      console.log("  🤖 Discovering suppliers...");
      await beat(10_000); // AI result
    }
  }

  await scrollBy(page, 400);
  await beat(3000); // supplier suggestion cards

  // Scroll to qualification runs
  await scrollBy(page, 400);
  await beat(2500);

  // Run AI score on first vendor
  const scoreBtn = page.locator('button:has-text("Run AI score")');
  if (await scoreBtn.count()) {
    await scoreBtn.hover();
    await beat(800);
    await scoreBtn.click();
    console.log("  🤖 Scoring supplier...");
    await beat(10_000);
  }

  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 13 — RiskIQ: Supply Chain Risk Assessment
  // ════════════════════════════════════════════════════════════════════════════
  chapter(13, "RiskIQ — Supply Chain Risk Assessment");

  await go(page, "/dashboard/iq/risk");
  await beat(2500);

  // KPI strip
  await beat(2000);

  const riskBtn = page.locator('button:has-text("Run risk assessment")');
  if (await riskBtn.count()) {
    await riskBtn.hover();
    await beat(800);
    await riskBtn.click();
    console.log("  🤖 Running risk assessment...");
    await beat(10_000);
  }

  // Scroll to AI narrative + alerts
  await scrollBy(page, 400);
  await beat(3000); // AI risk narrative
  await scrollBy(page, 400);
  await beat(3000); // severity badges — critical, high, medium
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 14 — ContractIQ: Contract Management + AI Obligations
  // ════════════════════════════════════════════════════════════════════════════
  chapter(14, "ContractIQ — Contracts + AI Obligation Extraction");

  await go(page, "/dashboard/iq/contracts");
  await beat(2500);

  // KPI strip — contracts, alerts, expiring
  await beat(2000);

  // Scroll to renewal alerts
  await scrollBy(page, 350);
  await beat(3000); // expiry/renewal alerts are high value

  // Select a contract to show obligations
  const contractRow = page.locator('table tbody tr').first();
  if (await contractRow.count()) {
    await contractRow.click().catch(() => {});
    await beat(1500);
  }

  // Show AI action buttons
  await scrollBy(page, 350);
  await beat(1500);

  const parseBtn = page.locator('button:has-text("Parse contract")');
  if (await parseBtn.count()) {
    await parseBtn.hover();
    await beat(800);
  }

  const extractBtn = page.locator('button:has-text("Extract obligations")');
  if (await extractBtn.count()) {
    await extractBtn.hover();
    await beat(800);
    await extractBtn.click();
    console.log("  🤖 Extracting contract obligations...");
    await beat(8000);
  }

  await scrollBy(page, 400);
  await beat(3000); // obligations table
  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 15 — TenderIQ: Tender Analysis + Bid Comparison
  // ════════════════════════════════════════════════════════════════════════════
  chapter(15, "TenderIQ — Tender Analysis + Bid Comparison");

  await go(page, "/dashboard/iq/tenders");
  await beat(2500);

  await scrollBy(page, 300);
  await beat(2000); // tenders list

  const analyzeBtn = page.locator('button:has-text("Analyze tender")');
  if (await analyzeBtn.count()) {
    await analyzeBtn.hover();
    await beat(800);
    await analyzeBtn.click();
    console.log("  🤖 Analyzing tender...");
    await beat(8000);
    await scrollBy(page, 300);
    await beat(3000);
  }

  const compareBtn = page.locator('button:has-text("Compare bids")');
  if (await compareBtn.count()) {
    await compareBtn.hover();
    await beat(800);
    await compareBtn.click();
    console.log("  🤖 Comparing bids...");
    await beat(8000);
    await scrollBy(page, 300);
    await beat(3000);
  }

  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 16 — Real-Time Tracking: Work Orders + Gantt
  // ════════════════════════════════════════════════════════════════════════════
  chapter(16, "Real-Time Tracking — Work Orders + Gantt");

  await go(page, "/dashboard/tracking");
  await beat(2500);

  // KPI strip
  await beat(2000);

  // Scroll to work order table
  await scrollBy(page, 300);
  await beat(2500);

  // Open a work order detail
  const woView = page.locator('a:has-text("View →")').first();
  if (await woView.count()) {
    await woView.click();
    await beat(3000);
    await page.goBack();
    await beat(1500);
  }

  // Schedule (Gantt) tab
  const ganttTab = page.locator('button:has-text("Schedule")');
  if (await ganttTab.count()) {
    await ganttTab.click();
    await beat(3000); // Gantt is visual wow
    await scrollBy(page, 300);
    await beat(2500);
  }

  // Inventory tab
  const invTab = page.locator('button:has-text("Inventory")').first();
  if (await invTab.count()) {
    await invTab.click();
    await beat(2500);
  }

  // People tab
  const peopleTab = page.locator('button:has-text("People")').first();
  if (await peopleTab.count()) {
    await peopleTab.click();
    await beat(2500);
  }

  await scrollTop(page);
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 17 — AI Assistant: 5 Questions About the Whole System
  // ════════════════════════════════════════════════════════════════════════════
  chapter(17, "AI Assistant — Ask Anything About Your Operations");

  await go(page, "/dashboard/agent");
  await beat(2500);
  await scrollBy(page, 250);
  await beat(1500);
  await scrollTop(page);
  await beat(800);

  // Open chat
  const chatBtn = page.locator('button[aria-label="Open AI assistant"]');
  await chatBtn.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  await chatBtn.hover();
  await beat(600);
  await chatBtn.click();
  await beat(1500);

  const textarea = page.locator('textarea[placeholder="Ask anything about your operations…"]');
  await textarea.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});

  const questions = [
    "Give me a full operations overview — POs, inventory, risk",
    "Which vendors are causing the most delays this quarter?",
    "What items are at risk of stockout in the next 30 days?",
    "Which contracts are expiring soon and need renewal?",
    "Show me our top 5 vendors by total spend",
  ];

  for (const q of questions) {
    await textarea.click();
    await beat(400);
    await type(page, q, 58);
    await beat(500);
    await page.keyboard.press("Enter");
    console.log(`  ❓ Asked: "${q}"`);

    // Wait for response to start (textarea disables)
    await page.waitForFunction(
      () => {
        const ta = document.querySelector<HTMLTextAreaElement>(
          'textarea[placeholder="Ask anything about your operations…"]'
        );
        return ta !== null && ta.disabled;
      },
      { timeout: 8_000 }
    ).catch(() => {});

    // Wait for response to finish (textarea re-enables)
    await waitForAI(page, 450_000);
    console.log(`  ✅ Response received`);

    // Scroll through the response
    await page.evaluate(() => {
      const el = document.querySelector('[class*="overflow-y-auto"]') as HTMLElement | null;
      if (el) el.scrollBy({ top: 300, behavior: "smooth" });
      else window.scrollBy({ top: 300, behavior: "smooth" });
    });
    await beat(2500);
  }

  // Close chat
  await page.keyboard.press("Escape");
  await beat(1000);

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 18 — Integrations: WhatsApp + Tally
  // ════════════════════════════════════════════════════════════════════════════
  chapter(18, "Integrations — WhatsApp + Tally ERP");

  await go(page, "/dashboard/settings/integrations");
  await beat(2500);

  // Communication channels
  await beat(2000);
  await scrollBy(page, 350);
  await beat(2500); // WhatsApp card

  // Hover WhatsApp configure
  const waBtn = page.locator('button:has-text("Configure")').first();
  if (await waBtn.count()) {
    await waBtn.hover();
    await beat(1200);
  }

  // Scroll to ERP section
  await scrollBy(page, 400);
  await beat(2500); // Tally card

  const tallyBtn = page.locator('button:has-text("Set up"), button:has-text("Test sync"), button:has-text("Edit connection")').first();
  if (await tallyBtn.count()) {
    await tallyBtn.hover();
    await beat(1200);
  }

  // Scroll to webhook endpoints
  await scrollBy(page, 400);
  await beat(2500); // webhook URLs — technical credibility

  // ════════════════════════════════════════════════════════════════════════════
  // CHAPTER 19 — Back to Dashboard: The Full Picture
  // ════════════════════════════════════════════════════════════════════════════
  chapter(19, "Dashboard — The Full Picture");

  await go(page, "/dashboard");
  await beat(4000); // hold on the dashboard — this is the closing shot

  await scrollBy(page, 380);
  await beat(2500);
  await scrollBy(page, 380);
  await beat(2500);
  await scrollTop(page);
  await beat(3000); // final hold

  await context.close();
  console.log(`\n✅  Full demo recording saved → recordings/${MODULE}/`);
})();
