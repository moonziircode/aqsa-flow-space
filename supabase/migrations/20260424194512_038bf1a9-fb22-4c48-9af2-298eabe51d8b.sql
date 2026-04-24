
-- Restrict listing/SELECT on storage.objects for our two buckets to authenticated users.
-- Direct CDN URLs continue to work because the buckets are still marked public.
DROP POLICY IF EXISTS "Public read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public read field-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public select receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public select field-proofs" ON storage.objects;

CREATE POLICY "Authenticated list receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated list field-proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'field-proofs' AND auth.uid() IS NOT NULL);
