# Kirana Agent — Bills and GST, right from WhatsApp

> A WhatsApp-native billing and GST assistant for India's 12M+ kirana (neighbourhood grocery) stores. No app to install. No login. Just the WhatsApp number a shopkeeper already uses every day.

Built for the **ChatGPT Codex India Hackathon 2026** — Track 6: *AI Agents for Bharat's Businesses*.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Ledger queries](#ledger-queries)
- [Language support](#language-support)
- [GST 2.0 slab logic](#gst-20-slab-logic)
- [The internal test console](#the-internal-test-console)
- [Testing](#testing)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)
- [Built with Codex](#built-with-codex)
- [License](#license)

---

## Why this exists

Most kirana stores in India still run on a notebook and a pen. Every bill is handwritten, and GST is worked out by hand at month-end — a process that's slow, error-prone, and genuinely stressful for owners who never trained as accountants.

These same shopkeepers already trust WhatsApp for suppliers, customers, and payments. **Kirana Agent** meets them exactly there — no new app, no dashboard, no login. You send a bill the way you'd naturally describe it, and you get back a correct, GST-ready invoice in seconds.

## What it does

| You send... | You get back... |
|---|---|
| **Typed text** — `2kg atta 90rs, 1 dish soap 60rs` | A formatted invoice with correct GST per item, CGST/SGST split, and grand total |
| **A voice note** — describing the bill out loud | The same, transcribed and processed identically |
| **A photo** — of a handwritten bill | The same, read by a vision model and processed identically |
| **A plain-language question** — `Aaj ka total kitna hua?` | A real answer, pulled live from the saved ledger — never estimated |

Every invoice passes through a **distinct self-review step** before it's sent back: the agent checks its own line-item math, subtotal, GST split, and grand total — and if something in the input was unclear, it says so explicitly instead of silently guessing.

## How it works

```
WhatsApp message (text / voice / photo)
        │
        ▼
Twilio webhook  →  /api/twilio/whatsapp
        │
        ▼
Intent detection  →  "new bill" or "ledger query"
        │
   ┌────┴─────────────────────────┐
   ▼                              ▼
 NEW BILL                    LEDGER QUERY
   │                              │
   ▼                              ▼
Transcribe / read photo      Resolve date range (IST)
   │                              │
   ▼                              ▼
LLM extraction → JSON        Aggregate from Supabase
   │                              │
   ▼                              ▼
GST 2.0 slab calculation     Format reply in matching
   │                          language
   ▼                              │
Agentic self-review               │
   │                              │
   ▼                              │
Save to Supabase ledger           │
   │                              │
   └──────────────┬───────────────┘
                   ▼
          Formatted WhatsApp reply
```

The `/dev/test` debug console and the real Twilio webhook call the **exact same pipeline functions** — nothing is duplicated, so what you test locally is what runs in production.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) | Single deployable app, API routes double as the webhook |
| Database | **Supabase** (Postgres) | Fast to provision, REST API out of the box, Row Level Security by default |
| Messaging | **Twilio** | WhatsApp Sandbox for hackathon-speed setup, signature-verified webhook |
| AI / LLM | **Groq** — `llama-3.3-70b-versatile` (text extraction), `qwen/qwen3.6-27b` (vision), `whisper-large-v3-turbo` (voice) | Free tier, OpenAI-SDK-compatible, fast inference |
| Hosting | **Vercel** | Zero-config deploys from GitHub, generous free tier |
| Agentic build | **OpenAI Codex** | Planned, wrote, tested, and reviewed the codebase stage by stage |

## Quick start

```bash
git clone https://github.com/11DDBOY11/kirana-agent.git
cd kirana-agent
npm install
cp .env.example .env.local   # fill in real values — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [http://localhost:3000/dev/test](http://localhost:3000/dev/test) to test the pipeline directly without WhatsApp.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project's **API** URL (`https://<ref>.supabase.co`) — not the dashboard link |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side-only key; bypasses RLS by design (the app is the only client) |
| `TWILIO_ACCOUNT_SID` | ✅ | From the Twilio Console |
| `TWILIO_AUTH_TOKEN` | ✅ | From the Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | Your Twilio WhatsApp Sandbox number |
| `TWILIO_WEBHOOK_BASE_URL` | ✅ | Public HTTPS origin, no trailing slash — e.g. `https://your-app.vercel.app` |
| `GROQ_API_KEY` | ✅ | Powers transcription, vision, and text extraction |
| `DEV_TEST_ACCESS_TOKEN` | Production only | Gates `/dev/test` once deployed — the page isn't linked publicly, and this is the second layer of protection |

> **Security note**: no credential is ever prefixed `NEXT_PUBLIC_`. Every secret is read server-side only, via `import "server-only"` guards on the Supabase client and ledger service. Row Level Security is enabled on every table with **no policies defined** — intentional, since the app talks to Supabase exclusively through the service-role key from the server, never from a browser.

## Database

Run `supabase/schema.sql` once, in the Supabase SQL Editor, before first use. It creates:

- **`shopkeepers`** — one row per WhatsApp phone number
- **`invoices`** — bill-level totals (subtotal, GST, grand total, input type)
- **`invoice_items`** — line-level detail, including the GST rate and confidence (`known` vs `defaulted`) applied to each item

## Ledger queries

Instead of sending a bill, a shopkeeper can just ask:

| Query type | Example |
|---|---|
| This month's GST | *"Is mahine ka GST kitna hua?"* |
| Today's total | *"Aaj ka total kitna hua?"* |
| Last 7 days | *"Pichle hafte ka summary do"* |

Answers are computed live from Supabase, on IST day/month boundaries. **If there's no data for the requested period, the agent says so explicitly** — it never estimates or fabricates a number.

## Language support

The agent detects the language of the incoming message and replies in kind:

- **English**
- **Hindi / Hinglish** — native Devanagari script or common transliterated words (`kitna`, `mahine`, `aaj`, `pichle hafte`, …)
- **Kannada** — native script (`ಕನ್ನಡ`) or romanized Kanglish, including Kannada numerals (೦–೯) and number words

Item names are normalized to English internally (for consistent GST matching) regardless of the language the bill was sent in.

## GST 2.0 slab logic

GST rates follow India's current **4-slab system** (effective September 2025): **0%, 5%, 18%, 40%** — the older 12%/28% slabs are retired.

- **0%** — fresh produce, milk (including UHT/tetra-pack), and **loose, unbranded staples** (rice, atta, wheat, dal, salt)
- **5%** — the same staples when **packaged or branded**, plus ghee, butter, cheese, chips, tea, coffee, biscuits, sugar, oil
- **18%** — soap, detergent, shampoo, toothpaste, and other standard household goods
- **40%** — cold/aerated drinks, pan masala

Keyword matching covers common items in English, Hindi, and Hinglish. When an item can't be confidently categorized, it's marked `defaulted` (not `known`) and the shopkeeper is told explicitly in the reply — the agent never silently guesses a tax rate.

> This mapping is a keyword-based heuristic built for hackathon scope, not a certified tax reference. Branded-vs-loose detection and edge-case categorization (e.g. sugar, salt, tea) follow reasonable approximations of current rules rather than an authoritative source.

## The internal test console

`/dev/test` exercises the exact same pipeline the WhatsApp webhook uses, without needing Twilio:

- Type a bill, or upload an audio file / photo
- See four panels: **extracted JSON**, **GST calculation**, **agentic review result**, and the **final WhatsApp reply text**

Not linked from the public site. In production it's additionally gated behind `DEV_TEST_ACCESS_TOKEN`.

## Testing

```bash
npm test        # vitest — unit + integration tests
npm run lint     # eslint
npm run build    # next build — type checking + compilation
```

Most tests run against the deterministic extraction path (`useLlm: false`) and need no external credentials. A small set of live integration tests exercise the real Groq and Supabase connections and are skipped automatically unless `GROQ_API_KEY` and Supabase credentials are present in the environment — useful as a final pre-demo sanity check.

## Deploying to Vercel

1. Push to GitHub, import the repo into [Vercel](https://vercel.com)
2. Add **every** variable from [Environment variables](#environment-variables) in Vercel's project settings — scoped to *Production* (local `.env.local` values never sync automatically)
3. Set `TWILIO_WEBHOOK_BASE_URL` to your live Vercel URL, then **redeploy** (env var changes don't apply retroactively to a running deployment)
4. In Twilio Console → WhatsApp Sandbox settings, point **"When a message comes in"** to:
   ```
   https://your-app.vercel.app/api/twilio/whatsapp
   ```
5. Join the sandbox from a real phone by messaging the Twilio number with the join code shown in the console

## Known limitations

Being upfront about what's not fully solved yet, rather than overclaiming:

- **GST keyword mapping is a heuristic**, not verified against an authoritative tax source — safe for demo purposes, not for real compliance use
- **Bare-number bills** (e.g. `"1 kg rice 100"` with no `rs`/`₹` marker) may not always be reliably detected as a new bill versus a query — messages with an explicit currency word are handled most reliably
- **Kannada extraction accuracy varies by item** — common items (rice, soap) have tested correctly; less common items should be treated as best-effort, since the underlying model's Kannada support isn't officially guaranteed by its provider
- **Voice and photo input have been verified for connectivity and basic accuracy**, but haven't been tested as exhaustively across edge cases (poor audio quality, unclear handwriting) as the text path

## Built with Codex

Every stage of this project — architecture planning, implementation, testing, and self-review — was built using **OpenAI Codex**, working in milestone-sized increments:

1. Scaffold (Next.js, Supabase schema, env config)
2. Twilio WhatsApp webhook, signature-verified
3. Shared billing pipeline — extraction, GST calculation, agentic review, debug console
4. Voice and photo processing
5. Natural-language ledger queries
6. LLM-based extraction with deterministic fallback
7. GST 2.0 slab correction, Hindi/Hinglish keyword coverage
8. Migration to Groq, with live model-list verification
9. Kannada language support

Each stage was independently lint-checked, tested, and built before moving to the next — with real bugs (a PostgreSQL regex escaping error, an empty-response JSON parsing crash, an incorrect GST slab mapping) found and fixed along the way through actual verification, not assumption.

## License

Built for the ChatGPT Codex India Hackathon 2026. See repository for details.