export interface RfpProject {
  id: string;
  owner_user_id: string;
  title: string;
  client_name: string;
  institution_type: string;
  rfp_category: string;
  description: string;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  due_date: string | null;
  submission_date: string | null;
  recommendation: string;
  risk_level: string;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface RfpFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  bucket_name: string;
  storage_path: string;
  original_file_name: string;
  file_type: string;
  file_size_bytes: number;
  file_hash: string | null;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  page_count: number | null;
  extracted_text_available: boolean;
  uploaded_at: string;
  processed_at: string | null;
}

export type CreateProjectInput = Pick<
  RfpProject,
  'title' | 'client_name' | 'institution_type' | 'rfp_category' | 'description' | 'due_date'
>;
