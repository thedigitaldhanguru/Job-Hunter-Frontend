'use client';

import { useState, useEffect } from 'react';
import { JobListing } from '@/types/job';
import { Search, Briefcase, ArrowRight, Activity } from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url = `http://127.0.0.1:8000/jobs?limit=${LIMIT}&offset=${offset}`;
        
        if (searchQuery.trim() !== '') {
          url = `http://127.0.0.1:8000/jobs/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const res = await fetch(url);
        
        if (!res.ok) {
          if (res.status === 404) {
            setJobs([]);
            throw new Error('No jobs found matching your search.');
          }
          throw new Error('Failed to fetch from the FastAPI server.');
        }

        const data = await res.json();
        setJobs(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, offset]);

  return (
    <main className="min-h-screen p-6 md:p-12 selection:bg-brand/30">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Minimalist Header */}
        <header className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-brand mb-2">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Live Database Connection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Job Hunter
          </h1>
          <p className="text-muted text-lg">
            High-speed partial-matching powered by Neon pg_trgm.
          </p>
        </header>

        {/* Elevated Search Input */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors duration-300" />
          <input
            type="text"
            placeholder="Search by role or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0); 
            }}
            className="w-full bg-surface border border-border rounded-2xl pl-14 pr-6 py-4 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all duration-300 shadow-sm"
          />
        </div>
        
        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading State: Skeleton Grid */}
        {loading && (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row justify-between gap-4 animate-pulse">
                <div className="space-y-3 w-full max-w-sm">
                  <div className="h-5 bg-border rounded-md w-3/4"></div>
                  <div className="h-4 bg-border rounded-md w-1/2"></div>
                </div>
                <div className="h-6 w-24 bg-border rounded-md mt-auto sm:mt-0"></div>
              </div>
            ))}
          </div>
        )}

        {/* Data State: Premium Job Cards */}
        {!loading && !error && (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="group relative bg-surface border border-border hover:border-brand/40 hover:bg-surface-hover rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row justify-between gap-4 overflow-hidden"
              >
                {/* Subtle side highlight on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="pl-2">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-brand transition-colors duration-300">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-muted text-sm font-medium">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.company_raw}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end mt-2 sm:mt-0 gap-4">
                  <span className="text-xs font-mono text-muted/60">
                    ID: {job.id.substring(0, 8)}
                  </span>
                  <div className="p-2 rounded-full bg-background border border-border group-hover:bg-brand group-hover:border-brand group-hover:text-white text-muted transition-all duration-300 transform translate-x-0 sm:translate-x-4 sm:opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refined Pagination Controls */}
        {searchQuery.trim() === '' && !loading && !error && jobs.length > 0 && (
          <div className="flex justify-between items-center pt-6 pb-12 border-t border-border">
            <button
              disabled={offset === 0}
              onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
              className="px-6 py-2.5 bg-surface text-foreground rounded-xl text-sm font-medium border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover hover:border-muted transition-all duration-200"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-muted">
              Records {offset + 1} - {offset + LIMIT}
            </span>
            <button
              onClick={() => setOffset((prev) => prev + LIMIT)}
              className="px-6 py-2.5 bg-surface text-foreground rounded-xl text-sm font-medium border border-border hover:bg-surface-hover hover:border-muted transition-all duration-200"
            >
              Next Page
            </button>
          </div>
        )}
        
      </div>
    </main>
  );
}