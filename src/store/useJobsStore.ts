import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/config';

import { JobListing } from '@/types/job';

interface JobsStore {
  jobs: JobListing[];
  loading: boolean;
  error: string | null;
  offset: number;
  searchQuery: string;
  hasFetched: boolean;

  setSearchQuery: (query: string) => void;
  setOffset: (offset: number) => void;
  fetchJobs: (limit: number, reset?: boolean) => Promise<void>;
  reset: () => void;
}

export const useJobsStore = create<JobsStore>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  offset: 0,
  searchQuery: '',
  hasFetched: false,

  reset: () => set({ jobs: [], loading: false, error: null, offset: 0, searchQuery: '', hasFetched: false }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setOffset: (offset) => set({ offset }),

  fetchJobs: async (limit: number, reset = false) => {
    const { searchQuery, offset, jobs, loading } = get();
    
    if (loading) return;
    
    // If we're resetting (like a new search), start from 0
    const currentOffset = reset ? 0 : offset;

    set({ loading: true, error: null });

    try {
      let url = `${API_BASE_URL}/jobs?limit=${limit}&offset=${currentOffset}`;
      if (searchQuery.trim() !== '') {
        url = `${API_BASE_URL}/jobs/search?q=${encodeURIComponent(searchQuery)}`;
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
        jobs: reset ? data : [...jobs, ...data], 
        offset: currentOffset,
        loading: false, 
        hasFetched: true 
      });
      
    } catch (err: any) {
      set({ error: err.message, loading: false, hasFetched: true });
    }
  }
}));
