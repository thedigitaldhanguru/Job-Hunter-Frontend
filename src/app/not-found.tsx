'use client';

import Link from 'next/link';
import { 
  Home, Briefcase, Search, FileText, User, ArrowRight, Wrench
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-orange-50/50 rounded-full blur-2xl pointer-events-none z-0" />

        <div className="max-w-xl w-full text-center space-y-8 relative z-10">
          {/* Under Construction block */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner border border-blue-100 animate-pulse">
              <Wrench className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-sans select-none">
                We're building this!
              </h1>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Coming Soon
              </h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed pt-1">
                The page you're looking for is on its way. We're currently in the process of building it to give you the best experience. Let's get you back on track.
              </p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-4 pt-4">
            {/* Primary Action */}
            <div className="flex justify-center">
              <Link 
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0a4fcd] to-[#051949] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all group"
              >
                <Home className="w-4.5 h-4.5" />
                <span>Go home</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200/60"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#fafafa] px-3 font-semibold text-slate-400">Or navigate to</span>
              </div>
            </div>

            {/* Other routes cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                href="/jobs"
                className="bg-white border border-slate-200/60 rounded-2xl p-4 text-left hover:shadow-md hover:border-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-100 transition-colors shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Browse open roles</div>
                  <div className="text-slate-400 text-[10px] font-medium mt-0.5">Explore active vacancies</div>
                </div>
              </Link>

              <Link 
                href="/jobs"
                className="bg-white border border-slate-200/60 rounded-2xl p-4 text-left hover:shadow-md hover:border-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition-colors shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Search jobs</div>
                  <div className="text-slate-400 text-[10px] font-medium mt-0.5">Find jobs matching skills</div>
                </div>
              </Link>

              <Link 
                href="/applications"
                className="bg-white border border-slate-200/60 rounded-2xl p-4 text-left hover:shadow-md hover:border-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner group-hover:bg-purple-100 transition-colors shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Applications</div>
                  <div className="text-slate-400 text-[10px] font-medium mt-0.5">Track your pipeline</div>
                </div>
              </Link>

              <Link 
                href="/profile"
                className="bg-white border border-slate-200/60 rounded-2xl p-4 text-left hover:shadow-md hover:border-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:bg-emerald-100 transition-colors shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Profile</div>
                  <div className="text-slate-400 text-[10px] font-medium mt-0.5">Manage details & resume</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
