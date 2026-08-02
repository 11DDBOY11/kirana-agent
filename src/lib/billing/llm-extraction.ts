import OpenAI from "openai";

import { env } from "@/lib/env";
import { extractBillFromText } from "@/lib/billing/extraction";
import type { ExtractedItem, ExtractionResult } from "@/lib/billing/types";

function client() {
  return new OpenAI({
    apiKey: env.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const GRAIN_PATTERN = /\b(atta|flour|rice|chawal|dal|pulse|sugar|cheeni|salt|namak|grain|wheat)\b/i;

function defaultUnitFor(name: string): string {
  return GRAIN_PATTERN.test(name) ? "kg" : "pc";
}

const SYSTEM_PROMPT = `You are a kirana (Indian grocery) bill extractor.
Given messy bill text (potentially Hinglish, with typos, shorthand, mixed units),
extract every line item as structured JSON.

Return ONLY valid JSON — no markdown fences, no explanation. Use this exact shape:
{
  "items": [
    { "name": "item name in lowercase", "quantity": 2, "unit": "kg", "unit_price": 45.00, "total": 90.00 }
  ]
}

Rules:
- quantity × unit_price MUST equal total for each item.
- Use lowercase English for item names, even if the input is Hindi.
- Accepted units: kg, g, l, ml, pc, packet. If unclear, omit the "unit" field.
- If a price looks like a total (e.g. "2kg atta 90rs"), the total is 90 and unit_price is 45.
- If a price looks per-unit (e.g. "atta @45rs 2kg"), unit_price is 45 and total is 90.
- Never invent items that aren't in the input. If text is ambiguous, skip the item.
- Do not include any text outside the JSON object.`;

interface LlmItem {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  unit_price?: unknown;
  total?: unknown;
}

interface LlmResponse {
  items?: unknown[];
}

function validateLlmResponse(raw: unknown): ExtractedItem[] | null {
  if (typeof raw !== "object" || raw === null) return null;
  const response = raw as LlmResponse;
  if (!Array.isArray(response.items) || response.items.length === 0) return null;

  const validated: ExtractedItem[] = [];
  for (const rawItem of response.items) {
    const item = rawItem as LlmItem;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const quantity = Number(item.quantity);
    const total = Number(item.total);
    const unit_price = Number(item.unit_price);

    if (!name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(total) || total < 0) {
      continue;
    }

    const computedUnitPrice = Number.isFinite(unit_price) && unit_price > 0 ? money(unit_price) : money(total / quantity);
    const unit = typeof item.unit === "string" && /^(kg|g|gm|l|ml|pc|pcs|piece|packet|pkt)$/i.test(item.unit)
      ? item.unit.toLowerCase().replace(/^(pcs|piece)$/, "pc").replace(/^(pkt)$/, "packet").replace(/^(gm)$/, "g")
      : defaultUnitFor(name);

    validated.push({
      name: name.toLowerCase().replace(/\s+/g, " "),
      quantity,
      unit,
      unit_price: computedUnitPrice,
      total: money(total),
    });
  }

  return validated.length > 0 ? validated : null;
}

/**
 * Extracts bill items from messy text using an LLM. Falls back to the
 * deterministic extractor if the LLM call fails or returns invalid data.
 */
export async function extractBillWithLlm(rawInput: string): Promise<ExtractionResult> {
  const warnings: string[] = [];

  try {
    const completion = await client().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawInput },
      ],
    });

    const text = completion.choices[0]?.message.content?.trim();
    if (!text) throw new Error("Empty LLM response");

    const parsed: unknown = JSON.parse(text);
    const items = validateLlmResponse(parsed);

    if (!items) {
      console.warn("[llm-extraction:invalid-response]", { text });
      throw new Error("LLM returned data that did not match the expected schema.");
    }

    console.info("[llm-extraction:success]", { itemCount: items.length });
    return {
      items,
      subtotal: money(items.reduce((sum, item) => sum + item.total, 0)),
      strategy: "llm",
      warnings,
    };
  } catch (error) {
    console.warn("[llm-extraction:fallback-to-deterministic]", error);
    warnings.push("LLM extraction failed; used deterministic fallback.");

    const deterministic = extractBillFromText(rawInput);
    return {
      ...deterministic,
      strategy: "llm-fallback-to-deterministic",
      warnings: [...deterministic.warnings, ...warnings],
    };
  }
}
