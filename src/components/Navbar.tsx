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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const getNotifications = () => {
    interface NotificationItem {
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: 'info' | 'warning' | 'success';
      link: string;
    }
    const list: NotificationItem[] = [];
    if (!session) return list;

    if (isBackgroundExtracting) {
      list.push({
        id: 'parsing',
        title: 'Parsing Resume...',
        description: 'AI is extracting your skills and work experience from your PDF.',
        timestamp: 'In progress',
        type: 'info' as const,
        link: '/profile'
      });
    } else if (!isComplete) {
      list.push({
        id: 'incomplete',
        title: 'Profile Incomplete',
        description: 'Please upload a resume or fill details to unlock AI job matchmaking.',
        timestamp: 'Action required',
        type: 'warning' as const,
        link: '/profile'
      });
    } else {
      list.push({
        id: 'complete',
        title: 'Smart Fill Successful!',
        description: 'Your profile has been updated. Auto-ranked jobs are now active.',
        timestamp: 'Active',
        type: 'success' as const,
        link: '/profile'
      });
    }

    return list;
  };

  const notificationsList = getNotifications();

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
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-2 hover:bg-slate-50 rounded-full transition-all relative ${isNotificationOpen ? 'text-[#2563eb] bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Bell className="w-5 h-5" />
              {session && notificationsList.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-red-500 border border-white rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm select-none">
                  {notificationsList.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <>
                {/* Backdrop Click Close */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2.5 w-80 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl p-1.5 z-50 animate-fade-in text-sm font-semibold">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span>Notifications</span>
                    {notificationsList.length > 0 && (
                      <span className="text-[10px] text-[#2563eb] hover:underline cursor-pointer lowercase" onClick={() => setIsNotificationOpen(false)}>
                        dismiss
                      </span>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notificationsList.length > 0 ? (
                      notificationsList.map((notif) => {
                        return (
                          <Link
                            key={notif.id}
                            href={notif.link}
                            onClick={() => setIsNotificationOpen(false)}
                            className="flex items-start gap-3 p-3.5 hover:bg-slate-50/80 rounded-xl transition-all"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
                              notif.type === 'info' ? 'bg-blue-50 text-[#2563eb]' :
                              notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-amber-50 text-amber-500'
                            }`}>
                              {notif.type === 'info' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" />
                              ) : notif.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                              )}
                            </div>
                            <div className="space-y-0.5 text-left">
                              <h4 className="font-bold text-slate-800 text-[13px] leading-snug">{notif.title}</h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.description}</p>
                              <span className="text-[10px] text-slate-400 font-semibold block pt-1">{notif.timestamp}</span>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="py-8 px-4 text-center space-y-2">
                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                          <Bell className="w-4.5 h-4.5 opacity-60" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-700 text-xs">All caught up!</h4>
                          <p className="text-[11px] text-slate-400 font-medium max-w-[200px] mx-auto">No pending status alerts or profile updates right now.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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