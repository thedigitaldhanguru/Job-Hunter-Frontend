'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useProfileStore } from '@/store/useProfileStore';
import { isProfileComplete } from '@/lib/profileHelper';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isComplete } = useProfileStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Navigation interceptor to verify profile completeness
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Going to profile page is always allowed
    if (href === '/profile') return;

    if (session?.user?.email) {
      const draftKey = `profile_draft_${session.user.email}`;
      const localDraftStr = localStorage.getItem(draftKey);
      let completeStatus = isComplete;

      if (localDraftStr) {
        try {
          const draft = JSON.parse(localDraftStr);
          completeStatus = isProfileComplete(draft);
        } catch {
          completeStatus = isComplete;
        }
      }

      if (!completeStatus) {
        e.preventDefault();
        setShowWarningModal(true);
        setIsMobileMenuOpen(false);
      }
    }
  };

  return (
    <>
      <nav className="w-full border-b border-[var(--kindling-border)] bg-transparent relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity z-50">
            <div className="w-8 h-8 rounded-full bg-[var(--kindling-ink)] text-white flex items-center justify-center font-serif text-xl leading-none pt-1">
              k
            </div>
            <span className="font-serif text-[1.35rem] tracking-tight text-[var(--kindling-ink)]">kindling</span>
          </Link>
          
          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center bg-transparent rounded-full p-1 border border-[var(--kindling-border)]">
            <Link 
              href="/" 
              onClick={(e) => handleNavClick(e, '/')}
              className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Find work
            </Link>
            <Link 
              href="/applications" 
              onClick={(e) => handleNavClick(e, '/applications')}
              className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/applications' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Applications
            </Link>
            <Link 
              href="/profile" 
              onClick={(e) => handleNavClick(e, '/profile')}
              className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/profile' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Profile
            </Link>
          </div>

          {/* DESKTOP ACTIONS & MOBILE TOGGLE */}
          <div className="flex items-center gap-3 md:gap-5 z-50">
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-black"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE FULL-SCREEN MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-20 bg-white/95 backdrop-blur-md z-40 md:hidden flex flex-col items-center justify-start pt-10 border-t border-[var(--kindling-border)] animate-fade-in px-6">
            <div className="flex flex-col items-center gap-6 text-center w-full">
              <Link 
                href="/" 
                onClick={(e) => { handleNavClick(e, '/'); setIsMobileMenuOpen(false); }}
                className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
              >
                Find work
              </Link>
              <Link 
                href="/applications" 
                onClick={(e) => { handleNavClick(e, '/applications'); setIsMobileMenuOpen(false); }}
                className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/applications' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
              >
                Applications
              </Link>
              <Link 
                href="/profile" 
                onClick={(e) => { handleNavClick(e, '/profile'); setIsMobileMenuOpen(false); }}
                className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/profile' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
              >
                Profile
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* WARNING POPUP: ENTER REMAINING FIELDS DETAILS */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[4px] animate-fade-in">
          <div className="bg-white rounded-[1.5rem] shadow-2xl border border-[var(--kindling-border)] p-6 sm:p-8 max-w-md w-full text-center space-y-5 transform scale-100 transition-all duration-300">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-950 font-serif">
                Complete your profile
              </h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                You have not completed all required details yet. Please fill out all required fields on your profile to browse jobs or view applications.
              </p>
            </div>

            <button 
              onClick={() => {
                setShowWarningModal(false);
                router.push('/profile');
              }}
              className="w-full py-3.5 bg-[var(--kindling-ink)] hover:opacity-80 text-white rounded-full font-bold text-sm shadow-lg transition-all duration-300 active:scale-[0.98] mt-2 flex items-center justify-center gap-1.5"
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
}