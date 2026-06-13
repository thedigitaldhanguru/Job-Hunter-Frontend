'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Typographic Logo - High Contrast & Minimalist */}
        <Link href="/" className="flex items-center group">
          <span className="text-2xl font-bold text-slate-900 tracking-tighter transition-colors group-hover:text-slate-600">
            Job Hunter
          </span>
        </Link>

        {/* Navigation Links - Dynamic Active States */}
        <div className="flex items-center gap-1 md:gap-2 text-sm font-medium">
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
            className={`px-4 py-2 rounded-lg transition-colors hidden sm:block ${
              pathname === '/applications' 
                ? 'bg-slate-200/50 text-slate-900' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Applications
          </Link>
        </div>

      </div>
    </nav>
  );
}