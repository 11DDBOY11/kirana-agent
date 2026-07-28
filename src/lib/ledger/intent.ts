export type LedgerQueryType = "month_gst" | "today_total" | "week_summary" | "unsupported";

export function detectIncomingIntent(body: string): "new_bill" | "query" {
  const hasPrice = /(?:₹\s*\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*(?:rs\.?|inr|₹))/i.test(body);
  const hasQuantity = /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|l|lit(?:re|er)?s?|ml|pc|pcs|piece|packet|pkt)?\b/i.test(body);
  return hasPrice && hasQuantity ? "new_bill" : "query";
}

export function detectLedgerQuery(body: string): LedgerQueryType {
  const normalized = body.toLowerCase();
  if (/(is\s*mahine|this\s*month|monthly).*(gst|tax)|(gst|tax).*(is\s*mahine|this\s*month|monthly)/i.test(normalized)) return "month_gst";
  if (/(aaj|today).*(total|sale|sales)|(total|sale|sales).*(aaj|today)/i.test(normalized)) return "today_total";
  if (/(pichle\s*hafte|last\s*(7\s*days|week)|weekly).*(summary|total|sales|gst)|(summary|total|sales|gst).*(pichle\s*hafte|last\s*(7\s*days|week)|weekly)/i.test(normalized)) return "week_summary";
  return "unsupported";
}

export function isHinglish(body: string): boolean {
  return /[\u0900-\u097f]|\b(kitna|mahine|aaj|pichle|hafte|do|batao|summary)\b/i.test(body);
}
