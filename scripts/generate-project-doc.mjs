// Generate project documentation in DOCX format
// Run: node scripts/generate-project-doc.mjs

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak,
} from "docx";
import { writeFileSync } from "node:fs";

// ─── Styling helpers ──────────────────────────────────────────

const COLORS = { green: "39704A", dark: "1E2A22", gray: "526257", white: "FFFFFF", bg: "EEF5ED", border: "B9C7BA" };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, color: COLORS.dark, font: "Calibri" })] });
}

function body(text, opts = {}) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, font: "Calibri", size: 22, color: COLORS.dark, ...opts })] });
}

function bullet(text, level = 0) {
  return new Paragraph({ bullet: { level }, spacing: { after: 60 }, children: [new TextRun({ text, font: "Calibri", size: 22, color: COLORS.dark })] });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function labelValue(label, value) {
  return new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: `${label}: `, bold: true, font: "Calibri", size: 22, color: COLORS.green }),
    new TextRun({ text: value, font: "Calibri", size: 22, color: COLORS.dark }),
  ]});
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
};

function headerCell(text) {
  return new TableCell({
    borders: cellBorders,
    shading: { type: ShadingType.SOLID, color: COLORS.green },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: COLORS.white, font: "Calibri", size: 20 })] })],
  });
}

function dataCell(text) {
  return new TableCell({
    borders: cellBorders,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Calibri", size: 20, color: COLORS.dark })] })],
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)) }),
      ...rows.map(row => new TableRow({ children: row.map(cell => dataCell(cell)) })),
    ],
  });
}

// ─── Document content ─────────────────────────────────────────

