-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT,
  awb_avg NUMERIC DEFAULT 0,
  exception_rate_opcode_70 NUMERIC DEFAULT 0,
  dropoff_rate_opcode_59 NUMERIC DEFAULT 0,
  blank_spot_status TEXT DEFAULT 'covered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Public insert partners" ON public.partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update partners" ON public.partners FOR UPDATE USING (true);
CREATE POLICY "Public delete partners" ON public.partners FOR DELETE USING (true);

CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'Daily',
  status TEXT NOT NULL DEFAULT 'To Do',
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date DATE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  location_lat_lng TEXT,
  image_path TEXT,
  checklist JSONB DEFAULT '{"sop_education":false,"marketing_material":false,"asset_check":false}'::jsonb,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Public delete tasks" ON public.tasks FOR DELETE USING (true);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_partner ON public.tasks(partner_id);

CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Market insights table
CREATE TABLE public.market_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  strategy_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read insights" ON public.market_insights FOR SELECT USING (true);
CREATE POLICY "Public insert insights" ON public.market_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update insights" ON public.market_insights FOR UPDATE USING (true);
CREATE POLICY "Public delete insights" ON public.market_insights FOR DELETE USING (true);

CREATE TRIGGER trg_insights_updated BEFORE UPDATE ON public.market_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin reimbursements table
CREATE TABLE public.admin_reimbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL DEFAULT 'SPD',
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_image_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_reimbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reimbursements" ON public.admin_reimbursements FOR SELECT USING (true);
CREATE POLICY "Public insert reimbursements" ON public.admin_reimbursements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update reimbursements" ON public.admin_reimbursements FOR UPDATE USING (true);
CREATE POLICY "Public delete reimbursements" ON public.admin_reimbursements FOR DELETE USING (true);

CREATE TRIGGER trg_reimb_updated BEFORE UPDATE ON public.admin_reimbursements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('field-proofs', 'field-proofs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Public read field-proofs" ON storage.objects FOR SELECT USING (bucket_id = 'field-proofs');
CREATE POLICY "Public upload field-proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'field-proofs');
CREATE POLICY "Public update field-proofs" ON storage.objects FOR UPDATE USING (bucket_id = 'field-proofs');
CREATE POLICY "Public delete field-proofs" ON storage.objects FOR DELETE USING (bucket_id = 'field-proofs');

CREATE POLICY "Public read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Public upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Public update receipts" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts');
CREATE POLICY "Public delete receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts');