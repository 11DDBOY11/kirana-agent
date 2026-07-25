import type { GstResult, ReviewResult } from "@/lib/billing/types";

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Distinct, identifiable agentic review pass; it never silently changes values. */
export function reviewInvoice(gst: GstResult, extractionWarnings: string[]): ReviewResult {
  // Unit prices are stored to paise; allow one paise of rounding variance.
  const lineTotalsPass = gst.items.every(
    (item) => Math.abs(money(item.quantity * item.unit_price) - item.total) <= 0.01,
  );
  const subtotalPass = money(gst.items.reduce((sum, item) => sum + item.total, 0)) === gst.subtotal;
  const gstMathPass = gst.items.every((item) =>
    money(item.total + item.cgst + item.sgst) === item.grand_total &&
    money((item.total * item.gst_rate) / 100) === money(item.cgst + item.sgst),
  );
  const grandTotalPass = money(gst.subtotal + gst.gst_total) === gst.grand_total;
  const flags = [...extractionWarnings, ...gst.warnings];

  const checks = [
    { name: "Line item math", passed: lineTotalsPass, detail: "quantity × unit price matches each line total" },
    { name: "Subtotal", passed: subtotalPass, detail: "sum of line totals matches subtotal" },
    { name: "GST split", passed: gstMathPass, detail: "GST rate and CGST/SGST split match each item" },
    { name: "Grand total", passed: grandTotalPass, detail: "subtotal + GST matches grand total" },
  ];

  return { pass: "agentic-review", valid: checks.every((check) => check.passed), checks, flags };
}
