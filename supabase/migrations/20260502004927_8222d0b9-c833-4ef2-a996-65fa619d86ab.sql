ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date;

CREATE INDEX IF NOT EXISTS idx_partners_period_start ON public.partners (period_start);
CREATE INDEX IF NOT EXISTS idx_partners_period_end ON public.partners (period_end);