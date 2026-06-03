/*
  # Add recommendation column to rfp_projects

  Adds a recommendation text column to rfp_projects so the
  single-source-of-truth recommendation (Pursue / Pursue with Caution /
  Do Not Pursue) can be stored on the project and read by the workspace
  dashboard without re-parsing full_analysis_json.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfp_projects' AND column_name = 'recommendation'
  ) THEN
    ALTER TABLE rfp_projects ADD COLUMN recommendation text;
  END IF;
END $$;
