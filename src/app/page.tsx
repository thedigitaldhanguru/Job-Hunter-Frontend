'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { JobListing } from '@/types/job';
import { Search, MapPin, Sparkles, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { useJobsStore } from '@/store/useJobsStore';
import Navbar from '@/components/Navbar';
import AuthForm from '../components/AuthButton';
import SmartFillPrompt from '@/components/SmartFillPrompt';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { 
    jobs, loading, offset, searchQuery, hasFetched, 
    setSearchQuery, setOffset, fetchJobs 
  } = useJobsStore();
  
  const [applyingTo, setApplyingTo] = useState<number | string | null>(null);
  const LIMIT = 20;

  // --- DATA FETCHING (ZUSTAND) ---
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const delayDebounceFn = setTimeout(() => {
      if (hasFetched && searchQuery === '') return;
      fetchJobs(LIMIT, true); // Reset to page 0 on new search
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, status]); 

  // Initial load effect
  useEffect(() => {
    if (status === 'authenticated' && !hasFetched) {
      fetchJobs(LIMIT, true);
    }
  }, [status, hasFetched, fetchJobs]);

  const handleApply = async (e: React.MouseEvent, job: JobListing) => {
    e.stopPropagation();
    if (!session?.user?.email) { signIn(); return; }

    setApplyingTo(job.id);
    try {
      const res = await fetch(`${API_BASE_URL}/apply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: session.user.email,
          job_id: job.id,
          company_name: job.company_raw,
          job_title: job.title,
          application_status: "applied"
        })
      });
      const data = await res.json();
      if (res.ok) {
        const targetUrl = data.redirect_url || job.job_url || job.absolute_url;
        if (targetUrl) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
        router.push('/applications');
      }
    } finally {
      setApplyingTo(null);
    }
  };

  // --- GATEKEEPER ---
  if (status === "loading") return (
    <div className="min-h-screen antialiased relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--kindling-ink)]" />
      </div>
    </div>
  );
  
  if (status === "unauthenticated") return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative z-10 w-full">
      <div className="text-center mb-2">
        <h1 className="text-4xl font-normal text-[var(--kindling-ink)]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>Job Hunter Pro</h1>
      </div>
      <AuthForm />
    </div>
  );

  return (
    <div className="min-h-screen antialiased font-sans text-slate-800 pb-16 relative overflow-x-hidden w-full">
      <Navbar />
      
      <main className="max-w-[1100px] mx-auto px-6 mt-8">
        
        {/* HERO SECTION */}
        <section className="pt-8 pb-16 max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--kindling-border)] bg-white text-[12px] font-medium text-gray-600 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
            12,480 new roles this week
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-normal tracking-tight leading-[1.02] text-[var(--kindling-ink)] mb-6" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
            Find work <br/> <em className="italic font-serif pr-2">worth</em> doing.
          </h1>
          
          <p className="text-[17px] text-gray-600 max-w-[500px] leading-[1.6] mb-7">
            Discover career-defining roles tailored to your unique profile. Skip the noise and find your perfect match.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center bg-white rounded-full border border-[var(--kindling-border)] p-1.5 w-full max-w-[700px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] focus-within:ring-4 focus-within:ring-gray-100 transition-all text-left">
            <div className="flex-1 flex items-center pl-4 py-2 w-full">
              <Search className="w-[18px] h-[18px] text-gray-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Job title, company or keyword" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-400 text-[15px]" 
              />
            </div>
            
            <div className="hidden sm:block w-[1px] h-6 bg-gray-200 mx-2"></div>
            
            <div className="flex-[0.8] flex items-center px-4 py-2 w-full">
              <MapPin className="w-[18px] h-[18px] text-gray-400 mr-3 shrink-0" />
              <input type="text" placeholder="City or remote" className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-400 text-[15px]" />
            </div>
            
            <button className="w-full sm:w-auto mt-2 sm:mt-0 bg-[var(--kindling-ink)] text-white px-7 py-3 rounded-full text-[15px] font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shrink-0">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider mr-2">POPULAR</span>
            {['Product Designer', 'Frontend', 'iOS Engineer', 'Marketing', 'Remote'].map(tag => (
              <span key={tag} className="px-3.5 py-1.5 rounded-full border border-[var(--kindling-border)] bg-white text-[12px] font-medium text-gray-600 hover:border-gray-300 cursor-pointer transition-colors shadow-sm">{tag}</span>
            ))}
          </div>
        </section>

        {/* JOB FEED SECTION */}
        <section className="pt-4 pb-32">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-3 block">Handpicked</span>
              <h2 className="text-[2.75rem] font-normal leading-none" style={{ fontFamily: 'var(--font-instrument-serif)', color: 'var(--kindling-ink)' }}>
                Roles we love this week
              </h2>
            </div>
            <div className="text-[14px] text-gray-500 mb-1">
              Showing <span className="font-semibold text-gray-900">{jobs.length}</span> roles
            </div>
          </div>

          {loading ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
             </div>
          ) : jobs.length === 0 ? (
             <div className="text-center py-20 border border-[var(--kindling-border)] rounded-2xl bg-white">
               <p className="text-gray-500">No jobs found. Try adjusting your search.</p>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job, idx) => (
                  <article 
                    key={job.id} 
                    className="group relative bg-white border border-[var(--kindling-border)] rounded-[1.25rem] p-5 flex flex-col hover:border-[#d4ff70] transition-colors duration-300 shadow-sm"
                  >
                    {idx === 0 && offset === 0 && (
                      <div className="absolute top-4 right-4 bg-[#d4ff70] text-[#111] text-[9px] font-bold tracking-[0.05em] px-2 py-0.5 rounded uppercase">
                        Featured
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-[36px] h-[36px] bg-[var(--kindling-ink)] text-white rounded-[8px] flex items-center justify-center font-serif text-[18px] pt-1">
                        {job.company_raw ? job.company_raw.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-gray-800 leading-tight mb-0.5">{job.company_raw || "Confidential"}</div>
                        <div className="text-[12px] text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-[11px] h-[11px] opacity-70" /> 2d ago
                        </div>
                      </div>
                    </div>

                    <h3 className="text-[1.35rem] font-normal mb-3.5 leading-[1.1] text-gray-900" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                      {job.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-4">
                      <MapPin className="w-3 h-3 opacity-70" />
                      {job.location || "Remote"}
                      <span className="w-[2px] h-[2px] bg-gray-400 rounded-full mx-1"></span>
                      Remote
                      <span className="w-[2px] h-[2px] bg-gray-400 rounded-full mx-1"></span>
                      Full-time
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {['Design Systems', 'Figma', 'Product'].map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[#f9f9f9] border border-[var(--kindling-border)] text-[11px] font-medium text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-dotted border-gray-300 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-0.5">Salary</div>
                        <div className="font-serif text-base text-gray-900">$180k - $220k</div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleApply(e, job)}
                        disabled={applyingTo === job.id}
                        className="bg-[var(--kindling-ink)] text-white px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 hover:bg-black transition-colors"
                      >
                        {applyingTo === job.id ? '...' : (
                          <>Apply <ArrowUpRight className="w-3 h-3 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* PAGINATION */}
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => {
                    setOffset(Math.max(0, offset - LIMIT));
                    fetchJobs(LIMIT, false);
                  }}
                  disabled={offset === 0 || loading}
                  className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-50 bg-white border border-[var(--kindling-border)] text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 font-medium">Page {Math.floor(offset / LIMIT) + 1}</span>
                <button
                  onClick={() => {
                    setOffset(offset + LIMIT);
                    fetchJobs(LIMIT, false);
                  }}
                  disabled={loading || jobs.length < LIMIT}
                  className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-50 bg-white border border-[var(--kindling-border)] text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <SmartFillPrompt />
    </div>
  );
}