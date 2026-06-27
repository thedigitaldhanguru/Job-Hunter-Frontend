import { create } from 'zustand';

interface SmartFillModalState {
  isOpen: boolean;
  onSkip: (() => void) | null;
  onUploadSuccess: (() => void) | null;
  openModal: (onSkip: () => void, onUploadSuccess: () => void) => void;
  closeModal: () => void;
}

export const useSmartFillModalStore = create<SmartFillModalState>((set) => ({
  isOpen: false,
  onSkip: null,
  onUploadSuccess: null,
  openModal: (onSkip, onUploadSuccess) => set({ isOpen: true, onSkip, onUploadSuccess }),
  closeModal: () => set({ isOpen: false, onSkip: null, onUploadSuccess: null }),
}));
