# Kirana WhatsApp Billing & GST Agent

A WhatsApp-first billing assistant for Indian kirana stores. Shopkeepers will be
able to send text, voice notes, or bill photos and receive a saved GST invoice
without using a dashboard.

## Stage 1: foundation

- Next.js 16 App Router with TypeScript and Tailwind
- Supabase Postgres schema for shopkeepers, invoices, and invoice items
- Server-only Supabase admin client; no secret is exposed to the browser
- A minimal public landing page; the future WhatsApp webhook will be the main UI

## Local setup

1. Copy `.env.example` to `.env.local` and fill `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Run `npm run dev`.

The remaining integration values are deliberately listed now and are wired in
later stages: Twilio credentials and `OPENAI_API_KEY`.
