'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function VerifyProfileModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkPending = () => {
      if (session?.user?.email && pathname !== '/profile') {
        const pending = localStorage.getItem('pending_profile_verification');
        if (pending === 'true') {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    };

    checkPending();

    // Listen for background completion event
    window.addEventListener('pending_profile_updated', checkPending);
    return () => {
      window.removeEventListener('pending_profile_updated', checkPending);
    };
  }, [session, pathname]);

  if (!isOpen) return null;

  const handleVerify = () => {
    localStorage.removeItem('pending_profile_verification');
    setIsOpen(false);
    router.push('/profile');
  };

  const handleDismiss = () => {
    localStorage.removeItem('pending_profile_verification');
    setIsOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in"
    >
      <div 
        className="relative w-full max-w-[420px] bg-gradient-to-br from-[#0c1a30] to-[#081224] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden p-8 transform scale-100 transition-all duration-300 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6 relative z-10 pt-2">
          {/* Animated sparkle icon container */}
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse text-blue-400" />
          </div>
          
          <div className="space-y-2.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              Verify Your Profile
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-[320px]">
              We successfully parsed your resume using AI! Let's review the changes to complete your profile setup.
            </p>
          </div>

          <div className="w-full pt-2 flex flex-col gap-3">
            <button 
              onClick={handleVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Verify Profile <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleDismiss}
              className="text-[10px] text-slate-400 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors pt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
