/*
  # Demo Mode — Open RLS policies (no authentication required)

  ## Summary
  Removes auth-restricted RLS policies from rfp_projects, rfp_files, and
  ai_analysis_results tables and replaces them with open policies that allow
  anon and authenticated roles full access.

  Also relaxes the NOT NULL / FK constraint on owner_user_id and uploaded_by
  so a fixed demo UUID can be used without a real auth.users entry.

  Also opens storage policies for the rfp-documents bucket.

  TODO: Before production, restore Supabase Auth and user-level RLS.
        Do not use demo/open policies in production.

  ## Changes
  1. rfp_projects — drop auth policies, add open SELECT/INSERT/UPDATE/DELETE for anon + authenticated
  2. rfp_files — drop auth policies, add open policies
  3. ai_analysis_results — add open policies (table already has RLS enabled from prior migration)
  4. storage.objects — add open policy for rfp-documents bucket
*/

-- ── rfp_projects ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can select own projects" ON rfp_projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON rfp_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON rfp_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON rfp_projects;

-- Make owner_user_id nullable so demo UUID (not in auth.users) can be stored
ALTER TABLE rfp_projects ALTER COLUMN owner_user_id DROP NOT NULL;

-- Drop the FK to auth.users (demo UUID won't exist there)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'rfp_projects' AND constraint_name = 'rfp_projects_owner_user_id_fkey'
  ) THEN
    ALTER TABLE rfp_projects DROP CONSTRAINT rfp_projects_owner_user_id_fkey;
  END IF;
END $$;

CREATE POLICY "Demo open select rfp_projects"
  ON rfp_projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Demo open insert rfp_projects"
  ON rfp_projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Demo open update rfp_projects"
  ON rfp_projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Demo open delete rfp_projects"
  ON rfp_projects FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── rfp_files ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can select own files" ON rfp_files;
DROP POLICY IF EXISTS "Users can insert own files" ON rfp_files;
DROP POLICY IF EXISTS "Users can update own files" ON rfp_files;
DROP POLICY IF EXISTS "Users can delete own files" ON rfp_files;

-- Make uploaded_by nullable
ALTER TABLE rfp_files ALTER COLUMN uploaded_by DROP NOT NULL;

-- Drop FK to auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'rfp_files' AND constraint_name = 'rfp_files_uploaded_by_fkey'
  ) THEN
    ALTER TABLE rfp_files DROP CONSTRAINT rfp_files_uploaded_by_fkey;
  END IF;
END $$;

CREATE POLICY "Demo open select rfp_files"
  ON rfp_files FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Demo open insert rfp_files"
  ON rfp_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Demo open update rfp_files"
  ON rfp_files FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Demo open delete rfp_files"
  ON rfp_files FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── ai_analysis_results ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can select own analysis" ON ai_analysis_results;
DROP POLICY IF EXISTS "Users can insert own analysis" ON ai_analysis_results;
DROP POLICY IF EXISTS "Users can update own analysis" ON ai_analysis_results;
DROP POLICY IF EXISTS "Users can delete own analysis" ON ai_analysis_results;

-- created_by may or may not exist; make it nullable if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_analysis_results' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE ai_analysis_results ALTER COLUMN created_by DROP NOT NULL;
    -- Drop FK to auth.users if present
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'ai_analysis_results' AND constraint_name = 'ai_analysis_results_created_by_fkey'
    ) THEN
      ALTER TABLE ai_analysis_results DROP CONSTRAINT ai_analysis_results_created_by_fkey;
    END IF;
  END IF;
END $$;

ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo open select ai_analysis_results"
  ON ai_analysis_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Demo open insert ai_analysis_results"
  ON ai_analysis_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Demo open update ai_analysis_results"
  ON ai_analysis_results FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Demo open delete ai_analysis_results"
  ON ai_analysis_results FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── Storage — rfp-documents bucket ─────────────────────────────────────────

-- Drop old auth-gated storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own rfp documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own rfp documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own rfp documents" ON storage.objects;

-- Also drop any policies referencing rfp-documents bucket
DROP POLICY IF EXISTS "Demo open upload rfp-documents" ON storage.objects;
DROP POLICY IF EXISTS "Demo open read rfp-documents" ON storage.objects;
DROP POLICY IF EXISTS "Demo open delete rfp-documents" ON storage.objects;

CREATE POLICY "Demo open upload rfp-documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'rfp-documents');

CREATE POLICY "Demo open read rfp-documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'rfp-documents');

CREATE POLICY "Demo open delete rfp-documents"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'rfp-documents');
