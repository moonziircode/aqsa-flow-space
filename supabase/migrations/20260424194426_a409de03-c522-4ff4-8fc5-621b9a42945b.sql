
-- ============================================================
-- TABLES: replace open policies with authenticated-only policies
-- ============================================================

-- partners
DROP POLICY IF EXISTS "Public delete partners" ON public.partners;
DROP POLICY IF EXISTS "Public insert partners" ON public.partners;
DROP POLICY IF EXISTS "Public read partners"   ON public.partners;
DROP POLICY IF EXISTS "Public update partners" ON public.partners;

CREATE POLICY "Authenticated read partners"   ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update partners" ON public.partners FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete partners" ON public.partners FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- tasks
DROP POLICY IF EXISTS "Public delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public read tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Public update tasks" ON public.tasks;

CREATE POLICY "Authenticated read tasks"   ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- market_insights
DROP POLICY IF EXISTS "Public delete insights" ON public.market_insights;
DROP POLICY IF EXISTS "Public insert insights" ON public.market_insights;
DROP POLICY IF EXISTS "Public read insights"   ON public.market_insights;
DROP POLICY IF EXISTS "Public update insights" ON public.market_insights;

CREATE POLICY "Authenticated read insights"   ON public.market_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert insights" ON public.market_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update insights" ON public.market_insights FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete insights" ON public.market_insights FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- select_options (UI configuration; reads need to be available to logged-in users only)
DROP POLICY IF EXISTS "Public delete select_options" ON public.select_options;
DROP POLICY IF EXISTS "Public insert select_options" ON public.select_options;
DROP POLICY IF EXISTS "Public read select_options"   ON public.select_options;
DROP POLICY IF EXISTS "Public update select_options" ON public.select_options;

CREATE POLICY "Authenticated read select_options"   ON public.select_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert select_options" ON public.select_options FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update select_options" ON public.select_options FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete select_options" ON public.select_options FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- admin_reimbursements (financial data — reads also restricted)
DROP POLICY IF EXISTS "Public delete reimbursements" ON public.admin_reimbursements;
DROP POLICY IF EXISTS "Public insert reimbursements" ON public.admin_reimbursements;
DROP POLICY IF EXISTS "Public read reimbursements"   ON public.admin_reimbursements;
DROP POLICY IF EXISTS "Public update reimbursements" ON public.admin_reimbursements;

CREATE POLICY "Authenticated read reimbursements"   ON public.admin_reimbursements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert reimbursements" ON public.admin_reimbursements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update reimbursements" ON public.admin_reimbursements FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete reimbursements" ON public.admin_reimbursements FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE: lock down receipts + field-proofs writes to authenticated
-- (keep public SELECT so existing public URLs still display)
-- ============================================================

DROP POLICY IF EXISTS "Public upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public upload field-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public update field-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public delete field-proofs" ON storage.objects;

CREATE POLICY "Authenticated upload receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated upload field-proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'field-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update field-proofs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'field-proofs' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'field-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete field-proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'field-proofs' AND auth.uid() IS NOT NULL);
