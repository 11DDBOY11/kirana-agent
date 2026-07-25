export type RawInputType = "text" | "voice" | "photo";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  shopkeeperId: string;
  rawInputType: RawInputType;
  createdAt: string;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
}
