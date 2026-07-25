import type { ExtractedItem, ExtractionResult } from "@/lib/billing/types";

const ITEM_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*(kg|g|gm|l|ltr|litre|liter|ml|pc|pcs|piece|packet|pkt)?\s+([a-z\u0900-\u097f][a-z\u0900-\u097f\s-]*?)\s*(?:@\s*)?(₹?\s*\d+(?:\.\d{1,2})?\s*(?:rs\.?|inr|₹)?)\s*$/i;

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parsePrice(value: string): number {
  return Number.parseFloat(value.replace(/[^0-9.]/g, ""));
}

/**
 * Text-only baseline extraction. This module is deliberately shared by the
 * WhatsApp webhook and the dev test endpoint; an LLM extractor will replace
 * this strategy for ambiguous voice/photo transcripts in a later stage.
 */
export function extractBillFromText(rawInput: string): ExtractionResult {
  const items: ExtractedItem[] = [];
  const warnings: string[] = [];
  const segments = rawInput.split(/[,;\n]+/).map((value) => value.trim()).filter(Boolean);

  for (const segment of segments) {
    const match = segment.match(ITEM_PATTERN);
    if (!match) {
      warnings.push(`Could not confidently read: "${segment}".`);
      continue;
    }

    const [, quantityText, unitText, nameText, priceText] = match;
    const quantity = Number.parseFloat(quantityText);
    const total = parsePrice(priceText);
    const name = nameText.trim().replace(/\s+/g, " ");

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(total)) {
      warnings.push(`Invalid quantity or price in: "${segment}".`);
      continue;
    }

    items.push({
      name,
      quantity,
      unit: unitText?.toLowerCase() ?? "pc",
      unit_price: money(total / quantity),
      total: money(total),
    });
  }

  if (items.length === 0) {
    throw new Error("No bill items could be extracted. Try: 2kg atta 90rs, 1 soap 60rs.");
  }

  return {
    items,
    subtotal: money(items.reduce((sum, item) => sum + item.total, 0)),
    strategy: "deterministic",
    warnings,
  };
}
