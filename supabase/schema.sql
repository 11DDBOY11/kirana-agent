-- Run this file in the Supabase SQL editor before enabling the webhook.
create extension if not exists "pgcrypto";

create table if not exists public.shopkeepers (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  name text,
  created_at timestamptz not null default now(),
  constraint shopkeepers_phone_number_format check (phone_number ~ '^whatsapp:\\+?[0-9]{7,15}$')
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  shopkeeper_id uuid not null references public.shopkeepers(id) on delete restrict,
  raw_input_type text not null check (raw_input_type in ('text', 'voice', 'photo')),
  created_at timestamptz not null default now(),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  gst_total numeric(12, 2) not null check (gst_total >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0)
);

create index if not exists invoices_shopkeeper_created_at_idx
  on public.invoices (shopkeeper_id, created_at desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null default 'pc',
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  gst_rate numeric(5, 2) not null check (gst_rate in (0, 5, 12, 18, 28)),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- The application uses the service-role key only on the server. RLS stays on
-- so no direct anonymous client can access shopkeeper or ledger data.
alter table public.shopkeepers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
