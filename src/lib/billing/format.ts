import type { GstResult } from "@/lib/billing/types";

const rupees = (value: number) => `₹${value.toFixed(2)}`;

export function formatInvoice(gst: GstResult, flags: string[]): string {
  const rows = gst.items.map(
    (item) => `${item.name} — ${item.quantity}${item.unit} × ${rupees(item.unit_price)} = ${rupees(item.total)} | GST ${item.gst_rate}% | ${rupees(item.grand_total)}`,
  );
  const note = flags.length > 0 ? `\nNote: ${flags.join(" ")}` : "";

  return [
    "*KIRANA GST INVOICE*",
    ...rows,
    "",
    `Subtotal: ${rupees(gst.subtotal)}`,
    `CGST: ${rupees(gst.cgst_total)} | SGST: ${rupees(gst.sgst_total)}`,
    `*Grand Total: ${rupees(gst.grand_total)}*`,
    `Bill save ho gaya. Aaj ka GST: ${rupees(gst.gst_total)}`,
  ].join("\n") + note;
}
