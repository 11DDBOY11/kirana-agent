import type { ExtractedItem, GstResult, TaxedItem } from "@/lib/billing/types";

const STAPLE_KEYWORDS = ["atta", "flour", "rice", "dal", "pulse", "wheat", "chawal", "gehun"];
const BRANDING_KEYWORDS = ["packaged", "branded", "brand", "pack", "packet", "pkt", "aashirvaad", "fortune", "tata", "daawat", "india gate", "premium"];

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function gstRateForItem(name: string): { rate: number; confidence: "known" | "defaulted" } {
  const normalized = name.toLowerCase();

  // 1. Sin / luxury goods (40%)
  if (["cold drink", "aerated", "pan masala"].some((kw) => normalized.includes(kw))) {
    return { rate: 40, confidence: "known" };
  }

  // 2. Standard goods (18%)
  if (["soap", "detergent", "shampoo", "toothpaste", "dishwash", "dish soap"].some((kw) => normalized.includes(kw))) {
    return { rate: 18, confidence: "known" };
  }

  // 3. Essential daily items / unbranded loose staples (0%)
  const isMilkOrProduce = ["milk", "fresh vegetable", "vegetable", "fruit", "egg", "tetra-pack", "tetra pack", "uht"].some((kw) => normalized.includes(kw));
  const isStaple = STAPLE_KEYWORDS.some((kw) => normalized.includes(kw));
  const isBranded = BRANDING_KEYWORDS.some((kw) => normalized.includes(kw));

  if (isMilkOrProduce || (isStaple && !isBranded)) {
    return { rate: 0, confidence: "known" };
  }

  // 4. Low-tier processed goods / branded staples (5%)
  const isProcessedFive = ["butter", "ghee", "cheese", "juice", "chips", "tea", "coffee", "biscuit", "namkeen", "sugar", "salt", "oil"].some((kw) => normalized.includes(kw));
  if (isProcessedFive || (isStaple && isBranded)) {
    return { rate: 5, confidence: "known" };
  }

  // Default to 5% with defaulted confidence
  return { rate: 5, confidence: "defaulted" };
}

export function calculateGst(items: ExtractedItem[]): GstResult {
  const warnings: string[] = [];
  const taxedItems: TaxedItem[] = items.map((item) => {
    const mapping = gstRateForItem(item.name);
    const gst = money((item.total * mapping.rate) / 100);
    const cgst = money(gst / 2);
    const sgst = money(gst - cgst);

    if (mapping.confidence === "defaulted") {
      warnings.push(`GST for ${item.name} defaulted to 5%; please confirm its category.`);
    }

    return {
      ...item,
      gst_rate: mapping.rate,
      cgst,
      sgst,
      grand_total: money(item.total + gst),
      gst_confidence: mapping.confidence,
    };
  });

  const subtotal = money(items.reduce((sum, item) => sum + item.total, 0));
  const cgstTotal = money(taxedItems.reduce((sum, item) => sum + item.cgst, 0));
  const sgstTotal = money(taxedItems.reduce((sum, item) => sum + item.sgst, 0));
  const gstTotal = money(cgstTotal + sgstTotal);

  return {
    items: taxedItems,
    subtotal,
    cgst_total: cgstTotal,
    sgst_total: sgstTotal,
    gst_total: gstTotal,
    grand_total: money(subtotal + gstTotal),
    warnings,
  };
}
