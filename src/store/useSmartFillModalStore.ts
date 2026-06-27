import { create } from 'zustand';

interface SmartFillModalState {
  isOpen: boolean;
  isBackgroundExtracting: boolean;
  onUploadSuccess: (() => void) | null;
  openModal: (onUploadSuccess: () => void) => void;
  closeModal: () => void;
  setBackgroundExtracting: (val: boolean) => void;
}

export const useSmartFillModalStore = create<SmartFillModalState>((set) => ({
  isOpen: false,
  isBackgroundExtracting: false,
  onUploadSuccess: null,
  openModal: (onUploadSuccess) => set({ isOpen: true, onUploadSuccess }),
  closeModal: () => set({ isOpen: false, onUploadSuccess: null }),
  setBackgroundExtracting: (val) => set({ isBackgroundExtracting: val }),
}));
