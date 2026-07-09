import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/config';

import { JobListing } from '@/types/job';

interface JobsStore {
  jobs: JobListing[];
  loading: boolean;
  error: string | null;
  offset: number;
  searchQuery: string;
  locationQuery: string;
  categoryQuery: string;
  hasFetched: boolean;
  searchHistory: Record<string, { term: string; count: number }>;

  setSearchQuery: (query: string) => void;
  setLocationQuery: (query: string) => void;
  setCategoryQuery: (category: string) => void;
  setOffset: (offset: number) => void;
  fetchJobs: (limit: number, reset?: boolean) => Promise<void>;
  recordSearch: (query: string) => void;
  reset: () => void;
}

const getInitialSearchHistory = (): Record<string, { term: string; count: number }> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('jobs_search_history_counts');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const useJobsStore = create<JobsStore>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  offset: 0,
  searchQuery: '',
  locationQuery: '',
  categoryQuery: '',
  hasFetched: false,
  searchHistory: getInitialSearchHistory(),

  reset: () => set({ jobs: [], loading: false, error: null, offset: 0, searchQuery: '', locationQuery: '', categoryQuery: '', hasFetched: false }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setLocationQuery: (query) => set({ locationQuery: query }),
  setCategoryQuery: (category) => set({ categoryQuery: category }),
  setOffset: (offset) => set({ offset }),

  recordSearch: (query) => {
    const trimmed = query.trim();
    if (!trimmed || typeof window === 'undefined') return;
    try {
      const storedHistory = localStorage.getItem('jobs_search_history_counts');
      let history: Record<string, { term: string; count: number }> = {};
      if (storedHistory) {
        history = JSON.parse(storedHistory);
      }
      const key = trimmed.toLowerCase();
      if (history[key]) {
        history[key].count += 1;
      } else {
        history[key] = { term: trimmed, count: 1 };
      }
      localStorage.setItem('jobs_search_history_counts', JSON.stringify(history));
      set({ searchHistory: history });
    } catch (e) {
      console.error("Failed to record search history:", e);
    }
  },

  fetchJobs: async (limit: number, reset = false) => {
    const { searchQuery, locationQuery, categoryQuery, offset, jobs, loading } = get();
    
    if (loading) return;
    
    // If we're resetting (like a new search), start from 0
    const currentOffset = reset ? 0 : offset;

    set({ loading: true, error: null });

    try {
      let url = `${API_BASE_URL}/jobs?limit=${limit}&offset=${currentOffset}`;
      
      if (categoryQuery.trim() !== '') {
        url += `&category=${encodeURIComponent(categoryQuery.trim())}`;
      }
      
      let combinedQuery = searchQuery.trim();
      if (locationQuery.trim() !== '') {
        combinedQuery = combinedQuery ? `${combinedQuery} ${locationQuery.trim()}` : locationQuery.trim();
      }

      if (combinedQuery !== '') {
        url = `${API_BASE_URL}/jobs/search?q=${encodeURIComponent(combinedQuery)}`;
      }
      
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          set({ jobs: reset ? [] : jobs, loading: false, hasFetched: true });
          return;
        }
        throw new Error('Failed to fetch jobs.');
      }
      
      const data = await res.json();
      
      set({ 
        jobs: data, 
        offset: currentOffset,
        loading: false, 
        hasFetched: true 
      });

      // Record query if search returned results and is an exact whole-word match
      if (data && data.length > 0 && searchQuery.trim() !== '') {
        const query = searchQuery.trim();
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = `(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`;
        const regex = new RegExp(pattern, 'i');
        
        const hasWholeWord = data.some((job: JobListing) => {
          const title = (job.title || '').toLowerCase();
          const company = (job.company_raw || '').toLowerCase();
          return regex.test(title) || regex.test(company);
        });

        if (hasWholeWord && query.length >= 2) {
          get().recordSearch(query);
        }
      }
      
    } catch (err: any) {
      set({ error: err.message, loading: false, hasFetched: true });
    }
  }
}));
