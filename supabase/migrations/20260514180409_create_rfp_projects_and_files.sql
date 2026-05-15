/*
  # ProposalPilot — Core Schema

  ## New Tables

  ### rfp_projects
  Represents a pursuit / RFP opportunity owned by a user.
  - id (uuid, PK)
  - owner_user_id (uuid, FK → auth.users)
  - title (text) — e.g. "Digital Lending Transformation RFP"
  - client_name (text) — e.g. "Leading Public Sector Bank"
  - institution_type (text) — Banking | Insurance | Payments | Capital Markets | NBFC | Other
  - rfp_category (text) — free-form category label
  - description (text) — optional notes
  - status (text) — draft | processing | completed | archived
  - due_date (date) — submission deadline
  - submission_date (date) — actual submission date
  - recommendation (text) — Strong Pursuit | Pursue Selectively | Needs Review | No-Go
  - risk_level (text) — Low | Medium | Medium-High | High
  - confidence_score (int) — 0–100
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - archived_at (timestamptz, nullable)

  ### rfp_files
  Tracks uploaded PDF files associated with a project.
  - id (uuid, PK)
  - project_id (uuid, FK → rfp_projects)
  - uploaded_by (uuid, FK → auth.users)
  - bucket_name (text) — Supabase Storage bucket
  - storage_path (text) — path within bucket
  - original_file_name (text)
  - file_type (text) — always 'application/pdf' for now
  - file_size_bytes (bigint)
  - file_hash (text, nullable)
  - status (text) — pending | processing | extracted | failed
  - page_count (int, nullable)
  - extracted_text_available (boolean)
  - uploaded_at (timestamptz)
  - processed_at (timestamptz, nullable)

  ## Storage
  - Creates bucket `rfp-files` for PDF uploads (private, 50 MB limit)

  ## Security
  - RLS enabled on both tables
  - Users can only access their own projects and files
*/

-- ============================================================
-- rfp_projects
-- ============================================================
CREATE TABLE IF NOT EXISTS rfp_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text NOT NULL DEFAULT '',
  client_name       text NOT NULL DEFAULT '',
  institution_type  text NOT NULL DEFAULT 'Banking',
  rfp_category      text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'draft',
  due_date          date,
  submission_date   date,
  recommendation    text NOT NULL DEFAULT '',
  risk_level        text NOT NULL DEFAULT '',
  confidence_score  int,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  archived_at       timestamptz
);

ALTER TABLE rfp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own projects"
  ON rfp_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own projects"
  ON rfp_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own projects"
  ON rfp_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own projects"
  ON rfp_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfp_projects_updated_at
  BEFORE UPDATE ON rfp_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS rfp_projects_owner_idx ON rfp_projects(owner_user_id);

-- ============================================================
-- rfp_files
-- ============================================================
CREATE TABLE IF NOT EXISTS rfp_files (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                uuid NOT NULL REFERENCES rfp_projects(id) ON DELETE CASCADE,
  uploaded_by               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name               text NOT NULL DEFAULT 'rfp-files',
  storage_path              text NOT NULL DEFAULT '',
  original_file_name        text NOT NULL DEFAULT '',
  file_type                 text NOT NULL DEFAULT 'application/pdf',
  file_size_bytes           bigint NOT NULL DEFAULT 0,
  file_hash                 text,
  status                    text NOT NULL DEFAULT 'pending',
  page_count                int,
  extracted_text_available  boolean NOT NULL DEFAULT false,
  uploaded_at               timestamptz NOT NULL DEFAULT now(),
  processed_at              timestamptz
);

ALTER TABLE rfp_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own files"
  ON rfp_files FOR SELECT
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert own files"
  ON rfp_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own files"
  ON rfp_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own files"
  ON rfp_files FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Index for fast project lookups
CREATE INDEX IF NOT EXISTS rfp_files_project_idx ON rfp_files(project_id);
CREATE INDEX IF NOT EXISTS rfp_files_uploader_idx ON rfp_files(uploaded_by);
