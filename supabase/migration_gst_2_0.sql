-- Migration to GST 2.0 (effective September 2025)
-- Update invoice_items.gst_rate constraint to allow (0, 5, 18, 40)

-- We need to drop the old check constraint.
-- By default, PostgreSQL names inline constraints as {table}_{column}_check,
-- which for public.invoice_items is invoice_items_gst_rate_check.
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_gst_rate_check;

-- Add the new constraint
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_gst_rate_check CHECK (gst_rate IN (0, 5, 18, 40));
