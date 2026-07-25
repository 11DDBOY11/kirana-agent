# Kirana WhatsApp Billing & GST Agent

A WhatsApp-first billing assistant for Indian kirana stores. Shopkeepers will be
able to send text, voice notes, or bill photos and receive a saved GST invoice
without using a dashboard.

## Stage 1: foundation

- Next.js 16 App Router with TypeScript and Tailwind
- Supabase Postgres schema for shopkeepers, invoices, and invoice items
- Server-only Supabase admin client; no secret is exposed to the browser
- A minimal public landing page; the future WhatsApp webhook will be the main UI

## Stage 2: WhatsApp text ingress

- `POST /api/twilio/whatsapp` accepts Twilio's form-encoded WhatsApp webhook.
- Twilio signatures are validated with the auth token before processing.
- A conservative text-bill detector acknowledges bill-shaped messages and gives
  clear replies for unsupported media or unclear messages.
- Each stage is structured-loggable: received, signature checked, intent
  detected, and text bill queued. Structured extraction and saving are added in
  the next milestones.

## Shared billing pipeline

Text bills currently use a deterministic, explicitly labelled extraction baseline
for reliable local testing. The same `runTextBillingPipeline` function is called
by both `/api/twilio/whatsapp` and `/api/dev/test`; it then applies GST slabs,
runs the distinct `agentic-review` validation pass, and formats the WhatsApp
invoice. Voice, photo, and LLM extraction will plug into this shared pipeline.

## Local setup

1. Copy `.env.example` to `.env.local` and fill `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Run `npm run dev`.

For Twilio Sandbox development, expose your local server with an HTTPS tunnel,
set `TWILIO_WEBHOOK_BASE_URL` to that public origin, and configure the Sandbox
"When a message comes in" URL as
`https://your-public-origin/api/twilio/whatsapp` with method `POST`.

The remaining integration values are deliberately listed now and are wired in
later stages: Twilio credentials and `OPENAI_API_KEY`.

## Internal pipeline test page

Open `/dev/test` locally to run the exact text-billing function used by the
Twilio webhook. It shows extracted data, GST calculation, the separate
`agentic-review` pass, and the final WhatsApp reply. The page is intentionally
not linked from the public site. In production, set `DEV_TEST_ACCESS_TOKEN` and
enter it on the page to use the protected test API.
