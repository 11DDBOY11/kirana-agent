import { describe, expect, it } from "vitest";

import { runTextBillingPipeline } from "@/lib/billing/pipeline";

describe("text billing pipeline", () => {
  it("extracts, taxes, reviews, and formats a common kirana bill", () => {
    const result = runTextBillingPipeline("2kg atta 90rs, 1 dish soap 60rs");

    expect(result.extraction.items).toEqual([
      { name: "atta", quantity: 2, unit: "kg", unit_price: 45, total: 90 },
      { name: "dish soap", quantity: 1, unit: "pc", unit_price: 60, total: 60 },
    ]);
    expect(result.gst.items.map((item) => item.gst_rate)).toEqual([5, 18]);
    expect(result.gst.gst_total).toBe(15.3);
    expect(result.gst.grand_total).toBe(165.3);
    expect(result.review.valid).toBe(true);
    expect(result.invoiceText).toContain("Grand Total: ₹165.30");
  });

  it("flags an unknown GST category instead of silently hiding uncertainty", () => {
    const result = runTextBillingPipeline("1 mystery item 100rs");
    expect(result.review.flags).toContain("GST for mystery item defaulted to 5%; please confirm its category.");
  });

  it("defaults loose grain items to kilograms", () => {
    const result = runTextBillingPipeline("2 rice 100rs");
    expect(result.extraction.items[0].unit).toBe("kg");
  });
});