const doc = new Document({
  creator: "Kirana Agent Team",
  title: "Kirana WhatsApp Billing Agent — Project Document",
  description: "Complete project decisions, architecture, and implementation details",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: COLORS.dark } } },
  },
  sections: [{
    properties: {},
    children: [

      // ═══════════════════════════════════════════════════════
      // TITLE PAGE
      // ═══════════════════════════════════════════════════════

      emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "KIRANA WHATSAPP BILLING & GST AGENT", bold: true, font: "Calibri", size: 52, color: COLORS.green }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: "Project Documentation", font: "Calibri", size: 32, color: COLORS.gray }),
      ]}),
      emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Hackathon Submission — Deadline: August 3, 2026", font: "Calibri", size: 24, color: COLORS.dark }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: `Document generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, font: "Calibri", size: 22, color: COLORS.gray }),
      ]}),
      emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Repository: github.com/11DDBOY11/kirana-agent", font: "Calibri", size: 22, color: COLORS.green, italics: true }),
      ]}),

      // ═══════════════════════════════════════════════════════
      // TABLE OF CONTENTS (manual)
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("Table of Contents"),
      ...[
        "1. Project Overview",
        "2. Problem Statement",
        "3. Technology Stack Decisions",
        "4. Architecture Overview",
        "5. Database Design Decisions",
        "6. Implementation Stages & Decisions",
        "7. Billing Pipeline — Design Decisions",
        "8. Media Processing — Design Decisions",
        "9. Ledger Query System — Design Decisions",
        "10. LLM Extraction — Design Decisions",
        "11. Security Decisions",
        "12. Testing Strategy Decisions",
        "13. File Structure",
        "14. API Reference",
        "15. Environment Variables",
        "16. Deployment Decisions",
        "17. Known Limitations & Future Work",
      ].map(t => body(t)),

      // ═══════════════════════════════════════════════════════
      // 1. PROJECT OVERVIEW
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("1. Project Overview"),
      body("Kirana WhatsApp Billing & GST Agent is a WhatsApp-first billing assistant built for Indian kirana (neighbourhood grocery) store owners. The target user is a shopkeeper who is comfortable with WhatsApp but may not use any billing app or dashboard."),
      emptyLine(),
      body("The shopkeeper sends a bill through WhatsApp — as typed text, a voice note, or a photo of a handwritten bill — and receives back a formatted GST invoice. Every invoice is automatically saved to a ledger that the shopkeeper can query in plain Hindi/Hinglish/English (e.g. \"Is mahine ka GST kitna hua?\")."),
      emptyLine(),
      labelValue("Target Users", "Indian kirana store owners"),
      labelValue("Primary Interface", "WhatsApp (no app download, no dashboard)"),
      labelValue("Supported Inputs", "Text bills, voice notes, bill photos"),
      labelValue("Supported Queries", "Monthly GST, daily total, weekly summary"),
      labelValue("Languages", "Hindi, Hinglish (Hindi + English), English"),

      // ═══════════════════════════════════════════════════════
      // 2. PROBLEM STATEMENT
      // ═══════════════════════════════════════════════════════

      heading("2. Problem Statement"),
      body("Indian kirana stores generate millions of transactions daily, but most operate without any digital billing system. The challenges are:"),
      bullet("Shopkeepers find dedicated billing apps too complex or slow"),
      bullet("GST compliance requires proper slab-wise tax calculation (0%, 5%, 12%, 18%, 28%)"),
      bullet("Handwritten bills are error-prone and difficult to aggregate"),
      bullet("Most shopkeepers already use WhatsApp daily — it is the natural interface"),
      bullet("Queries like \"how much GST this month?\" require manual register counting"),
      emptyLine(),
      body("Our solution meets shopkeepers where they already are — WhatsApp — and handles the entire workflow: bill input → extraction → GST calculation → invoice generation → ledger storage → natural language queries."),

      // ═══════════════════════════════════════════════════════
      // 3. TECHNOLOGY STACK DECISIONS
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("3. Technology Stack Decisions"),
      body("The technology stack was chosen before implementation began, optimizing for rapid hackathon development, serverless deployment, and WhatsApp integration maturity."),
      emptyLine(),

      makeTable(
        ["Technology", "Choice", "Rationale"],
        [
          ["Framework", "Next.js 16 App Router + TypeScript", "Server-side API routes + static landing page in one project. TypeScript for type safety across billing types."],
          ["Database", "Supabase (Postgres)", "Managed Postgres with REST API, instant setup, row-level security. No ORM needed — direct REST calls with service role key."],
          ["WhatsApp", "Twilio WhatsApp Sandbox", "Production-grade webhook infrastructure. Signature validation built-in. Sandbox allows testing without WhatsApp Business approval."],
          ["AI/ML", "OpenAI (gpt-4o-mini, gpt-4o-transcribe)", "Transcription for voice notes, vision for bill photos, structured extraction for messy text. Single vendor simplifies API key management."],
          ["Deployment", "Vercel", "Zero-config Next.js deployment. Automatic HTTPS. Environment variable management. Free tier sufficient for hackathon."],
          ["Styling", "Tailwind CSS v4", "Utility-first, ships with Next.js. Fast iteration on landing page and debug console."],
          ["Testing", "Vitest", "Fast, TypeScript-native, compatible with the project's module resolution."],
        ],
      ),

      emptyLine(),
      heading("Key Decision: Why Not a Mobile App?", HeadingLevel.HEADING_3),
      body("Decision: WhatsApp-only, no mobile app or web dashboard."),
      body("Rationale: Kirana shopkeepers already use WhatsApp. Adding a separate app creates friction (download, login, onboarding). WhatsApp as the sole interface means zero onboarding — shopkeepers just send a message."),

      heading("Key Decision: Why Supabase over Firebase?", HeadingLevel.HEADING_3),
      body("Decision: Supabase (Postgres) over Firebase (Firestore)."),
      body("Rationale: SQL aggregation queries (SUM, COUNT over date ranges) are critical for ledger queries. Postgres handles these natively. Firestore would require client-side aggregation or Cloud Functions."),

      heading("Key Decision: Why OpenAI over Gemini/Claude?", HeadingLevel.HEADING_3),
      body("Decision: OpenAI for all AI tasks (transcription, vision, extraction)."),
      body("Rationale: Single API key, unified billing, proven Whisper-based transcription. gpt-4o-mini is cost-effective for structured extraction. Using one provider reduces integration complexity under hackathon time pressure."),

      // ═══════════════════════════════════════════════════════
      // 4. ARCHITECTURE OVERVIEW
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("4. Architecture Overview"),
      body("The system follows a simple pipeline architecture with a single entry point (Twilio webhook) and a shared billing pipeline that all input types flow through."),
      emptyLine(),
      heading("Request Flow", HeadingLevel.HEADING_3),
      body("1. WhatsApp message → Twilio → POST /api/twilio/whatsapp"),
      body("2. Signature validation (HMAC-SHA1)"),
      body("3. Intent detection: is this a NEW BILL or a LEDGER QUERY?"),
      body("4a. Bill path: Extract items → Calculate GST → Agentic review → Format invoice → Save to Supabase → Reply"),
      body("4b. Query path: Parse date range → Aggregate from Supabase → Reply in same language"),
      emptyLine(),
      heading("Shared Pipeline Principle", HeadingLevel.HEADING_3),
      body("Decision: The /dev/test debug console calls the EXACT SAME pipeline functions as the Twilio webhook."),
      body("Rationale: No logic duplication. If the debug console works, the production path works. This was enforced from the very first pipeline commit and maintained throughout."),

      // ═══════════════════════════════════════════════════════
      // 5. DATABASE DESIGN DECISIONS
      // ═══════════════════════════════════════════════════════

      heading("5. Database Design Decisions"),
      body("The database schema was designed in the first commit and has remained stable throughout all implementation stages."),
      emptyLine(),

      makeTable(
        ["Table", "Purpose", "Key Columns"],
        [
          ["shopkeepers", "Phone number registry, auto-created on first bill", "id (UUID), phone_number (unique, format-validated), name, created_at"],
          ["invoices", "Bill-level totals and metadata", "id, shopkeeper_id (FK), raw_input_type (text/voice/photo), subtotal, gst_total, grand_total, created_at"],
          ["invoice_items", "Line-level item detail", "id, invoice_id (FK, cascade delete), name, quantity, unit, unit_price, gst_rate, line_total"],
        ],
      ),

      emptyLine(),
      heading("Design Decisions", HeadingLevel.HEADING_3),
      bullet("Phone number format validation: Regex constraint ensures whatsapp:+XXXXXXXXX format"),
      bullet("GST rate stored per item: Allows future re-categorization without recalculating"),
      bullet("Allowed GST rates constrained: CHECK constraint limits to 0, 5, 12, 18, 28 — the actual Indian GST slabs"),
      bullet("Numeric precision: 12,2 for money, 12,3 for quantity (supports fractional kg)"),
      bullet("Row Level Security enabled: No anonymous access even if credentials leak"),
      bullet("Cascade delete on invoice_items: Deleting an invoice cleans up its items"),
      bullet("Index on (shopkeeper_id, created_at DESC): Optimizes ledger date-range queries"),
      bullet("Default unit is 'pc': Conservative default, overridden for grains/flour/rice → 'kg'"),

      // ═══════════════════════════════════════════════════════
      // 6. IMPLEMENTATION STAGES & DECISIONS
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("6. Implementation Stages & Decisions"),
      body("The project was built incrementally across clearly separated stages. Each stage was committed and tested before proceeding."),
      emptyLine(),

      heading("Stage 1: Foundation (commit 879bd60)", HeadingLevel.HEADING_3),
      labelValue("What was built", "Next.js scaffold, Supabase schema, environment configuration, landing page"),
      labelValue("Key decision", "Server-only Supabase client with `server-only` import guard — prevents any database credential from reaching the browser bundle"),
      labelValue("Key decision", "Lazy getter pattern for env vars — variables are only accessed when needed, not at module load time. This prevents crashes when not all vars are configured yet."),

      emptyLine(),
      heading("Stage 2: Twilio WhatsApp Webhook (commit b71a983)", HeadingLevel.HEADING_3),
      labelValue("What was built", "POST /api/twilio/whatsapp with HMAC-SHA1 signature validation"),
      labelValue("Key decision", "Validate EVERY request — even in development. No bypass for convenience. The sorted-params + HMAC approach matches Twilio's documented algorithm exactly."),
      labelValue("Key decision", "Return TwiML XML — Twilio requires XML responses, not JSON. A dedicated twimlMessage() helper with proper XML escaping prevents injection."),
      labelValue("Key decision", "Conservative intent detection — only classify as a bill if it has BOTH a price pattern AND a quantity pattern AND word content. Everything else falls through as unknown/query."),

      emptyLine(),
      heading("Stage 3: Shared Billing Pipeline (commit 2107b66)", HeadingLevel.HEADING_3),
      labelValue("What was built", "extraction.ts, gst.ts, review.ts, format.ts, pipeline.ts + /dev/test debug console"),
      bullet("Deterministic regex extractor as baseline — deliberately labelled 'deterministic' strategy"),
      bullet("GST slab lookup by keyword matching (soap→18%, atta→5%, milk→0%, etc.)"),
      bullet("Agentic review pass with 4 named checks — never silently changes values, only validates"),
      bullet("Debug console at /dev/test — token-protected in production, calls the SAME pipeline"),
      emptyLine(),
      labelValue("Key decision", "Deterministic-first extraction — reliable, testable, no API dependency. LLM extraction added later as an enhancement, not a requirement."),
      labelValue("Key decision", "Agentic review as a DISTINCT PASS — the review module receives the calculated GST result and independently re-verifies all arithmetic. It has named checks (line math, subtotal, GST split, grand total) that each produce a pass/fail with explanation. This pattern was preserved when LLM extraction was added later."),
      labelValue("Key decision", "Unknown GST categories default to 5% WITH a visible warning — the system never hides uncertainty. The warning propagates to the final invoice text."),
      labelValue("Key decision", "Money rounding — all financial calculations use Math.round((value + Number.EPSILON) * 100) / 100 to avoid floating-point drift. CGST/SGST split handles odd-paise rounding by computing sgst = gst - cgst."),

      emptyLine(),
      heading("Stage 4: Voice & Photo Processing (commit 7edd141)", HeadingLevel.HEADING_3),
      labelValue("What was built", "Twilio media download, OpenAI transcription (voice), OpenAI vision (photo), clear error messages"),
      bullet("Voice notes: OpenAI gpt-4o-transcribe with Hindi/Hinglish prompt"),
      bullet("Bill photos: OpenAI gpt-4o-mini vision with structured output prompt"),
      bullet("Both outputs feed into the SAME text extraction → GST → review → format pipeline"),
      emptyLine(),
      labelValue("Key decision", "25 MB file size limit — checked BOTH via Content-Length header AND actual byte count to prevent bypasses"),
      labelValue("Key decision", "Media type detection happens BEFORE download — rejects unsupported types (PDF, etc.) immediately with a clear Hinglish message"),
      labelValue("Key decision", "Error messages in Hinglish — 'Voice note samajh nahi aaya. Kripya thoda slowly bolkar dobara bhejiye.' is more useful to the target user than an English error."),
      labelValue("Key decision", "Single media attachment per message — simplifies processing and matches typical WhatsApp usage"),

      emptyLine(),
      heading("Stage 5: Ledger Queries (built alongside Stages 3-4)", HeadingLevel.HEADING_3),
      labelValue("What was built", "Intent detection, date range computation, Supabase aggregation, bilingual responses"),
      bullet("Detects whether incoming text is a bill or a query using price+quantity heuristic"),
      bullet("Supports 3 query types: this month's GST, today's total, last 7 days summary"),
      bullet("India timezone (IST +5:30) aware date ranges — midnight calculations account for the UTC offset"),
      bullet("Responds in the same language style the shopkeeper used (Hindi/Hinglish/English)"),
      emptyLine(),
      labelValue("Key decision", "NEVER fabricate numbers — if no data exists for the queried period, the system says 'Is period ke liye abhi koi saved bill nahi mila' instead of returning zero or making something up"),
      labelValue("Key decision", "India-aware date boundaries — uses Intl.DateTimeFormat with Asia/Kolkata timezone to correctly determine the Indian calendar date, even when the UTC date differs. Tests verify this at UTC month boundaries (e.g., June 30 20:00 UTC = July 1 01:30 IST)."),
      labelValue("Key decision", "Shopkeeper auto-creation on first bill — uses Supabase upsert (on_conflict=phone_number) so the shopkeeper row is created automatically when their first bill arrives. No separate registration step needed."),
      labelValue("Key decision", "Direct REST calls to Supabase — not using the JS client library for ledger queries. This avoids bundling the full @supabase/supabase-js in API routes and gives precise control over query parameters."),

      // ═══════════════════════════════════════════════════════
      // 7. BILLING PIPELINE — DESIGN DECISIONS
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("7. Billing Pipeline — Design Decisions"),
      body("The billing pipeline is the core of the system. Every bill — text, voice, or photo — flows through the same sequence of functions."),
      emptyLine(),
      heading("Pipeline Stages", HeadingLevel.HEADING_3),

      makeTable(
        ["Stage", "Module", "Input → Output"],
        [
          ["1. Extraction", "extraction.ts / llm-extraction.ts", "Raw text → ExtractedItem[] (name, qty, unit, price, total)"],
          ["2. GST Calculation", "gst.ts", "ExtractedItem[] → TaxedItem[] (adds gst_rate, cgst, sgst, grand_total)"],
          ["3. Agentic Review", "review.ts", "GstResult → ReviewResult (4 named checks, pass/fail)"],
          ["4. Formatting", "format.ts", "GstResult + flags → WhatsApp invoice text"],
          ["5. Orchestration", "pipeline.ts", "Coordinates all stages, logging at each step"],
        ],
      ),

      emptyLine(),
      heading("GST Slab Assignment", HeadingLevel.HEADING_3),
      body("GST rates are assigned by keyword matching against known product categories:"),
      makeTable(
        ["GST Rate", "Product Keywords"],
        [
          ["0%", "milk, fresh vegetable, vegetable, fruit, egg"],
          ["5%", "atta, flour, rice, dal, pulse, tea, coffee, biscuit, namkeen, sugar, salt, oil"],
          ["12%", "butter, ghee, cheese, juice"],
          ["18%", "soap, detergent, shampoo, toothpaste, dishwash, dish soap"],
          ["28%", "cold drink, aerated, chips, pan masala"],
          ["Default (5%)", "Any unrecognized item — with explicit warning"],
        ],
      ),

      emptyLine(),
      heading("Agentic Review Checks", HeadingLevel.HEADING_3),
      body("The review pass independently verifies all arithmetic without modifying any values:"),
      makeTable(
        ["Check Name", "What It Verifies", "Tolerance"],
        [
          ["Line item math", "quantity × unit_price = line total", "±₹0.01 (one paise)"],
          ["Subtotal", "Sum of all line totals = subtotal", "Exact match"],
          ["GST split", "total × rate% = CGST + SGST for each item", "Exact match after rounding"],
          ["Grand total", "subtotal + GST total = grand total", "Exact match"],
        ],
      ),

      // ═══════════════════════════════════════════════════════
      // 8. MEDIA PROCESSING — DESIGN DECISIONS
      // ═══════════════════════════════════════════════════════

      heading("8. Media Processing — Design Decisions"),

      heading("Voice Note Processing", HeadingLevel.HEADING_3),
      bullet("Model: gpt-4o-transcribe (OpenAI's latest transcription model)"),
      bullet("Prompt context: 'This is an Indian kirana shop bill spoken in Hindi, Hinglish, or English. Preserve item names, quantities, units, and prices.'"),
      bullet("Supported formats: OGG (WhatsApp default), MP3, M4A, WebM, WAV, MPEG"),
      bullet("Output: Plain text that feeds into the text extraction pipeline"),

      emptyLine(),
      heading("Bill Photo Processing", HeadingLevel.HEADING_3),
      bullet("Model: gpt-4o-mini (vision capable, cost-effective)"),
      bullet("Resolution: 'high' detail for reading handwritten text"),
      bullet("Prompt: Returns comma-separated list in standardized format (2kg atta 90rs, 1 soap 60rs)"),
      bullet("Key instruction to model: 'Do not invent illegible items; omit them' — prevents hallucinated line items"),
      bullet("Image sent as base64 data URL to avoid external URL hosting"),

      emptyLine(),
      heading("Error Handling Philosophy", HeadingLevel.HEADING_3),
      body("Decision: Every error message is in Hinglish, actionable, and specific."),
      makeTable(
        ["Scenario", "Message"],
        [
          ["Unsupported file type", "Photo ya voice note bhejiye. Other file types abhi supported nahi hain."],
          ["File too large", "File 25 MB se chhoti bhejiye."],
          ["Voice unclear", "Voice note samajh nahi aaya. Kripya thoda slowly bolkar dobara bhejiye."],
          ["Photo unreadable", "Photo clearly read nahi ho payi. Kripya bright light mein seedhi photo dobara bhejiye."],
          ["Math issue in bill", "Bill mein kuch math issue mila. Kripya items aur price dobara bhejiye."],
          ["General failure", "Abhi bill process nahi ho paya. Kripya 1 minute mein dobara bhejiye."],
        ],
      ),

      // ═══════════════════════════════════════════════════════
      // 9. LEDGER QUERY SYSTEM
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("9. Ledger Query System — Design Decisions"),

      heading("Intent Classification", HeadingLevel.HEADING_3),
      body("Decision: Use a two-layer heuristic, not an LLM, for intent classification."),
      body("Rationale: LLM calls add latency and cost. The bill-vs-query distinction is reliably detectable: if the message has BOTH a price pattern (₹XX or XXrs) AND a quantity pattern (Xkg, X pc, etc.), it's a bill. Everything else is treated as a query. This is fast, deterministic, and free."),

      emptyLine(),
      heading("Supported Query Types", HeadingLevel.HEADING_3),
      makeTable(
        ["Query Type", "Detection Pattern", "Example Input"],
        [
          ["month_gst", "'is mahine' or 'this month' + 'gst' or 'tax'", "Is mahine ka GST kitna hua?"],
          ["today_total", "'aaj' or 'today' + 'total' or 'sale'", "Aaj ka total kitna hua?"],
          ["week_summary", "'pichle hafte' or 'last week' + 'summary'", "Pichle hafte ka summary do"],
          ["unsupported", "No pattern matched", "Anything else → helpful fallback message"],
        ],
      ),

      emptyLine(),
      heading("Date Range Computation", HeadingLevel.HEADING_3),
      body("Critical decision: All date calculations use Indian Standard Time (IST, UTC+5:30)."),
      body("Why this matters: A query at 11:30 PM IST on July 31 is July 31 in India but already August 1 in UTC. Using UTC directly would put that day's transactions in the wrong month."),
      emptyLine(),
      bullet("indiaDateParts(now) — uses Intl.DateTimeFormat with Asia/Kolkata timezone to get the correct Indian calendar date"),
      bullet("indiaMidnight(year, month, day) — computes midnight IST as a UTC timestamp (subtracts 5h30m from the UTC date)"),
      bullet("All ranges are [start, end) — inclusive start, exclusive end"),
      bullet("'Last 7 days' includes today and the previous 6 full Indian calendar days"),

      emptyLine(),
      heading("Language Detection", HeadingLevel.HEADING_3),
      body("Decision: Detect Hinglish using Devanagari Unicode range + common Hindi keywords."),
      body("The isHinglish() function checks for: Devanagari characters (U+0900–U+097F) or keywords like kitna, mahine, aaj, pichle, hafte, do, batao, summary. Response language matches: if Hinglish detected, reply in Hinglish; otherwise reply in English."),

      // ═══════════════════════════════════════════════════════
      // 10. LLM EXTRACTION — DESIGN DECISIONS
      // ═══════════════════════════════════════════════════════

      heading("10. LLM Extraction — Design Decisions"),
      body("This was the final major feature addition, replacing the deterministic regex extractor as the default for handling messy real-world input."),
      emptyLine(),

      heading("Why LLM Extraction Was Needed", HeadingLevel.HEADING_3),
      bullet("Real shopkeeper input has typos: 'aata' instead of 'atta', '2 kilo chawal' instead of '2kg rice'"),
      bullet("Mixed Hindi/English: '2kg aata 90 rupay, 1 surf 60rs'"),
      bullet("Shorthand: 'dal 50, chawal 100' (implicit 1 unit, price is the total)"),
      bullet("Voice transcription output is messy natural language, not clean formatted text"),
      bullet("The regex extractor pattern is rigid — it requires specific format: quantity+unit+name+price"),

      emptyLine(),
      heading("Architecture Decision: LLM with Deterministic Fallback", HeadingLevel.HEADING_3),
      body("Decision: Try LLM first, fall back to deterministic on ANY failure."),
      body("Rationale: The LLM handles messy input far better, but it can fail (network issues, rate limits, malformed responses). The deterministic extractor still works for well-formatted input. By falling back silently (with a warning flag), the pipeline never breaks even if OpenAI is down."),
      emptyLine(),
      bullet("LLM extractor: gpt-4o-mini, temperature 0, structured JSON output"),
      bullet("Response validation: Every field is type-checked and range-validated"),
      bullet("Unit normalization: 'pcs'→'pc', 'pkt'→'packet', 'gm'→'g'"),
      bullet("Grain default preserved: If LLM omits unit for rice/atta/dal, defaults to 'kg' (Step C fix)"),
      bullet("Fallback: On JSON parse error, empty response, or schema mismatch → deterministic extractor"),
      bullet("Strategy field: 'llm' or 'deterministic' — always transparent about which path was used"),

      emptyLine(),
      heading("Pipeline Changes", HeadingLevel.HEADING_3),
      body("Decision: Make runTextBillingPipeline() async with a useLlm parameter."),
      body("The useLlm parameter (default: true) allows tests to bypass the LLM call entirely. This means:"),
      bullet("CI/automated tests: useLlm=false → fast, offline, no API key needed"),
      bullet("Production: useLlm=true → LLM extraction with automatic fallback"),
      bullet("Manual pre-demo test: Set OPENAI_API_KEY and run tests → LLM integration test executes"),

      // ═══════════════════════════════════════════════════════
      // 11. SECURITY DECISIONS
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("11. Security Decisions"),

      makeTable(
        ["Concern", "Decision", "Implementation"],
        [
          ["Secret exposure", "No NEXT_PUBLIC_ prefix on any secret", "All env vars accessed server-side only via env.ts getters"],
          ["Database access", "Service role key server-only", "supabase/server.ts has `import 'server-only'` — Next.js will error if imported in client bundle"],
          ["Ledger service", "Server-only guard", "ledger/service.ts has `import 'server-only'`"],
          ["Webhook auth", "Twilio HMAC-SHA1 signature validation on every request", "signature.ts: sorted params → HMAC → timing-safe compare"],
          ["Debug console", "Token-gated in production", "DEV_TEST_ACCESS_TOKEN env var required; x-dev-test-token header checked"],
          ["Debug console (dev)", "Open in development", "process.env.NODE_ENV !== 'production' bypasses token check"],
          ["Row Level Security", "Enabled on all tables", "No anonymous Supabase access even with leaked credentials"],
          ["Media size", "25 MB limit", "Checked BOTH Content-Length header and actual byte array length"],
          ["Input validation", "Twilio signature checked BEFORE any processing", "Prevents unauthorized webhook calls"],
        ],
      ),

      // ═══════════════════════════════════════════════════════
      // 12. TESTING STRATEGY DECISIONS
      // ═══════════════════════════════════════════════════════

      heading("12. Testing Strategy Decisions"),
      body("Decision: Offline-first tests with optional online integration tests."),
      emptyLine(),

      makeTable(
        ["Test Suite", "File", "Tests", "Requires API Key?"],
        [
          ["Text billing pipeline (deterministic)", "pipeline.test.ts", "3 tests — common bill, unknown category warning, grain kg default", "No"],
          ["Text billing pipeline (LLM integration)", "pipeline.test.ts", "1 test — messy Hinglish input via OpenAI", "Yes (auto-skips if missing)"],
          ["Twilio media classification", "twilio-media.test.ts", "2 tests — MIME type detection, unsupported type rejection", "No"],
          ["Indian ledger date ranges", "ranges.test.ts", "2 tests — UTC month boundary, 7-day range crossing year boundary", "No"],
        ],
      ),

      emptyLine(),
      body("The LLM integration test uses Vitest's describe.skipIf() to automatically skip when OPENAI_API_KEY is not set. This allows:"),
      bullet("CI runs: All 7 deterministic tests pass without any API key"),
      bullet("Pre-demo validation: Set the key and run tests → 8 tests including real OpenAI call"),
      bullet("The integration test has a 30-second timeout to accommodate API latency"),

      // ═══════════════════════════════════════════════════════
      // 13. FILE STRUCTURE
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("13. File Structure"),
      body("src/"),
      body("├── app/"),
      body("│   ├── api/"),
      body("│   │   ├── dev/test/route.ts         — Debug console API (token-gated)"),
      body("│   │   └── twilio/whatsapp/route.ts   — WhatsApp webhook (signature-validated)"),
      body("│   ├── dev/test/page.tsx               — Debug console UI (text/voice/photo)"),
      body("│   ├── page.tsx                        — Public landing page"),
      body("│   ├── layout.tsx                      — Root layout"),
      body("│   └── globals.css                     — Global styles"),
      body("├── lib/"),
      body("│   ├── billing/"),
      body("│   │   ├── types.ts                    — Shared type definitions"),
      body("│   │   ├── extraction.ts               — Deterministic regex extractor"),
      body("│   │   ├── llm-extraction.ts           — LLM-based extractor (gpt-4o-mini)"),
      body("│   │   ├── gst.ts                      — GST slab lookup and calculation"),
      body("│   │   ├── review.ts                   — Agentic review (4 named checks)"),
      body("│   │   ├── format.ts                   — WhatsApp invoice formatter"),
      body("│   │   ├── pipeline.ts                 — Pipeline orchestrator"),
      body("│   │   └── pipeline.test.ts            — Pipeline tests (deterministic + LLM)"),
      body("│   ├── ledger/"),
      body("│   │   ├── intent.ts                   — Bill vs query classification"),
      body("│   │   ├── ranges.ts                   — IST-aware date range computation"),
      body("│   │   ├── ranges.test.ts              — Date boundary tests"),
      body("│   │   └── service.ts                  — Ledger queries + invoice saving"),
      body("│   ├── media/"),
      body("│   │   ├── openai-media.ts             — Voice transcription + photo vision"),
      body("│   │   ├── twilio-media.ts             — Media download + type detection"),
      body("│   │   └── twilio-media.test.ts        — Media classification tests"),
      body("│   ├── twilio/"),
      body("│   │   ├── signature.ts                — HMAC-SHA1 signature validation"),
      body("│   │   └── twiml.ts                    — TwiML XML response builder"),
      body("│   ├── whatsapp/"),
      body("│   │   └── inbound.ts                  — Inbound message parser"),
      body("│   ├── supabase/"),
      body("│   │   └── server.ts                   — Server-only Supabase client"),
      body("│   ├── env.ts                          — Environment variable accessors"),
      body("│   └── types.ts                        — Shared domain types"),
      body("└── supabase/"),
      body("    └── schema.sql                      — Database DDL"),

      // ═══════════════════════════════════════════════════════
      // 14. API REFERENCE
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("14. API Reference"),

      heading("POST /api/twilio/whatsapp", HeadingLevel.HEADING_3),
      body("Twilio WhatsApp webhook endpoint. Receives form-encoded POST from Twilio."),
      labelValue("Auth", "X-Twilio-Signature header (HMAC-SHA1)"),
      labelValue("Content-Type", "application/x-www-form-urlencoded"),
      labelValue("Response", "text/xml (TwiML)"),
      labelValue("Handles", "Text bills, voice notes, bill photos, ledger queries"),
      emptyLine(),

      heading("GET /api/twilio/whatsapp", HeadingLevel.HEADING_3),
      body("Health check endpoint. Returns { status: 'ok', service: 'kirana-whatsapp-webhook' }."),
      emptyLine(),

      heading("POST /api/dev/test", HeadingLevel.HEADING_3),
      body("Debug console API. Accepts text or media uploads and returns full pipeline result."),
      labelValue("Auth", "x-dev-test-token header (required in production)"),
      labelValue("Text input", "Content-Type: application/json, body: { text: 'bill text' }"),
      labelValue("Media input", "Content-Type: multipart/form-data, field: media (audio/image file)"),
      labelValue("Response", "JSON: { rawInput, extraction, gst, review, invoiceText }"),

      // ═══════════════════════════════════════════════════════
      // 15. ENVIRONMENT VARIABLES
      // ═══════════════════════════════════════════════════════

      heading("15. Environment Variables"),

      makeTable(
        ["Variable", "Required", "Description"],
        [
          ["SUPABASE_URL", "Yes", "Supabase project URL"],
          ["SUPABASE_SERVICE_ROLE_KEY", "Yes", "Service role key (server-side only, bypasses RLS)"],
          ["TWILIO_ACCOUNT_SID", "Yes", "Twilio Account SID"],
          ["TWILIO_AUTH_TOKEN", "Yes", "Twilio Auth Token (used for signature validation + media download)"],
          ["TWILIO_WHATSAPP_NUMBER", "Yes", "Twilio WhatsApp Sandbox number"],
          ["TWILIO_WEBHOOK_BASE_URL", "Yes", "Public HTTPS origin (no trailing slash)"],
          ["OPENAI_API_KEY", "Yes", "OpenAI API key for transcription, vision, LLM extraction"],
          ["DEV_TEST_ACCESS_TOKEN", "Production", "Protects /dev/test in production deployments"],
        ],
      ),

      // ═══════════════════════════════════════════════════════
      // 16. DEPLOYMENT DECISIONS
      // ═══════════════════════════════════════════════════════

      heading("16. Deployment Decisions"),
      labelValue("Platform", "Vercel"),
      labelValue("Rationale", "Zero-config Next.js deployment, automatic HTTPS, environment variable management, free tier sufficient"),
      emptyLine(),
      heading("Deployment Checklist", HeadingLevel.HEADING_3),
      bullet("All environment variables set in Vercel dashboard"),
      bullet("TWILIO_WEBHOOK_BASE_URL points to Vercel deployment URL"),
      bullet("Twilio Sandbox webhook URL updated to https://your-app.vercel.app/api/twilio/whatsapp"),
      bullet("DEV_TEST_ACCESS_TOKEN set to protect debug console"),
      bullet("Build passes: npm run build"),
      bullet("No NEXT_PUBLIC_ secrets in the codebase"),

      // ═══════════════════════════════════════════════════════
      // 17. KNOWN LIMITATIONS & FUTURE WORK
      // ═══════════════════════════════════════════════════════

      new Paragraph({ children: [new PageBreak()] }),
      heading("17. Known Limitations & Future Work"),

      heading("Current Limitations", HeadingLevel.HEADING_3),
      bullet("GST category lookup is keyword-based — items not in the keyword list default to 5% with a warning"),
      bullet("Ledger queries limited to 3 types — more complex queries (by item, by customer) not yet supported"),
      bullet("No multi-message bills — each message is processed independently"),
      bullet("No invoice editing — once saved, an invoice cannot be corrected via WhatsApp"),
      bullet("Single attachment per message — cannot process multi-photo bills"),
      bullet("No WhatsApp Business API — using Sandbox, which limits to pre-registered numbers"),

      emptyLine(),
      heading("Potential Future Enhancements", HeadingLevel.HEADING_3),
      bullet("GST category lookup via government HSN code database instead of keywords"),
      bullet("Multi-turn conversation for bill corrections ('last item ka price 50 tha, 60 nahi')"),
      bullet("PDF invoice generation and sending via WhatsApp"),
      bullet("Monthly GST return auto-generation (GSTR-1 format)"),
      bullet("Customer name tracking in invoices"),
      bullet("Export ledger to Excel/CSV via WhatsApp command"),
      bullet("Multi-language support beyond Hindi/English (Tamil, Telugu, etc.)"),
      bullet("WhatsApp Business API for production deployment without Sandbox limitations"),
    ],
  }],
});

// ─── Generate the file ────────────────────────────────────────

const buffer = await Packer.toBuffer(doc);
const outputPath = "Kirana_Agent_Project_Document.docx";
writeFileSync(outputPath, buffer);
console.log(`✓ Generated ${outputPath} (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
