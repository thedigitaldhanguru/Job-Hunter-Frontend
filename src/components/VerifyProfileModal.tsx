'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function VerifyProfileModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if user is logged in, the pending flag is set, and they aren't already on the profile page
    if (session?.user?.email && pathname !== '/profile') {
      const pending = localStorage.getItem('pending_profile_verification');
      if (pending === 'true') {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [session, pathname]);

  if (!isOpen) return null;

  const handleVerify = () => {
    localStorage.removeItem('pending_profile_verification');
    setIsOpen(false);
    router.push('/profile');
  };

  return (
    <div 
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in"
    >
      <div 
        className="relative w-full max-w-[400px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[var(--kindling-border)] overflow-hidden p-8 transform scale-100 transition-all duration-300 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-[#d4ff70] rounded-xl flex items-center justify-center shadow-sm border border-[#c3f05b]">
            <Sparkles className="w-6 h-6 text-[var(--kindling-ink)]" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-normal text-[var(--kindling-ink)] leading-none" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              Verify Your Profile
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[320px]">
              We successfully parsed your resume using AI! Let's review the changes to complete your profile setup.
            </p>
          </div>

          <div className="w-full pt-4">
            <button 
              onClick={handleVerify}
              className="w-full bg-[var(--kindling-ink)] hover:bg-black text-white py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Verify Profile <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
