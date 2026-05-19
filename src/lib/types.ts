export interface RfpProject {
  id: string;
  owner_user_id: string | null;
  title: string;
  client_name: string | null;
  institution_type: string | null;
  rfp_category: string | null;
  description: string | null;
  status: 'draft' | 'uploaded' | 'processing' | 'completed' | 'failed' | 'archived';
  due_date: string | null;
  submission_date: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface RfpFile {
  id: string;
  project_id: string;
  uploaded_by: string | null;
  bucket_name: string;
  storage_path: string;
  original_file_name: string;
  file_type: string;
  file_size_bytes: number;
  file_hash: string | null;
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'deleted';
  page_count: number | null;
  extracted_text_available: boolean;
  uploaded_at: string;
  processed_at: string | null;
}

export type CreateProjectInput = Pick<
  RfpProject,
  'title' | 'client_name' | 'institution_type' | 'rfp_category' | 'description' | 'due_date'
>;
