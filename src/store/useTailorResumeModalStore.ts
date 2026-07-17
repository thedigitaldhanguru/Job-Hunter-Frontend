import { create } from 'zustand';
import { JobListing } from '@/types/job';

interface TailorResumeModalState {
  isOpen: boolean;
  selectedJob: JobListing | null;
  openModal: (job: JobListing) => void;
  closeModal: () => void;
}

export const useTailorResumeModalStore = create<TailorResumeModalState>((set) => ({
  isOpen: false,
  selectedJob: null,
  openModal: (job) => set({ isOpen: true, selectedJob: job }),
  closeModal: () => set({ isOpen: false, selectedJob: null }),
}));
