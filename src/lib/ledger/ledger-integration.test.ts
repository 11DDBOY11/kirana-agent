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
