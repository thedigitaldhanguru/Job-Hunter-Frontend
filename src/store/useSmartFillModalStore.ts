import { create } from 'zustand';

interface SmartFillModalState {
  isOpen: boolean;
  onUploadSuccess: (() => void) | null;
  openModal: (onUploadSuccess: () => void) => void;
  closeModal: () => void;
}

export const useSmartFillModalStore = create<SmartFillModalState>((set) => ({
  isOpen: false,
  onUploadSuccess: null,
  openModal: (onUploadSuccess) => set({ isOpen: true, onUploadSuccess }),
  closeModal: () => set({ isOpen: false, onUploadSuccess: null }),
}));
