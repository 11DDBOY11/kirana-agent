import "server-only";

import { env } from "@/lib/env";
import { currentMonthRange, lastSevenDaysRange, todayRange, type DateRange } from "@/lib/ledger/ranges";
import type { LedgerQueryType } from "@/lib/ledger/intent";
import type { BillingPipelineResult } from "@/lib/billing/types";
import type { RawInputType } from "@/lib/types";

type InvoiceRow = { subtotal: string | number; gst_total: string | number; grand_total: string | number };
type ShopkeeperRow = { id: string };

function headers(extra?: HeadersInit): HeadersInit {
  return { apikey: env.supabaseServiceRoleKey, Authorization: `Bearer ${env.supabaseServiceRoleKey}`, "Content-Type": "application/json", ...extra };
}

async function supabase<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: headers(init?.headers), cache: "no-store" });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase ledger request failed: ${response.status} - ${errText}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function total(rows: InvoiceRow[], field: keyof InvoiceRow): number {
  return Math.round(rows.reduce((sum, row) => sum + Number(row[field]), 0) * 100) / 100;
}

async function shopkeeperId(phone: string): Promise<string | null> {
  const rows = await supabase<ShopkeeperRow[]>(`shopkeepers?select=id&phone_number=eq.${encodeURIComponent(phone)}`);
  return rows[0]?.id ?? null;
}

async function invoicesFor(phone: string, range: DateRange): Promise<InvoiceRow[]> {
  const id = await shopkeeperId(phone);
  if (!id) return [];
  const query = new URLSearchParams({ select: "subtotal,gst_total,grand_total", shopkeeper_id: `eq.${id}`, created_at: `gte.${range.start.toISOString()}` });
  query.append("created_at", `lt.${range.end.toISOString()}`);
  return supabase<InvoiceRow[]>(`invoices?${query.toString()}`);
}

export async function answerLedgerQuery({ phone, query, hinglish, now = new Date() }: { phone: string; query: LedgerQueryType; hinglish: boolean; now?: Date }): Promise<string> {
  if (query === "unsupported") return hinglish ? "Main GST is mahine ka, aaj ka total, ya pichle hafte ka summary bata sakta hoon." : "I can answer this month’s GST, today’s total, or a last-7-days summary.";
  const range = query === "month_gst" ? currentMonthRange(now) : query === "today_total" ? todayRange(now) : lastSevenDaysRange(now);
  const rows = await invoicesFor(phone, range);
  if (rows.length === 0) return hinglish ? "Is period ke liye abhi koi saved bill nahi mila." : "No saved bills were found for this period.";
  const gst = total(rows, "gst_total");
  const sales = total(rows, "grand_total");
  if (query === "month_gst") return hinglish ? `Is mahine ka GST ₹${gst.toFixed(2)} hai (${rows.length} bills).` : `This month’s GST is ₹${gst.toFixed(2)} across ${rows.length} bills.`;
  if (query === "today_total") return hinglish ? `Aaj ka total sales ₹${sales.toFixed(2)} hai (${rows.length} bills).` : `Today’s total sales are ₹${sales.toFixed(2)} across ${rows.length} bills.`;
  return hinglish ? `Pichle 7 din: ${rows.length} bills, total sales ₹${sales.toFixed(2)}, GST ₹${gst.toFixed(2)}.` : `Last 7 days: ${rows.length} bills, total sales ₹${sales.toFixed(2)}, GST ₹${gst.toFixed(2)}.`;
}

export async function saveInvoice({ phone, rawInputType, result }: { phone: string; rawInputType: RawInputType; result: BillingPipelineResult }): Promise<void> {
  const shops = await supabase<ShopkeeperRow[]>("shopkeepers?on_conflict=phone_number", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ phone_number: phone }) });
  const shop = shops[0];
  if (!shop) throw new Error("Could not create the shopkeeper ledger.");
  const invoices = await supabase<Array<{ id: string }>>("invoices", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ shopkeeper_id: shop.id, raw_input_type: rawInputType, subtotal: result.gst.subtotal, gst_total: result.gst.gst_total, grand_total: result.gst.grand_total }) });
  const invoice = invoices[0];
  if (!invoice) throw new Error("Could not save the invoice.");
  await supabase<unknown>("invoice_items", { method: "POST", body: JSON.stringify(result.gst.items.map((item) => ({ invoice_id: invoice.id, name: item.name, quantity: item.quantity, unit: item.unit, unit_price: item.unit_price, gst_rate: item.gst_rate, line_total: item.total }))) });
}
