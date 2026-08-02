import type { GstResult } from "@/lib/billing/types";

const rupees = (value: number) => `₹${value.toFixed(2)}`;

export function formatInvoice(
  gst: GstResult,
  flags: string[],
  language: "english" | "hinglish" | "kannada" = "hinglish"
): string {
  const rows = gst.items.map(
    (item) => `${item.name} — ${item.quantity}${item.unit} × ${rupees(item.unit_price)} = ${rupees(item.total)} | GST ${item.gst_rate}% | ${rupees(item.grand_total)}`,
  );
  
  const note = flags.length > 0
    ? (language === "kannada"
        ? `\nಗಮನಿಸಿ (Note): ${flags.join(" ")}`
        : `\nNote: ${flags.join(" ")}`)
    : "";

  let header = "*KIRANA GST INVOICE*";
  let subtotalLabel = "Subtotal";
  let totalLabel = "Grand Total";
  let savedMessage = `Bill save ho gaya. Aaj ka GST: ${rupees(gst.gst_total)}`;

  if (language === "kannada") {
    header = "*ಕಿರಣಾ ಜಿಎಸ್ಟಿ ಬಿಲ್*";
    subtotalLabel = "ಉಪಮೊತ್ತ (Subtotal)";
    totalLabel = "ಒಟ್ಟು ಮೊತ್ತ (Grand Total)";
    savedMessage = `ಬಿಲ್ಲು ಉಳಿಸಲಾಗಿದೆ. ಇವತ್ತಿನ ಜಿಎಸ್ಟಿ: ${rupees(gst.gst_total)}`;
  } else if (language === "english") {
    savedMessage = `Bill saved. Today's GST: ${rupees(gst.gst_total)}`;
  }

  return [
    header,
    ...rows,
    "",
    `${subtotalLabel}: ${rupees(gst.subtotal)}`,
    `CGST: ${rupees(gst.cgst_total)} | SGST: ${rupees(gst.sgst_total)}`,
    `*${totalLabel}: ${rupees(gst.grand_total)}*`,
    savedMessage,
  ].join("\n") + note;
}
