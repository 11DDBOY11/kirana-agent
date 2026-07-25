export type TextMessageIntent = "new_bill" | "unknown";

export interface InboundWhatsAppMessage {
  from: string;
  body: string;
  mediaCount: number;
  messageSid: string | null;
}

export function parseInboundMessage(form: URLSearchParams): InboundWhatsAppMessage {
  return {
    from: form.get("From")?.trim() ?? "",
    body: form.get("Body")?.trim() ?? "",
    mediaCount: Number.parseInt(form.get("NumMedia") ?? "0", 10) || 0,
    messageSid: form.get("MessageSid"),
  };
}

/** A deliberately conservative gate until structured extraction is introduced. */
export function detectTextMessageIntent(body: string): TextMessageIntent {
  const hasPrice = /(?:₹\s*\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*(?:rs\.?|inr|₹))/i.test(body);
  const hasQuantity = /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|grams?|l|lit(?:re|er)?s?|ml|pc|pcs|piece|packet|pkt)?\b/i.test(body);
  const hasWords = /[a-z\u0900-\u097f]{2,}/i.test(body);

  return hasPrice && hasQuantity && hasWords ? "new_bill" : "unknown";
}
