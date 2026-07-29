export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface ExtractionResult {
  items: ExtractedItem[];
  subtotal: number;
  strategy: "deterministic" | "llm" | "llm-fallback-to-deterministic";
  warnings: string[];
}

export interface TaxedItem extends ExtractedItem {
  gst_rate: number;
  cgst: number;
  sgst: number;
  grand_total: number;
  gst_confidence: "known" | "defaulted";
}

export interface GstResult {
  items: TaxedItem[];
  subtotal: number;
  gst_total: number;
  cgst_total: number;
  sgst_total: number;
  grand_total: number;
  warnings: string[];
}

export interface ReviewResult {
  pass: "agentic-review";
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  flags: string[];
}

export interface BillingPipelineResult {
  rawInput: string;
  extraction: ExtractionResult;
  gst: GstResult;
  review: ReviewResult;
  invoiceText: string;
}
