# Kirana WhatsApp Billing & GST Agent

A WhatsApp-first billing assistant for Indian kirana (neighbourhood grocery)
stores. Shopkeepers send a bill via WhatsApp — typed text, voice note, or
photo — and receive back a formatted GST invoice saved to a queryable ledger.

## Features

| Input | How it works |
|-------|-------------|
| **Text bill** | `2kg atta 90rs, 1 soap 60rs` → LLM extracts items (falls back to deterministic parser) |
| **Voice note** | OpenAI transcription → same extraction pipeline |
| **Bill photo** | OpenAI vision reads handwritten bill → same pipeline |
| **Ledger query** | `Is mahine ka GST kitna hua?` → real totals from Supabase |

The **agentic review** pass validates every invoice (line math, subtotal,
GST split, grand total) before replying.

## Tech stack

- **Next.js 16** App Router + TypeScript
- **Supabase** (Postgres) — shopkeepers, invoices, invoice_items
- **Twilio** — WhatsApp webhook
- **OpenAI** — transcription (voice), vision (photo), LLM extraction (text)
- **Vercel** — deployment

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/11DDBOY11/kirana-agent.git
cd kirana-agent
npm install
```

### 2. Environment variables

Copy the example and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-side only) |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | Your Twilio WhatsApp Sandbox number |
| `TWILIO_WEBHOOK_BASE_URL` | ✅ | Public HTTPS origin (no trailing slash), e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for transcription, vision, and LLM extraction |
| `DEV_TEST_ACCESS_TOKEN` | Production only | Protects `/dev/test` in production |

> **Security**: Never prefix secrets with `NEXT_PUBLIC_`. All credentials are
> server-side only and never reach the browser.

### 3. Database

Run `supabase/schema.sql` in your Supabase SQL Editor. This creates:

- `shopkeepers` — phone number registry
- `invoices` — bill totals, GST, input type
- `invoice_items` — line-level detail

Row Level Security is enabled on all tables.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page.

### 5. Twilio Sandbox (for WhatsApp testing)

1. Expose your local server with an HTTPS tunnel (e.g. ngrok):
   ```bash
   ngrok http 3000
   ```
2. Set `TWILIO_WEBHOOK_BASE_URL` to the ngrok HTTPS URL in `.env.local`.
3. In Twilio Console → Messaging → WhatsApp Sandbox, set the webhook URL to:
   ```
   https://your-ngrok-url/api/twilio/whatsapp
   ```
   Method: **POST**

## Development

### Run tests

```bash
npm test
```

Tests use the deterministic extraction path (`useLlm: false`) and don't
require an OpenAI key. There is one LLM integration test that runs only
when `OPENAI_API_KEY` is set — use it for pre-demo validation:

```bash
OPENAI_API_KEY=sk-... npm test
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

## Internal pipeline test page

Open [`/dev/test`](http://localhost:3000/dev/test) locally to run the exact
billing pipeline used by the WhatsApp webhook. It accepts:

- **Text** — typed bill input
- **Audio** — voice note file upload
- **Image** — bill photo upload

Each input shows four panels: extracted JSON, GST breakdown, agentic review
result, and the final WhatsApp invoice reply.

In production, set `DEV_TEST_ACCESS_TOKEN` and enter it on the page. The
page is not linked from the public site.

## Ledger queries

Shopkeepers can ask questions in WhatsApp instead of sending a bill:

| Query | Example |
|-------|---------|
| This month's GST | `Is mahine ka GST kitna hua?` |
| Today's total | `Aaj ka total kitna hua?` |
| Last 7 days summary | `Pichle hafte ka summary do` |

The agent replies in the same language style (Hindi/Hinglish/English) with
real numbers from Supabase. If there's no data for the period, it says so
explicitly — never estimates or fabricates figures.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.example` in the Vercel dashboard.
4. Set `TWILIO_WEBHOOK_BASE_URL` to your Vercel deployment URL.
5. Update the Twilio Sandbox webhook to point to:
   ```
   https://your-app.vercel.app/api/twilio/whatsapp
   ```
6. Set `DEV_TEST_ACCESS_TOKEN` to protect the debug console in production.

## Architecture

```
WhatsApp message
  → Twilio webhook (/api/twilio/whatsapp)
  → Intent detection (new bill vs. ledger query)
  → Bill: extraction → GST slabs → agentic review → format → save → reply
  → Query: date range → Supabase aggregation → reply
```

The `/dev/test` page and API call the **same pipeline functions** as the
real webhook — no duplicated logic.
