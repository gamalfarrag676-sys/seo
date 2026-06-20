import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FullCompetitorReport } from '../utils/competitorAnalyzer';

export interface SavedReport {
  id: string;
  keyword: string;
  report_data: FullCompetitorReport;
  created_at: string;
}

export function useCompetitorHistory() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('competitor_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (e) {
      console.error('Error fetching competitor history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async (report: FullCompetitorReport) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Extract only essential data to avoid hitting storage limits
      const slimReport = {
        ...report,
        // Optional: truncate action plan or other massive fields if needed
      };

      const { data, error } = await supabase
        .from('competitor_reports')
        .insert({
          user_id: user.id,
          keyword: report.keyword,
          report_data: slimReport
        })
        .select()
        .single();

      if (error) throw error;
      
      setReports(prev => [data, ...prev]);
      return data;
    } catch (e) {
      console.error('Error saving competitor report:', e);
      return null;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReports(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (e) {
      console.error('Error deleting report:', e);
      return false;
    }
  };

  return { reports, isLoading, saveReport, deleteReport, fetchHistory };
}
