'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { JobListing } from '@/types/job';
import { Search, Briefcase, Building2, Loader2, ExternalLink, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthForm from '../components/AuthButton';
import { API_BASE_URL } from '@/lib/config';

export default function Home() {
  const { data: session, status } = useSession();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  
  const [applyingTo, setApplyingTo] = useState<number | string | null>(null);
  const LIMIT = 20;

  // --- DATA FETCHING ---
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/jobs?limit=${LIMIT}&offset=${offset}`;
        if (searchQuery.trim() !== '') {
          url = `${API_BASE_URL}/jobs/search?q=${encodeURIComponent(searchQuery)}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) { setJobs([]); return; }
          throw new Error('Failed to fetch jobs.');
        }
        const data = await res.json();
        setJobs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    const delayDebounceFn = setTimeout(fetchJobs, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, offset, status]);

  // --- APPLY LOGIC ---
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
        if (targetUrl) window.open(targetUrl, '_blank');
        window.location.href = "/applications";
      }
    } finally {
      setApplyingTo(null);
    }
  };

  // --- GATEKEEPER ---
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (status === "unauthenticated") return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-2">Job Hunter Pro</h1>
      <AuthForm />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased relative overflow-hidden">
      {/* Decorative premium background grid */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
      
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col gap-14">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center space-y-8 mt-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-sm mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Over 10,000+ active roles
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
              Discover your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                career defining role.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mt-6">
              Skip the noise. We match your unique profile with top-tier companies actively hiring right now.
            </p>
          </div>

          <div className="relative flex items-center bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 p-2 w-full max-w-3xl group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all duration-300">
            <div className="pl-6 pr-2">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by job title, skill, or company..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
              className="flex-1 bg-transparent py-4 outline-none text-slate-900 font-medium placeholder:text-slate-400 text-lg"
            />
            <button className="hidden sm:block bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 rounded-full transition-colors">
              Search
            </button>
          </div>
        </section>

        {/* JOB FEED SECTION */}
        <section className="pt-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Recommended for you</h2>
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {jobs.length} roles found
            </span>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
               <p className="text-slate-500 font-medium animate-pulse">Curating the best roles...</p>
             </div>
          ) : jobs.length === 0 ? (
             <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
               <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-900">No jobs found</h3>
               <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
             </div>
          ) : (
            <div className="space-y-5">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="group bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    {/* Company Initial Badge */}
                    <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-200 items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <span className="text-xl font-extrabold text-slate-700">
                        {job.company_raw ? job.company_raw.charAt(0).toUpperCase() : 'C'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        {/* Optional badge */}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          New
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          {job.company_raw || "Confidential"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {job.location || "Remote"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleApply(e, job)} 
                    disabled={applyingTo === job.id}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-full font-bold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900"
                  >
                    {applyingTo === job.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Now</span>
                        <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </>
                    )}
                  </button>
                </div>
              ))}
              
              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 pt-8 pb-4">
                <button 
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                  className="px-6 py-3 rounded-full font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md"
                >
                  Previous Page
                </button>
                <button 
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={jobs.length < LIMIT}
                  className="px-6 py-3 rounded-full font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md"
                >
                  Next Page
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}