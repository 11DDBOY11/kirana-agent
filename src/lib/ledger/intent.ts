export type LedgerQueryType = "month_gst" | "today_total" | "week_summary" | "unsupported";
export type UserLanguage = "english" | "hinglish" | "kannada";

export function detectIncomingIntent(body: string): "new_bill" | "query" {
  // Support both standard numbers and Kannada numerals (೦-೯)
  const hasPrice = /(?:₹\s*[\d೦-೯]+(?:\.[\d೦-೯]{1,2})?|[\d೦-೯]+(?:\.[\d೦-೯]{1,2})?\s*(?:rs\.?|inr|₹|ರೂ|ರೂಪಾಯಿ))/i.test(body);
  const hasQuantity = /\b[\d೦-೯]+(?:\.[\d೦-೯]+)?\s*(?:kg|g|gm|l|lit(?:re|er)?s?|ml|pc|pcs|piece|packet|pkt|ಕೆಜಿ|ಗ್ರಾಂ|ಲೀಟರ್|ಪ್ಯಾಕೆಟ್)?\b/i.test(body);
  return hasPrice && hasQuantity ? "new_bill" : "query";
}

export function detectLedgerQuery(body: string): LedgerQueryType {
  const normalized = body.toLowerCase();
  
  // 1. Month GST
  if (
    /(is\s*mahine|this\s*month|monthly|ee\s*tingalu|tingala|thingala|ತಿಂಗಳು|ತಿಂಗಳ).*(gst|tax|ತೆರಿಗೆ|ಜಿಎಸ್ಟಿ)/i.test(normalized) ||
    /(gst|tax|ತೆರಿಗೆ|ಜಿಎಸ್ಟಿ).*(is\s*mahine|this\s*month|monthly|ee\s*tingalu|tingala|thingala|ತಿಂಗಳು|ತಿಂಗಳ)/i.test(normalized)
  ) {
    return "month_gst";
  }
  
  // 2. Today Total
  if (
    /(aaj|today|ivattu|ivattina|ಇವತ್ತು|ಇವತ್ತಿನ).*(total|sale|sales|ಒಟ್ಟು|ಖಾತೆ)/i.test(normalized) ||
    /(total|sale|sales|ಒಟ್ಟು|ಖಾತೆ).*(aaj|today|ivattu|ivattina|ಇವತ್ತು|ಇವತ್ತಿನ)/i.test(normalized)
  ) {
    return "today_total";
  }
  
  // 3. Week Summary
  if (
    /(pichle\s*hafte|last\s*(7\s*days|week)|weekly|hoda\s*vaara|vaarada|ವಾರದ|ವಾರ).*(summary|total|sales|gst|ಸಾರಾಂಶ|ಒಟ್ಟು)/i.test(normalized) ||
    /(summary|total|sales|gst|ಸಾರಾಂಶ|ಒಟ್ಟು).*(pichle\s*hafte|last\s*(7\s*days|week)|weekly|hoda\s*vaara|vaarada|ವಾರದ|ವಾರ)/i.test(normalized)
  ) {
    return "week_summary";
  }
  
  return "unsupported";
}

export function detectLanguage(body: string): UserLanguage {
  const normalized = body.toLowerCase();
  
  // Kannada script (U+0C80 to U+0CFF) or romanized Kannada keywords
  const isK = /[\u0c80-\u0cff]|\b(eshtu|ivattu|ivattina|tingalu|tingala|thingala|hoda|vaarada|vaara|helu|heli|kannada)\b/i.test(normalized);
  if (isK) return "kannada";
  
  // Hindi script (U+0900 to U+097F) or Hinglish keywords
  const isH = /[\u0900-\u097f]|\b(kitna|mahine|aaj|pichle|hafte|do|batao|summary)\b/i.test(normalized);
  if (isH) return "hinglish";
  
  return "english";
}

export function isHinglish(body: string): boolean {
  return detectLanguage(body) === "hinglish";
}
