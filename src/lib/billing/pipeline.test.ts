import { describe, expect, it } from "vitest";

import { runTextBillingPipeline } from "@/lib/billing/pipeline";

describe("text billing pipeline (deterministic)", () => {
  it("extracts, taxes, reviews, and formats a common kirana bill", async () => {
    const result = await runTextBillingPipeline("2kg atta 90rs, 1 dish soap 60rs", { useLlm: false });

    expect(result.extraction.items).toEqual([
      { name: "atta", quantity: 2, unit: "kg", unit_price: 45, total: 90 },
      { name: "dish soap", quantity: 1, unit: "pc", unit_price: 60, total: 60 },
    ]);
    expect(result.extraction.strategy).toBe("deterministic");
    expect(result.gst.items.map((item) => item.gst_rate)).toEqual([0, 18]);
    expect(result.gst.gst_total).toBe(10.8);
    expect(result.gst.grand_total).toBe(160.8);
    expect(result.review.valid).toBe(true);
    expect(result.invoiceText).toContain("Grand Total: ₹160.80");
  });

  it("flags an unknown GST category instead of silently hiding uncertainty", async () => {
    const result = await runTextBillingPipeline("1 mystery item 100rs", { useLlm: false });
    expect(result.review.flags).toContain("GST for mystery item defaulted to 5%; please confirm its category.");
  });

  it("defaults loose grain items to kilograms", async () => {
    const result = await runTextBillingPipeline("2 rice 100rs", { useLlm: false });
    expect(result.extraction.items[0].unit).toBe("kg");
  });

  it("taxes packaged/branded staples at 5% while loose staples are 0%", async () => {
    const loose = await runTextBillingPipeline("2kg rice 100rs", { useLlm: false });
    const branded = await runTextBillingPipeline("2kg premium rice 100rs", { useLlm: false });

    expect(loose.gst.items[0].gst_rate).toBe(0);
    expect(branded.gst.items[0].gst_rate).toBe(5);
  });
});

const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

describe.skipIf(!hasOpenAiKey)("text billing pipeline (LLM integration)", () => {
  it("extracts items from messy Hinglish input via OpenAI", async () => {
    const result = await runTextBillingPipeline("2kg aata 90 rupay, 1 surf excel 60rs");

    expect(result.extraction.strategy).toBe("llm");
    expect(result.extraction.items.length).toBeGreaterThanOrEqual(1);

    // Every item must have the required shape with valid numbers.
    for (const item of result.extraction.items) {
      expect(typeof item.name).toBe("string");
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.total).toBeGreaterThanOrEqual(0);
      expect(item.unit_price).toBeGreaterThan(0);
    }

    // Downstream pipeline stages must still produce valid output.
    expect(result.review.valid).toBe(true);
    expect(result.gst.grand_total).toBeGreaterThan(0);
    expect(result.invoiceText).toContain("Grand Total");
  }, 30_000); // generous timeout for the API call
});
