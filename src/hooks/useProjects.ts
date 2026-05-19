// TODO: Demo/no-login mode. Before production, restore Supabase Auth and user-level RLS.
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RfpProject, CreateProjectInput } from '@/lib/types';

// Demo mode: fixed user ID used in place of auth.uid()
// TODO: Replace with real auth.uid() before production.
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const useProjects = () => {
  const [projects, setProjects] = useState<RfpProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('rfp_projects')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProjects((data as RfpProject[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (input: CreateProjectInput): Promise<RfpProject> => {
    const { data, error: insertError } = await supabase
      .from('rfp_projects')
      .insert({
        ...input,
        owner_user_id: DEMO_USER_ID,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) throw insertError;
    const project = data as RfpProject;
    setProjects(prev => [project, ...prev]);
    return project;
  };

  const updateProject = async (id: string, updates: Partial<RfpProject>): Promise<void> => {
    const { error: updateError } = await supabase
      .from('rfp_projects')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  return { projects, loading, error, fetchProjects, createProject, updateProject };
};
