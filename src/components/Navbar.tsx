'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Briefcase, ChevronDown, Bell, Menu, X, Loader2, User 
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useProfileStore } from '@/store/useProfileStore';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isComplete, fetchProfile } = useProfileStore();
  const { isBackgroundExtracting } = useSmartFillModalStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // globally fetch profile details once user logs in
  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile(session.user.email, session.user.name, session.user.image);
    }
  }, [session, fetchProfile]);

  // Track header scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide global navbar on full-screen login / register screens
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-[#e2e8f0] bg-white ${isScrolled ? 'shadow-sm py-3' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a4fcd] to-[#051949] flex items-center justify-center shadow-md shadow-blue-500/10 group-hover:scale-105 transition-all">
              <Briefcase className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#0f172a]">
              hire<span className="text-[#f97316]">deck</span>
            </span>
          </Link>

          {/* Navigation links (lg+) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {[
              { 
                label: 'Jobs', 
                href: '/jobs',
                subItems: [
                  { label: 'Remote', href: '/jobs' },
                  { label: 'Job by skill', href: '/jobs' },
                  { label: 'Job by companies', href: '/jobs' },
                  { label: 'Job by location', href: '/jobs' }
                ]
              },
              { 
                label: 'Companies', 
                href: '/companies',
                subItems: [
                  { label: 'MNCs', href: '/companies/mncs' },
                  { label: 'Startups', href: '/companies/startups' },
                  { label: 'Review and ratings', href: '/companies' }
                ]
              },
              { 
                label: 'Applications', 
                href: '/applications', 
                subItems: [
                  { label: 'Applied', href: '/applications' },
                  { label: 'Saved', href: '/applications' },
                  { label: 'Interview tracker', href: '/applications' }
                ]
              },
              { 
                label: 'Services', 
                href: '/services/resume-building',
                subItems: [
                  { label: 'Resume building', href: '/services/resume-building' },
                  { label: 'Mock interviews', href: '/services/mock-interviews' },
                  { label: 'Profile boost', href: '/services/profile-boost' },
                  { label: 'Career coaching', href: '/services/career-coaching' }
                ]
              }
            ].map((item) => {
              const isActive = pathname === item.href;

              return (
                <div key={item.label} className="relative group">
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-slate-50 ${isActive ? 'text-[#2563eb] bg-blue-50/50' : 'text-slate-600 hover:text-[#2563eb]'}`}
                  >
                    {item.label}
                    {item.subItems && <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" />}
                  </Link>

                  {/* Hover dropdown pane */}
                  {item.subItems && (
                    <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-[#e2e8f0] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-1.5 z-50">
                      <span className="block px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Explore</span>
                      {item.subItems.map((sub) => (
                        <Link 
                          key={sub.label} 
                          href={sub.href} 
                          className="block px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] rounded-lg font-semibold transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative">
            <Bell className="w-5 h-5" />
            {(isBackgroundExtracting || !isComplete) && session && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f97316] border-2 border-white rounded-full animate-pulse" />
            )}
          </button>

          {session ? (
            <div className="relative">
              {/* Profile Avatar Button */}
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center focus:outline-none"
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="User Profile" 
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 hover:ring-2 hover:ring-[#2563eb]/20 transition-all cursor-pointer"
                  />
                ) : session.user?.name ? (
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2563eb] border border-blue-100 flex items-center justify-center font-bold text-sm shadow-inner hover:bg-blue-100 transition-colors cursor-pointer">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <>
                  {/* Invisible Backdrop Click Trigger to Close */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2.5 w-56 bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-1.5 z-50 animate-fade-in text-sm font-semibold">
                    <div className="px-3.5 py-2 border-b border-slate-100 space-y-0.5 max-w-xs">
                      <div className="text-slate-800 font-bold truncate">{session.user?.name || "User Profile"}</div>
                      <div className="text-slate-400 text-xs truncate font-medium">{session.user?.email}</div>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/profile" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] rounded-lg transition-colors"
                      >
                        <span>My Profile</span>
                        {isBackgroundExtracting ? (
                          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                        ) : !isComplete ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        ) : null}
                      </Link>
                      <Link 
                        href="/applications" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="block px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] rounded-lg transition-colors"
                      >
                        Track Applications
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5">
                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="w-full text-left px-3.5 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-bold"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#2563eb] transition-all"
              >
                Login
              </Link>
              <Link 
                href="/register"
                className="px-5 py-2 bg-white border border-[#2563eb] text-[#2563eb] rounded-full text-sm font-semibold hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#e2e8f0] p-4 flex flex-col gap-4 shadow-lg animate-fade-in">
          {[
            { label: 'Jobs', href: '/jobs' },
            { label: 'Companies', href: '/companies' },
            { label: 'Applications', href: '/applications' }
          ].map((item) => {
            return (
              <Link 
                key={item.label} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 py-1"
              >
                {item.label}
              </Link>
            );
          })}
          
          {session ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-semibold px-2">{session.user?.email}</span>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-bold bg-red-50/50 text-center"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2.5 border border-[#e2e8f0] rounded-xl text-sm font-bold text-slate-700 text-center">Login</Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2.5 bg-[#2563eb] text-white rounded-xl text-sm font-bold shadow-sm text-center">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}