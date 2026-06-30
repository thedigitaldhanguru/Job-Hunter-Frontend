import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/config';

export type Status = 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  dateApplied: string;
  jobUrl?: string;
  location?: string;
  nextStep?: string;
}

interface ApplicationsStore {
  apps: Application[];
  hasFetched: boolean;
  isFetching: boolean;
  error: string | null;
  fetchApplications: (email: string) => Promise<void>;
  addApplicationLocal: (app: Application) => void;
  updateStatusLocal: (id: string, status: Status) => void;
  deleteApplicationLocal: (id: string) => void;
  reset: () => void;
}

export const useApplicationsStore = create<ApplicationsStore>((set, get) => ({
  apps: [],
  hasFetched: false,
  isFetching: false,
  error: null,

  reset: () => set({ apps: [], hasFetched: false, isFetching: false, error: null }),

  fetchApplications: async (email: string) => {
    if (get().hasFetched || get().isFetching) return;

    set({ isFetching: true, error: null });

    try {
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) throw new Error('Failed to retrieve authentication token');
      const { token } = await tokenResponse.json();

      const response = await fetch(`${API_BASE_URL}/applications/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      const formattedApps: Application[] = data.map((item: any) => {
        let rawStatus = item.application_status || 'applied';
        // Normalize status
        let statusStr = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        if (statusStr === 'Interviewing') statusStr = 'Interview';
        if (statusStr === 'Offered') statusStr = 'Offer';
        
        return {
          id: item.id.toString(),
          company: item.company_name || 'Unknown', 
          role: item.job_title || 'Unknown Position',
          status: statusStr as Status,
          dateApplied: item.created_at ? item.created_at.split('T')[0] : '',
          jobUrl: item.job_url || '',
          location: item.location || 'Remote',
          nextStep: item.next_step || ''
        };
      });

      set({ apps: formattedApps, hasFetched: true, isFetching: false });
    } catch (err) {
      console.error(err);
      set({ 
        error: 'Could not load your applications. Are you connected to the internet?', 
        hasFetched: true, 
        isFetching: false 
      });
    }
  },

  addApplicationLocal: (app) => set((state) => ({ apps: [app, ...state.apps] })),
  
  updateStatusLocal: (id, status) => set((state) => ({
    apps: state.apps.map(app => app.id === id ? { ...app, status } : app)
  })),
  
  deleteApplicationLocal: (id) => set((state) => ({
    apps: state.apps.filter(app => app.id !== id)
  }))
}));
