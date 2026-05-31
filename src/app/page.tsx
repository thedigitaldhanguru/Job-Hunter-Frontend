'use client';

import { useState, useEffect } from 'react';
import { JobListing } from '@/types/job';

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
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Job Hunter
          </h1>
          <p className="text-muted">
            Real-time scraped job listings powered by Neon Postgres.
          </p>
        </header>

        {/* Search Input - Using Semantic Colors */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0); 
            }}
            className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all duration-200"
          />
        </div>

        {/* Feedback States */}
        {loading && (
          <div className="text-sm text-muted animate-pulse pl-2">
            Fetching data...
          </div>
        )}
        
        {error && !loading && (
          <div className="text-sm text-red-400 pl-2">
            {error}
          </div>
        )}

        {/* Job Cards Grid */}
        {!loading && !error && (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="group bg-surface border border-border hover:border-brand/50 hover:bg-surface-hover rounded-2xl p-6 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-foreground transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-muted text-sm mt-1">
                    {job.company_raw}
                  </p>
                </div>
                <div className="text-xs font-mono text-muted bg-background px-3 py-1.5 rounded-lg border border-border">
                  {job.id}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {searchQuery.trim() === '' && !loading && !error && jobs.length > 0 && (
          <div className="flex justify-between items-center pt-8 border-t border-border">
            <button
              disabled={offset === 0}
              onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
              className="px-5 py-2.5 bg-surface text-foreground rounded-xl text-sm font-medium border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover hover:text-brand transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset((prev) => prev + LIMIT)}
              className="px-5 py-2.5 bg-surface text-foreground rounded-xl text-sm font-medium border border-border hover:bg-surface-hover hover:text-brand transition-all"
            >
              Next Page
            </button>
          </div>
        )}
        
      </div>
    </main>
  );
}