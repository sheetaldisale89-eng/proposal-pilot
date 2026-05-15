/*
  # Storage RLS for rfp-files bucket

  Users can upload and read their own files.
  Files are stored at: {user_id}/{project_id}/{filename}
  Policy checks that the first path segment matches auth.uid().
*/

CREATE POLICY "Users can upload own rfp documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rfp-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own rfp documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'rfp-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own rfp documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rfp-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
