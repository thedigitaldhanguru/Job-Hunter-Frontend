import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/config';

export const EMPTY_PROFILE = {
  header: { name: '', degree: '', university: '', location: '', experience: '', phone: '', email: '', gender: '', dob: '', avatar: '' },
  summary: '', resumeName: '', resumeUrl: '', employment: [] as any[], internships: [] as any[], education: [] as any[], skills: [] as string[], projects: [] as any[], 
  languages: [] as string[], academicAchievements: [] as any[], accomplishments: [] as any[], exams: [] as any[], 
  preferences: { jobType: '', availability: '', location: '', currentCTC: '', expectedCTC: '' }
};

interface ProfileStore {
  profileData: typeof EMPTY_PROFILE;
  isComplete: boolean;
  hasFetched: boolean;
  isFetching: boolean;
  fetchProfile: (email: string, sessionName?: string | null, sessionImage?: string | null) => Promise<void>;
  setProfileData: (data: typeof EMPTY_PROFILE) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profileData: EMPTY_PROFILE,
  isComplete: true, // default to true so it doesn't instantly pop up onboarding while fetching
  hasFetched: false,
  isFetching: false,

  reset: () => set({ profileData: EMPTY_PROFILE, isComplete: true, hasFetched: false, isFetching: false }),

  setProfileData: (data) => set({ profileData: data }),

  fetchProfile: async (email: string, sessionName?: string | null, sessionImage?: string | null) => {
    if (get().hasFetched || get().isFetching) return;
    
    set({ isFetching: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${email}`);
      if (response.ok) {
        const res = await response.json();
        
        let extended = res.extended_profile;
        while (typeof extended === 'string') {
          try { extended = JSON.parse(extended); } catch { break; }
        }
        if (!extended || typeof extended !== 'object') extended = {}; 

        const formattedData = {
          header: { 
            name: res.full_name || sessionName || '',
            email: res.email || email, 
            degree: res.degree || '', 
            university: res.university || '', 
            location: res.location || '', 
            experience: res.experience || '',
            phone: res.phone || '', 
            gender: res.gender || '', 
            dob: res.dob || '', 
            avatar: res.avatar_url && res.avatar_url !== 'null' ? res.avatar_url : (sessionImage || '') 
          },
          summary: res.profile_summary || '', 
          resumeName: extended.resumeName || '',
          resumeUrl: extended.resumeUrl || res.resume_url || '', 
          employment: Array.isArray(extended.employment) ? extended.employment : [],
          internships: Array.isArray(extended.internships) ? extended.internships : [],
          education: Array.isArray(extended.education) ? extended.education : [],
          skills: Array.isArray(extended.skills) ? extended.skills : [],
          projects: Array.isArray(extended.projects) ? extended.projects : [],
          languages: Array.isArray(extended.languages) ? extended.languages : [],
          academicAchievements: Array.isArray(extended.academicAchievements) ? extended.academicAchievements : [],
          accomplishments: Array.isArray(extended.accomplishments) ? extended.accomplishments : [],
          exams: Array.isArray(extended.exams) ? extended.exams : [],
          preferences: extended.preferences || EMPTY_PROFILE.preferences
        };

        const isComplete = Boolean(
          formattedData.header.phone && 
          formattedData.header.location && 
          formattedData.header.degree && 
          formattedData.header.university && 
          (formattedData.preferences.currentCTC || extended?.preferences?.currentCTC) && 
          (formattedData.preferences.expectedCTC || extended?.preferences?.expectedCTC) && 
          (formattedData.resumeUrl)
        );

        set({ 
          profileData: formattedData, 
          isComplete,
          hasFetched: true,
          isFetching: false
        });
      } else {
        set({ hasFetched: true, isFetching: false, isComplete: false });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      set({ hasFetched: true, isFetching: false, isComplete: false });
    }
  }
}));
