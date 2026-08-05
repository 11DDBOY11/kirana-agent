import { describe, expect, it, vi } from "vitest";
import path from "path";
import fs from "fs";

// Mock server-only since it throws an error when imported outside React server components environment
vi.mock("server-only", () => ({}));

// Manually parse .env.local
const envLocalPath = path.resolve(__dirname, "../../../.env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  content.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

import { runTextBillingPipeline } from "@/lib/billing/pipeline";
import { saveInvoice, answerLedgerQuery } from "@/lib/ledger/service";

const hasCredentials = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasCredentials)("Ledger Supabase Integration Check", () => {
  it("verifies the e2e 'aaj ka total' scenario and bare-number bill detection", async () => {
    const testPhone = "whatsapp:+910000000000";
    const billText = "1 kg sakkare 100";

    // 1. Verify intent detection detects bare number as bill
    const { detectIncomingIntent } = await import("./intent");
    const intent = detectIncomingIntent(billText);
    console.log("\n=== E2E STEP 1: Intent detection check ===");
    console.log(`Input: "${billText}" | Detected Intent: "${intent}"`);
    expect(intent).toBe("new_bill");

    // 2. Run text billing pipeline
    console.log("\n=== E2E STEP 2: Running pipeline for bare-number bill ===");
    const pipelineResult = await runTextBillingPipeline(billText, { useLlm: true });
    console.log("Extraction Strategy:", pipelineResult.extraction.strategy);
    console.log("Items:", JSON.stringify(pipelineResult.extraction.items, null, 2));
    console.log("Invoice Text:\n" + pipelineResult.invoiceText);

    // 3. Save to database
    console.log("\n=== E2E STEP 3: Saving to database ===");
    // Delete any old invoice for this test phone to start fresh
    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    };
    // Fetch shopkeeper id if exists
    const skRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/shopkeepers?select=id&phone_number=eq.${encodeURIComponent(testPhone)}`, { headers });
    const sks = await skRes.json();
    if (sks.length > 0) {
      const skId = sks[0].id;
      // Delete old invoices for clean verification
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/invoices?shopkeeper_id=eq.${skId}`, { method: "DELETE", headers });
    }

    await saveInvoice({
      phone: testPhone,
      rawInputType: "text",
      result: pipelineResult
    });
    console.log("Invoice successfully saved to database!");

    // 4. Immediately query ledger
    console.log("\n=== E2E STEP 4: Immediately querying ledger ===");
    const queryResponse = await answerLedgerQuery({
      phone: testPhone,
      query: "today_total",
      replyLanguage: "hinglish",
      now: new Date()
    });

    console.log("Ledger Response (Hinglish):\n" + queryResponse);
    console.log("=========================================");

    expect(queryResponse).toContain("Aaj ka total sales");
    expect(queryResponse).toContain("₹100.00"); // 100 sugar (0% GST loose staple)
    expect(queryResponse).toContain("(1 bills)");
  }, 30_000);

  it("persists invoice with GST 2.0 slabs and queries ledger total", async () => {
    const testPhone = "whatsapp:+9999999999";
    const billText = "2kg rice 100rs, 1 dish soap 60rs";

    console.log("=== STEP 1: Running pipeline with useLlm: true ===");
    console.log("Groq API Key Prefix:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 12) : "undefined");
    const pipelineResult = await runTextBillingPipeline(billText, { useLlm: true });
    console.log("Extraction Strategy:", pipelineResult.extraction.strategy);
    console.log("Items:", JSON.stringify(pipelineResult.extraction.items, null, 2));
    console.log("GST Total:", pipelineResult.gst.gst_total);
    console.log("Grand Total:", pipelineResult.gst.grand_total);

    expect(pipelineResult.extraction.strategy).toBe("llm");
    expect(pipelineResult.gst.gst_total).toBe(10.8);
    expect(pipelineResult.gst.grand_total).toBe(170.8);

    // 2. Save to database
    console.log("\n=== STEP 2: Saving to database ===");
    await saveInvoice({
      phone: testPhone,
      rawInputType: "text",
      result: pipelineResult
    });
    console.log("Invoice successfully saved without errors!");

    // 3. Query ledger
    console.log("\n=== STEP 3: Querying ledger ===");
    const queryResponse = await answerLedgerQuery({
      phone: testPhone,
      query: "today_total",
      hinglish: true,
      now: new Date()
    });

    console.log("Ledger Response:\n" + queryResponse);
    console.log("=========================================");

    expect(queryResponse).toContain("Aaj ka total sales");
    expect(queryResponse).toMatch(/₹\d+\.\d{2} hai/);
  }, 30_000);

  it("extracts Kannada script bill text and queries ledger total in Kannada", async () => {
    const testPhone = "whatsapp:+8888888888";
    
    // 1. Text pipeline extraction
    console.log("\n=== KANNADA STEP 1: Running pipeline with Kannada script ===");
    const billText = "೨ ಕೆಜಿ ಅಕ್ಕಿ ೧೦೦ ರೂ, ೧ ಸಾಬೂನು ೬೦ ರೂ";
    const pipelineResult = await runTextBillingPipeline(billText, { useLlm: true });
    
    console.log("Extraction Strategy:", pipelineResult.extraction.strategy);
    console.log("Items:", JSON.stringify(pipelineResult.extraction.items, null, 2));
    console.log("GST Total:", pipelineResult.gst.gst_total);
    console.log("Grand Total:", pipelineResult.gst.grand_total);
    console.log("Invoice Text:\n" + pipelineResult.invoiceText);

    expect(pipelineResult.extraction.strategy).toBe("llm");
    // அಕ್ಕಿ (rice) -> 0% GST, ಸಾಬೂನು (soap) -> 18% GST
    expect(pipelineResult.gst.items.length).toBe(2);
    expect(pipelineResult.gst.items.find(i => i.name.includes("rice"))?.gst_rate).toBe(0);
    expect(pipelineResult.gst.items.find(i => i.name.includes("soap"))?.gst_rate).toBe(18);

    // 2. Save invoice
    console.log("\n=== KANNADA STEP 2: Saving to database ===");
    await saveInvoice({
      phone: testPhone,
      rawInputType: "text",
      result: pipelineResult
    });
    console.log("Invoice successfully saved without errors!");

    // 3. Query ledger
    console.log("\n=== KANNADA STEP 3: Querying ledger in Kannada ===");
    const queryResponse = await answerLedgerQuery({
      phone: testPhone,
      query: "today_total",
      replyLanguage: "kannada",
      now: new Date()
    });

    console.log("Ledger Response (Kannada):\n" + queryResponse);
    console.log("=========================================");

    expect(queryResponse).toContain("ಇವತ್ತಿನ ಒಟ್ಟು ಮಾರಾಟ");
    expect(queryResponse).toMatch(/₹\d+\.\d{2} ಆಗಿದೆ/);
  }, 30_000);
});
