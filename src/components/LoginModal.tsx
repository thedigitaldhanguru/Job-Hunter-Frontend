'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import AuthForm from './AuthButton';

export default function LoginModal() {
  const { isOpen, closeModal } = useAuthModalStore();

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in"
      onClick={closeModal}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[var(--kindling-border)] overflow-hidden transform scale-100 transition-all duration-300 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* AUTH FORM CARD */}
        <div className="pt-6 pb-2 px-1">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
