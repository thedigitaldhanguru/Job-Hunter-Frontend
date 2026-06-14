'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Typographic Logo - High Contrast & Minimalist */}
        <Link href="/" className="flex items-center group shrink-0">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tighter transition-colors group-hover:text-slate-600">
            Job Hunter
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <Link 
            href="/" 
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
              onClick={() => setIsMobileMenuOpen(false)}
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
              onClick={() => setIsMobileMenuOpen(false)}
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
              onClick={() => setIsMobileMenuOpen(false)}
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
  );
}