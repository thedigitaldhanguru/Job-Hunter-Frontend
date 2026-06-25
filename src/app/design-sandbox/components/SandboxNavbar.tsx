'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function SandboxNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full border-b border-[var(--kindling-border)] bg-transparent relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/design-sandbox" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-50">
          <div className="w-8 h-8 rounded-full bg-[var(--kindling-ink)] text-white flex items-center justify-center font-serif text-xl leading-none pt-1">
            k
          </div>
          <span className="font-serif text-[1.35rem] tracking-tight text-[var(--kindling-ink)]">kindling</span>
        </Link>
        
        {/* DESKTOP NAV LINKS */}
        <div className="hidden md:flex items-center bg-transparent rounded-full p-1 border border-[var(--kindling-border)]">
          <Link href="/design-sandbox" className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/design-sandbox' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}>
            Find work
          </Link>
          <Link href="/design-sandbox/applications" className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/design-sandbox/applications' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}>
            Applications
          </Link>
          <Link href="/design-sandbox/profile" className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-colors ${pathname === '/design-sandbox/profile' ? 'bg-[var(--kindling-ink)] text-white' : 'text-gray-500 hover:text-black'}`}>
            Profile
          </Link>
        </div>

        {/* DESKTOP ACTIONS & MOBILE TOGGLE */}
        <div className="flex items-center gap-3 md:gap-5 z-50">
          <div className="hidden sm:flex items-center gap-5">
            <button className="text-[14px] font-medium text-gray-600 hover:text-black transition-colors">Sign in</button>
            <button className="bg-[var(--kindling-ink)] text-white px-5 py-2 rounded-full text-[14px] font-medium hover:bg-black transition-colors">Get started</button>
          </div>
          
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
              href="/design-sandbox" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/design-sandbox' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
            >
              Find work
            </Link>
            <Link 
              href="/design-sandbox/applications" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/design-sandbox/applications' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
            >
              Applications
            </Link>
            <Link 
              href="/design-sandbox/profile" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-serif w-full py-4 border-b border-[var(--kindling-border)] ${pathname === '/design-sandbox/profile' ? 'text-[var(--kindling-ink)] font-normal' : 'text-gray-500'}`}
            >
              Profile
            </Link>
            
            <div className="flex flex-col gap-4 mt-8 w-full sm:hidden">
              <button className="w-full py-3 border border-[var(--kindling-border)] rounded-full text-[16px] font-medium text-gray-700">Sign in</button>
              <button className="w-full py-3 bg-[var(--kindling-ink)] text-white rounded-full text-[16px] font-medium">Get started</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
