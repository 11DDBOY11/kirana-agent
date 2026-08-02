import { extractBillFromText } from "@/lib/billing/extraction";
import { formatInvoice } from "@/lib/billing/format";
import { calculateGst } from "@/lib/billing/gst";
import { extractBillWithLlm } from "@/lib/billing/llm-extraction";
import { reviewInvoice } from "@/lib/billing/review";
import type { BillingPipelineResult } from "@/lib/billing/types";
import { mediaToBillText } from "@/lib/media/openai-media";
import type { MediaKind } from "@/lib/media/twilio-media";
import { detectLanguage, type UserLanguage } from "@/lib/ledger/intent";

/**
 * The single text-bill pipeline used by both Twilio and /dev/test.
 *
 * When `useLlm` is true (the default) the messy input is sent to the LLM
 * extractor, which falls back to the deterministic parser automatically if
 * the LLM call fails.  Pass `useLlm: false` to bypass the network call
 * entirely — this is used by unit tests so they stay fast and offline.
 */
export async function runTextBillingPipeline(
  rawInput: string,
  { useLlm = true, language }: { useLlm?: boolean; language?: UserLanguage } = {},
): Promise<BillingPipelineResult> {
  console.info("[pipeline:received]", { inputLength: rawInput.length, useLlm });
  const detectedLang = language || detectLanguage(rawInput);
  
  const extraction = useLlm
    ? await extractBillWithLlm(rawInput)
    : extractBillFromText(rawInput);
  console.info("[pipeline:extracted]", { strategy: extraction.strategy, itemCount: extraction.items.length, warnings: extraction.warnings.length });
  const gst = calculateGst(extraction.items);
  console.info("[pipeline:gst-calculated]", { gstTotal: gst.gst_total });
  const review = reviewInvoice(gst, extraction.warnings);
  console.info("[pipeline:agentic-review]", { valid: review.valid, flags: review.flags.length });
  const invoiceText = formatInvoice(gst, review.flags, detectedLang);
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
