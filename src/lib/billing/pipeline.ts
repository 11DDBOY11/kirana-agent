import { extractBillFromText } from "@/lib/billing/extraction";
import { formatInvoice } from "@/lib/billing/format";
import { calculateGst } from "@/lib/billing/gst";
import { reviewInvoice } from "@/lib/billing/review";
import type { BillingPipelineResult } from "@/lib/billing/types";

/** The single text-bill pipeline used by both Twilio and /dev/test. */
export function runTextBillingPipeline(rawInput: string): BillingPipelineResult {
  console.info("[pipeline:received]", { inputLength: rawInput.length });
  const extraction = extractBillFromText(rawInput);
  console.info("[pipeline:extracted]", { itemCount: extraction.items.length, warnings: extraction.warnings.length });
  const gst = calculateGst(extraction.items);
  console.info("[pipeline:gst-calculated]", { gstTotal: gst.gst_total });
  const review = reviewInvoice(gst, extraction.warnings);
  console.info("[pipeline:agentic-review]", { valid: review.valid, flags: review.flags.length });
  const invoiceText = formatInvoice(gst, review.flags);
  console.info("[pipeline:formatted]");

  return { rawInput, extraction, gst, review, invoiceText };
}
