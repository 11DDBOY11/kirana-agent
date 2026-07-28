import { extractBillFromText } from "@/lib/billing/extraction";
import { formatInvoice } from "@/lib/billing/format";
import { calculateGst } from "@/lib/billing/gst";
import { reviewInvoice } from "@/lib/billing/review";
import type { BillingPipelineResult } from "@/lib/billing/types";
import { mediaToBillText } from "@/lib/media/openai-media";
import type { MediaKind } from "@/lib/media/twilio-media";

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

/** Shared media entry point used by Twilio and the local debug console. */
export async function runMediaBillingPipeline({
  kind,
  bytes,
  contentType,
}: {
  kind: MediaKind;
  bytes: Uint8Array;
  contentType: string;
}): Promise<BillingPipelineResult> {
  console.info("[pipeline:media-received]", { kind, contentType, bytes: bytes.byteLength });
  const rawInput = await mediaToBillText({ kind, bytes, contentType });
  console.info("[pipeline:media-converted]", { kind, inputLength: rawInput.length });
  return runTextBillingPipeline(rawInput);
}
