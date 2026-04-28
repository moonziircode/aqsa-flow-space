
-- Reopen RLS policies for anonymous access (login removed)
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY['partners','tasks','market_insights','select_options','admin_reimbursements'])
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$s FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Public insert %1$s" ON public.%1$s FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Public update %1$s" ON public.%1$s FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Public delete %1$s" ON public.%1$s FOR DELETE USING (true)', t);
  END LOOP;
END $$;

-- Reopen storage policies for receipts and field-proofs
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
              AND policyname ILIKE '%receipts%' OR policyname ILIKE '%field-proofs%' OR policyname ILIKE '%field_proofs%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read receipts objects" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Public write receipts objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Public update receipts objects" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts') WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Public delete receipts objects" ON storage.objects FOR DELETE USING (bucket_id = 'receipts');

CREATE POLICY "Public read field-proofs objects" ON storage.objects FOR SELECT USING (bucket_id = 'field-proofs');
CREATE POLICY "Public write field-proofs objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'field-proofs');
CREATE POLICY "Public update field-proofs objects" ON storage.objects FOR UPDATE USING (bucket_id = 'field-proofs') WITH CHECK (bucket_id = 'field-proofs');
CREATE POLICY "Public delete field-proofs objects" ON storage.objects FOR DELETE USING (bucket_id = 'field-proofs');

-- Make receipts bucket public again so URLs work without signed URLs
UPDATE storage.buckets SET public = true WHERE id = 'receipts';
