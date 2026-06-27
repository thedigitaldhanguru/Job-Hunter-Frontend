'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, AlertCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useProfileStore } from '@/store/useProfileStore';
import { isProfileComplete } from '@/lib/profileHelper';
import { useAuthModalStore } from '@/store/useAuthModalStore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isComplete } = useProfileStore();
  const { openModal } = useAuthModalStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-full border-b border-[var(--kindling-border)] bg-transparent relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-50">
            <div className="w-8 h-8 rounded-full bg-[var(--kindling-ink)] text-white flex items-center justify-center font-serif text-xl leading-none pt-1">
              k
            </div>
            <span className="font-serif text-[1.35rem] tracking-tight text-[var(--kindling-ink)]">kindling</span>
          </Link>
          
          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center bg-transparent rounded-full p-1 border border-[var(--kindling-border)]">
            <Link 
              href="/" 
              className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
            >
              Find work
            </Link>
            {session && (
              <>
                <Link 
                  href="/applications" 
                  className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/applications' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
                >
                  Applications
                </Link>
                <Link 
                  href="/profile" 
                  className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors flex items-center gap-1.5 ${pathname === '/profile' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}
                >
                  Profile
                  {!isComplete && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  )}
                </Link>
              </>
            )}
          </div>

          {/* DESKTOP ACTIONS & MOBILE TOGGLE */}
          <div className="flex items-center gap-3 md:gap-5 z-50">
            {session ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">{session.user?.email}</span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 border border-[var(--kindling-border)] rounded-full text-xs font-semibold text-gray-500 hover:text-black hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={openModal}
                className="hidden md:flex bg-[var(--kindling-ink)] text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-sm"
              >
                Login / Sign Up
              </button>
            )}
            
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
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
              >
                Find work
              </Link>
              {session ? (
                <>
                  <Link 
                    href="/applications" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/applications' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
                  >
                    Applications
                  </Link>
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] flex items-center justify-center gap-2 ${pathname === '/profile' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
                  >
                    Profile
                    {!isComplete && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    )}
                  </Link>
                  <button 
                    onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }}
                    className="text-2xl font-serif w-full py-4 text-red-500 border-b border-[var(--kindling-border)]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { openModal(); setIsMobileMenuOpen(false); }}
                  className="text-2xl font-serif w-full py-4 text-[var(--kindling-ink)] font-semibold border-b border-[var(--kindling-border)]"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

    </>
  );
}