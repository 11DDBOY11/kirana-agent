import { describe, expect, it } from "vitest";
import { detectIncomingIntent, detectLedgerQuery, detectLanguage } from "./intent";

describe("intent detector tests", () => {
  it("detects bills with explicit currency markers", () => {
    expect(detectIncomingIntent("2kg atta 90rs, 1 dish soap 60rs")).toBe("new_bill");
    expect(detectIncomingIntent("2kg rice ₹100")).toBe("new_bill");
    expect(detectIncomingIntent("1 dish soap 60 rupees")).toBe("new_bill");
    expect(detectIncomingIntent("೨ ಕೆಜಿ ಅಕ್ಕಿ ೧೦೦ ರೂ")).toBe("new_bill");
  });

  it("detects bills with bare numbers following quantity+unit (loosened price check)", () => {
    expect(detectIncomingIntent("1 kg sakkare 100")).toBe("new_bill");
    expect(detectIncomingIntent("1 ಕೆಜಿ ಸಕ್ಕರೆ 45, 3 ಕೆಜಿ ಉಪ್ಪು 30")).toBe("new_bill");
    expect(detectIncomingIntent("10 pc soap 150")).toBe("new_bill");
    expect(detectIncomingIntent("1l milk 60")).toBe("new_bill");
  });

  it("detects ledger queries", () => {
    expect(detectIncomingIntent("aaj ka total")).toBe("query");
    expect(detectIncomingIntent("is mahine ka GST")).toBe("query");
    expect(detectIncomingIntent("pichle hafte ka summary")).toBe("query");
    expect(detectIncomingIntent("ಇವತ್ತಿನ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?")).toBe("query");
  });

  it("detects query types correctly", () => {
    expect(detectLedgerQuery("aaj ka total kitna hua")).toBe("today_total");
    expect(detectLedgerQuery("is mahine ka GST kitna hua")).toBe("month_gst");
    expect(detectLedgerQuery("pichle hafte ka summary do")).toBe("week_summary");
    expect(detectLedgerQuery("kuch bhi query")).toBe("unsupported");
  });

  it("detects language correctly", () => {
    expect(detectLanguage("ಇವತ್ತಿನ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?")).toBe("kannada");
    expect(detectLanguage("aaj ka total kitna hua")).toBe("hinglish");
    expect(detectLanguage("what is today's total?")).toBe("english");
  });
});
