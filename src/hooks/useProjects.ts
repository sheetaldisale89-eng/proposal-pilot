import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID } from '@/lib/demo';
import type { RfpProject, CreateProjectInput } from '@/lib/types';

export const useProjects = () => {
  const [projects, setProjects] = useState<RfpProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('rfp_projects')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[SUPABASE ERROR FULL]', JSON.stringify(fetchError, null, 2));
        throw fetchError;
      }

      setProjects((data as RfpProject[]) ?? []);
    } catch (err) {
      console.error('[FETCH PROJECTS ERROR]', err);
      const e = err as { message?: string; details?: string; hint?: string };
      setError(e.message || e.details || e.hint || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
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

    if (insertError) {
      console.error('[SUPABASE ERROR FULL]', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    const project = data as RfpProject;
    setProjects(prev => [project, ...prev]);
    return project;
  };

  const updateProject = async (id: string, updates: Partial<RfpProject>): Promise<void> => {
    const { error: updateError } = await supabase
      .from('rfp_projects')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('[SUPABASE ERROR FULL]', JSON.stringify(updateError, null, 2));
      throw updateError;
    }

    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  return { projects, loading, error, fetchProjects, createProject, updateProject };
};
