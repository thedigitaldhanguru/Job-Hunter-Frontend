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
      <nav className="sticky top-0 z-50 w-full bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Typographic Logo */}
          <Link href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center group shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tighter transition-colors group-hover:text-slate-600">
              Job Hunter
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
            <Link 
              href="/" 
              onClick={(e) => handleNavClick(e, '/')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === '/' 
                  ? 'bg-slate-200/50 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Search
            </Link>
            <Link 
              href="/profile" 
              onClick={(e) => handleNavClick(e, '/profile')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === '/profile' 
                  ? 'bg-slate-200/50 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Profile
            </Link>
            <Link 
              href="/applications" 
              onClick={(e) => handleNavClick(e, '/applications')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === '/applications' 
                  ? 'bg-slate-200/50 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Applications
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="sm:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-[#FAFAFA] animate-fade-in absolute w-full shadow-lg">
            <div className="flex flex-col px-4 py-3 space-y-2 text-sm font-medium">
              <Link 
                href="/" 
                onClick={(e) => { handleNavClick(e, '/'); setIsMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  pathname === '/' 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Search Jobs
              </Link>
              <Link 
                href="/profile" 
                onClick={(e) => { handleNavClick(e, '/profile'); setIsMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  pathname === '/profile' 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                My Profile
              </Link>
              <Link 
                href="/applications" 
                onClick={(e) => { handleNavClick(e, '/applications'); setIsMobileMenuOpen(false); }}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  pathname === '/applications' 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Applications
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* WARNING POPUP: ENTER REMAINING FIELDS DETAILS */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[4px] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 max-w-md w-full text-center space-y-5 transform scale-100 transition-all duration-300">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-950">
                Enter Remaining Fields Details
              </h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                You have not completed all required details yet. Please fill out all required fields on your profile (Name, Phone, Location, Degree, University, Salary Preferences, and Resume) to browse jobs or view applications.
              </p>
            </div>

            <button 
              onClick={() => {
                setShowWarningModal(false);
                router.push('/profile');
              }}
              className="w-full py-3.5 bg-slate-950 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg transition-all duration-300 active:scale-[0.98] mt-2 flex items-center justify-center gap-1.5"
            >
              Go Complete Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
}