import type { ExtractedItem, GstResult, TaxedItem } from "@/lib/billing/types";

const GST_KEYWORDS: Array<{ keywords: string[]; rate: number }> = [
  { keywords: ["soap", "detergent", "shampoo", "toothpaste", "dishwash", "dish soap"], rate: 18 },
  { keywords: ["cold drink", "aerated", "chips", "pan masala"], rate: 28 },
  { keywords: ["butter", "ghee", "cheese", "juice"], rate: 12 },
  { keywords: ["atta", "flour", "rice", "dal", "pulse", "tea", "coffee", "biscuit", "namkeen", "sugar", "salt", "oil"], rate: 5 },
  { keywords: ["milk", "fresh vegetable", "vegetable", "fruit", "egg"], rate: 0 },
];

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function gstRateForItem(name: string): { rate: number; confidence: "known" | "defaulted" } {
  const normalized = name.toLowerCase();
  const match = GST_KEYWORDS.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
  return match ? { rate: match.rate, confidence: "known" } : { rate: 5, confidence: "defaulted" };
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
