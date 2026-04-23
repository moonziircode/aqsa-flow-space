
-- ========================================================================
-- 1. PARTNER SCHEMA: Replace old fields with the 9 new fields
-- ========================================================================
ALTER TABLE public.partners
  DROP COLUMN IF EXISTS area,
  DROP COLUMN IF EXISTS awb_avg,
  DROP COLUMN IF EXISTS exception_rate_opcode_70,
  DROP COLUMN IF EXISTS dropoff_rate_opcode_59,
  DROP COLUMN IF EXISTS blank_spot_status;

-- Rename `name` -> we keep `name` as the primary identifier and treat it as External Store Name.
-- Add the 9 new columns
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS shipper text,
  ADD COLUMN IF NOT EXISTS trend_shipper text,
  ADD COLUMN IF NOT EXISTS awb_otomatis numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trend_awb_otomatis text,
  ADD COLUMN IF NOT EXISTS awb_manual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS longlat text;

-- ========================================================================
-- 2. SELECT OPTIONS: Customizable dropdown options for tasks
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.select_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field text NOT NULL,            -- 'status' | 'priority' | 'type'
  label text NOT NULL,            -- The option text shown to users
  bg_color text NOT NULL DEFAULT '#E5E7EB',  -- pill background
  fg_color text NOT NULL DEFAULT '#374151',  -- pill foreground
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field, label)
);

CREATE INDEX IF NOT EXISTS idx_select_options_field ON public.select_options(field, position);

ALTER TABLE public.select_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read select_options" ON public.select_options FOR SELECT USING (true);
CREATE POLICY "Public insert select_options" ON public.select_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update select_options" ON public.select_options FOR UPDATE USING (true);
CREATE POLICY "Public delete select_options" ON public.select_options FOR DELETE USING (true);

CREATE TRIGGER trg_select_options_updated_at
BEFORE UPDATE ON public.select_options
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults for status / priority / type so existing tasks still render
INSERT INTO public.select_options (field, label, bg_color, fg_color, position) VALUES
  ('status', 'To Do',       '#E5E7EB', '#374151', 0),
  ('status', 'In Progress', '#DBEAFE', '#1E40AF', 1),
  ('status', 'Review',      '#EDE9FE', '#5B21B6', 2),
  ('status', 'Done',        '#D1FAE5', '#065F46', 3),
  ('priority', 'High',   '#FEE2E2', '#991B1B', 0),
  ('priority', 'Medium', '#FEF3C7', '#92400E', 1),
  ('priority', 'Low',    '#E5E7EB', '#374151', 2),
  ('type', 'Daily',   '#DBEAFE', '#1E40AF', 0),
  ('type', 'Weekly',  '#EDE9FE', '#5B21B6', 1),
  ('type', 'Monthly', '#FCE7F3', '#9D174D', 2)
ON CONFLICT (field, label) DO NOTHING;
