'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, MapPin, Star, ArrowRight, TrendingUp, Palette, BarChart3, 
  Megaphone, Box, PenTool, Wallet, Clock, Loader2, ArrowUpRight,
  Sparkles, FileText, Shield, Zap, Database, Monitor, MousePointer, 
  Globe, Check, Eye, Bell
} from 'lucide-react';
import { JobListing } from '@/types/job';
import { API_BASE_URL } from '@/lib/config';
import { useJobsStore } from '@/store/useJobsStore';
import Navbar from '@/components/Navbar';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { useApplicationsStore } from '@/store/useApplicationsStore';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModal } = useAuthModalStore();
  const { addApplicationLocal } = useApplicationsStore();
  const { openModal: openSmartFillModal, isBackgroundExtracting } = useSmartFillModalStore();
  const { isComplete } = useProfileStore();

  const {
    jobs, loading, offset, searchQuery, hasFetched,
    setSearchQuery, setOffset, fetchJobs
  } = useJobsStore();

  const [applyingTo, setApplyingTo] = useState<number | string | null>(null);
  const LIMIT = 20;

  // --- DATA FETCHING (ZUSTAND) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (hasFetched && searchQuery === '') return;
      fetchJobs(LIMIT, true); // Reset to page 0 on new search
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Initial load effect
  useEffect(() => {
    if (!hasFetched) {
      fetchJobs(LIMIT, true);
    }
  }, [hasFetched, fetchJobs]);

  const handleApply = async (e: React.MouseEvent, job: JobListing) => {
    e.stopPropagation();
    if (!session?.user?.email) {
      router.push('/login');
      return;
    }

    setApplyingTo(job.id);

    try {
      // 1. Save application to DB and retrieve URL
      const res = await fetch(`${API_BASE_URL}/apply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: session.user.email,
          job_id: job.id,
          company_name: job.company_raw || "Unknown Company",
          job_title: job.title || "Unknown Position",
          application_status: "applied"
        })
      });

      if (!res.ok) throw new Error("Failed to record application");
      const data = await res.json();

      const targetUrl = data.redirect_url || job.job_url || job.absolute_url;
      const isValidUrl = targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'));

      const trackAndOpen = () => {
        // A. Open external link or alert if missing
        if (isValidUrl) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert("This job does not have an external application link, but we tracked it in your pipeline!");
        }

        // B. Add to local applications pipeline store
        addApplicationLocal({
          id: `temp-${Date.now()}`,
          company: job.company_raw || "Unknown Company",
          role: job.title || "Unknown Position",
          status: "Applied",
          dateApplied: new Date().toISOString().split('T')[0],
          jobUrl: isValidUrl ? targetUrl : ''
        });
      };

      const hasPendingVerification = localStorage.getItem('pending_profile_verification') === 'true';

      // 2. Check if profile is complete, has a pending draft, or is currently extracting in background.
      // If none of these, trigger mandatory Smart Fill.
      if (!isComplete && !hasPendingVerification && !isBackgroundExtracting) {
        openSmartFillModal(() => {
          trackAndOpen();
          router.push('/applications');
        });
      } else {
        // Normal flow
        trackAndOpen();
        router.push('/applications');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to track application. Please check your internet connection.");
    } finally {
      setApplyingTo(null);
    }
  };

  // --- GATEKEEPER ---
  if (status === "loading") return (
    <div className="min-h-screen antialiased relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen antialiased bg-[#fafafa] text-[#0f172a] font-sans flex flex-col pb-16">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="bg-[image:var(--hd-gradient-hero)] text-white relative overflow-hidden py-12 sm:py-16 lg:py-20 w-full">
        {/* Background Dot Overlays */}
        <div className="absolute inset-0 hd-dots-overlay opacity-80 pointer-events-none"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-400/10 rounded-full blur-[100px]" />

        <div className="max-w-4xl mx-auto text-center px-6 relative z-10 space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-[13px] font-semibold text-blue-100 shadow-sm">
            <TrendingUp className="w-4 h-4 text-[#f97316]" />
            42,500+ active openings this week
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.08] text-white">
            Find a job built for <br/>
            <span className="text-[#f97316]">where you're going</span>
          </h1>

          <p className="text-base sm:text-[18px] text-blue-100/80 max-w-xl mx-auto leading-relaxed">
            Curated roles from India's top product companies and global startups. Apply once, track everywhere.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-2 shadow-xl flex flex-col sm:flex-row items-center gap-1.5 max-w-[700px] mx-auto border border-blue-500/20">
            <div className="flex-1 flex items-center pl-4 py-2 w-full text-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Job title, company or keyword" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-sm font-medium placeholder-slate-400" 
              />
            </div>
            
            <div className="hidden sm:block w-[1px] h-6 bg-slate-200 mx-1"></div>
            
            <div className="flex-1 flex items-center pl-4 py-2 w-full text-slate-800">
              <MapPin className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input type="text" placeholder="City or remote" className="bg-transparent outline-none w-full text-sm font-medium placeholder-slate-400" />
            </div>
            
            <button className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-7 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0">
              Search Jobs
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trending labels */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-sm text-blue-200/80">
            <span className="font-semibold text-white">Trending:</span>
            {['React', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps'].map(tag => (
              <span 
                key={tag} 
                onClick={() => setSearchQuery(tag)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors text-white font-medium text-xs shadow-inner"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= AI RESUME BUILDER SECTION ================= */}
      <section className="bg-[#030712] text-white relative overflow-hidden py-20 w-full border-b border-slate-900/60">
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[12px] font-bold text-[#f97316]">
              <Sparkles className="w-3.5 h-3.5" />
              Coming soon
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
                AI Resume Builder
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed font-medium">
                Paste any job description and get a tailored resume in seconds. Our AI rewrites your experience to match what recruiters actually scan for — keywords, impact metrics, and ATS-friendly formatting.
              </p>
            </div>

            {/* Grid checklist (4 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              
              {/* Feature 1 */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Tailored for every role</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Adapts your bullet points to the JD automatically.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">ATS optimized</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Passes Applicant Tracking Systems with clean formatting.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Keyword matched</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Surfaces the right skills and terminology recruiters look for.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Multiple formats</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Export as PDF or save directly to your hiredeck profile.
                </p>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link 
                href="/profile"
                className="px-8 py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold rounded-xl text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 select-none"
              >
                <Sparkles className="w-4 h-4 fill-white/10" />
                Build your profile
              </Link>
              <span className="text-xs text-slate-500 font-bold tracking-wide">
                Be ready when it launches
              </span>
            </div>

          </div>

          {/* Right Column: Interactive Mock Document Frame */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            
            {/* The Document Block */}
            <div className="bg-white text-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl w-full max-w-[390px] border border-slate-200 relative select-none transform hover:-translate-y-1 transition-all duration-300">
              
              {/* Window dots */}
              <div className="flex items-center gap-1.5 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>

              {/* Identity metadata */}
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">Aanya Sharma</h4>
                <p className="text-xs font-semibold text-slate-500">Senior Frontend Engineer · Product</p>
                <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 flex-wrap pt-0.5">
                  <span>aanya@email.com</span>
                  <span>·</span>
                  <span>Bengaluru</span>
                  <span>·</span>
                  <span className="text-blue-500">linkedin.com/in/aanya</span>
                </div>
              </div>

              {/* Document Summary Section */}
              <div className="space-y-2 mt-5">
                <h5 className="text-[10px] font-extrabold text-[#0a4fcd] uppercase tracking-wider">Summary</h5>
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                  <div className="h-2 bg-slate-100 rounded-full w-5/6"></div>
                </div>
              </div>

              {/* Document Experience Section */}
              <div className="space-y-4 mt-6">
                <h5 className="text-[10px] font-extrabold text-[#0a4fcd] uppercase tracking-wider">Experience</h5>
                
                {/* Exp Item 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span>Frontend Lead - Razorpay</span>
                    <span className="text-[10px] font-bold text-slate-400">2023 – Now</span>
                  </div>
                  <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                    <div className="h-1.5 bg-slate-100 rounded-full w-11/12"></div>
                    <div className="h-1.5 bg-slate-100 rounded-full w-4/5"></div>
                  </div>
                </div>

                {/* Exp Item 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span>SDE II - Swiggy</span>
                    <span className="text-[10px] font-bold text-slate-400">2021 – 2023</span>
                  </div>
                  <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                    <div className="h-1.5 bg-slate-100 rounded-full w-10/12"></div>
                    <div className="h-1.5 bg-slate-100 rounded-full w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Document Skills Section */}
              <div className="space-y-2.5 mt-6">
                <h5 className="text-[10px] font-extrabold text-[#0a4fcd] uppercase tracking-wider">Skills Matched</h5>
                <div className="flex flex-wrap gap-1.5">
                  {['React', 'TypeScript', 'Next.js', 'GraphQL', 'Tailwind', 'Testing'].map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-bold text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Overlapping Floating Badge 1: 94% match (Top Right) */}
            <div className="absolute -top-4 right-[2%] w-14 h-14 rounded-full bg-[#f97316] border-4 border-white flex flex-col items-center justify-center text-white shadow-lg animate-bounce-slow">
              <span className="text-xs font-extrabold leading-none">94%</span>
              <span className="text-[7px] font-bold uppercase tracking-wide leading-none mt-0.5">match</span>
            </div>

            {/* Overlapping Floating Badge 2: ATS Ready (Left Side) */}
            <div className="absolute top-1/3 -left-8 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-slate-700 select-none animate-pulse-slow">
              <Zap className="w-3.5 h-3.5 text-[#f97316] fill-orange-500/10" />
              ATS ready
            </div>

            {/* Overlapping Floating Badge 3: AI Tailored (Bottom Right) */}
            <div className="absolute bottom-6 -right-6 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-bold text-slate-700 select-none hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              AI tailored
            </div>

          </div>

        </div>
      </section>

      {/* ================= BROWSE SPECIALIZATIONS ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        <div className="flex items-end justify-between border-b border-[#e2e8f0] pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]/80 mb-2 block">Specializations</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Browse roles by specialization</h2>
            <p className="text-sm text-slate-500 mt-2">Pick a domain, see what's hiring and the average pay.</p>
          </div>
          <Link 
            href="/specializations" 
            className="text-sm font-bold text-[#2563eb] hover:underline flex items-center gap-1 select-none"
          >
            All specializations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Spotlight Hero Card (Spans 2 columns & rows) */}
          <div className="lg:col-span-2 lg:row-span-2 bg-[image:var(--hd-gradient-hero)] rounded-3xl p-8 flex flex-col justify-between text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
            
            <div className="space-y-4">
              <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">Trending</span>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <Code2Icon className="w-6 h-6" />
              </div>
              <h3 className="text-4xl font-bold tracking-tight mt-4">Engineering</h3>
              <p className="text-sm text-blue-100/80 leading-relaxed max-w-xs">
                From frontend to platform — 1,240 live openings across India and remote.
              </p>
            </div>

            <div className="flex items-end justify-between pt-10">
              <div>
                <div className="text-3xl font-extrabold">1,240</div>
                <div className="text-xs uppercase font-bold tracking-wider text-blue-200 mt-1">Open Roles</div>
              </div>
              <button 
                onClick={() => setSearchQuery('Engineering')}
                className="w-12 h-12 bg-white text-[#2563eb] rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform active:scale-95"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories grid block */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Design', count: '320 jobs', icon: Palette, color: 'from-rose-500/15 to-rose-500/5 text-rose-600' },
              { title: 'Data', count: '480 jobs', icon: BarChart3, color: 'from-amber-500/15 to-amber-500/5 text-amber-600' },
              { title: 'Marketing', count: '560 jobs', icon: Megaphone, color: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600' },
              { title: 'Sales', count: '720 jobs', icon: TrendingUp, color: 'from-purple-500/15 to-purple-500/5 text-purple-600' },
              { title: 'Product', count: '290 jobs', icon: Box, color: 'from-cyan-500/15 to-cyan-500/5 text-cyan-600', active: true },
              { title: 'Content', count: '180 jobs', icon: PenTool, color: 'from-indigo-500/15 to-indigo-500/5 text-indigo-600' },
            ].slice(0, 6).map((cat) => {
              const Icon = cat.icon;
              return (
                <div 
                  key={cat.title} 
                  onClick={() => setSearchQuery(cat.title)}
                  className={`group bg-white border rounded-2xl p-5 flex items-center justify-between hover:border-[#2563eb] hover:shadow-md transition-all duration-300 cursor-pointer ${cat.active ? 'border-blue-400 shadow-sm shadow-blue-500/5' : 'border-[#e2e8f0]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center shadow-inner`}>
                      <Icon className={`w-5 h-5 ${cat.color.split(' ').slice(-1)[0]}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">{cat.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.count}</p>
                    </div>
                  </div>
                  <button className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#2563eb] group-hover:text-white transition-colors duration-300 ${cat.active ? 'bg-blue-50 text-[#2563eb]' : 'text-slate-400'}`}>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= JOB FEED SECTION ================= */}
      <section className="bg-[#f8fafc] border-y border-[#e2e8f0] py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]/80 mb-2 block">Featured</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Roles hiring right now</h2>
              <p className="text-sm text-slate-500 mt-2">Hand-picked openings from our active database.</p>
            </div>
            <div className="text-sm font-semibold text-slate-500">
              Showing <span className="text-[#2563eb]">{jobs.length}</span> positions
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 border border-[#e2e8f0] rounded-2xl bg-white">
              <p className="text-slate-400 font-semibold text-sm">No jobs found. Try adjusting your search query.</p>
            </div>
          ) : (
            <>
              {/* Dynamic Job Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, 6).map((job, idx) => (
                  <article 
                    key={job.id}
                    className="bg-white border border-[#e2e8f0] rounded-2xl p-6 hover:shadow-md hover:border-[#2563eb]/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top line */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[18px] bg-blue-50 text-[#2563eb]">
                            {job.company_raw ? job.company_raw.charAt(0).toUpperCase() : 'J'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-[15px]">{job.company_raw || "Confidential"}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-slate-700">4.5</span>
                            </div>
                          </div>
                        </div>
                        {idx === 0 && offset === 0 && (
                          <span className="px-2.5 py-1 bg-[#2563eb]/10 text-[#2563eb] rounded-md text-[9px] font-bold uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-[18px] text-slate-900 leading-tight mb-3 hover:text-[#2563eb] cursor-pointer transition-colors">
                        {job.title}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-60" /> 1-3 years</div>
                        <div className="flex items-center gap-1.5"><WalletIcon className="w-3.5 h-3.5 opacity-60" /> $120k - $160k</div>
                        <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5 opacity-60" /> {job.location || "Remote"}</div>
                      </div>

                      {/* Skills tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {['Design Systems', 'Figma', 'Product'].map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-lg text-xs font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer line */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">2d ago</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#2563eb] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Remote</span>
                        <button 
                          onClick={(e) => handleApply(e, job)}
                          disabled={applyingTo === job.id}
                          className="px-4.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          {applyingTo === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>Apply <ArrowUpRight className="w-3 h-3" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* VIEW ALL JOBS CTA */}
              <div className="flex justify-center items-center mt-12">
                <Link 
                  href="/jobs"
                  className="px-8 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-1.5"
                >
                  View all jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= BROWSER EXTENSION SECTION ================= */}
      <section className="bg-[#0a4fcd] text-white relative overflow-hidden py-24 w-full">
        {/* Dotted background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-70"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-900/40 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Extension Details */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[12px] font-bold text-white shadow-sm">
              <Monitor className="w-3.5 h-3.5" />
              Browser extension
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Track jobs across the web <br className="hidden sm:inline"/>
                with zero clicks
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed font-semibold">
                Our extension automatically detects job postings on LinkedIn, Indeed, Naukri, and company career pages. Every role you view gets saved to your hiredeck tracker instantly — no buttons, no copy-paste.
              </p>
            </div>

            {/* Grid checklist (4 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              
              {/* Feature 1 */}
              <div className="bg-blue-600/30 border border-blue-500/20 p-5 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Eye className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Auto-detect on any site</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed font-semibold">
                  Scans pages in real-time and recognizes job listings instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-blue-600/30 border border-blue-500/20 p-5 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <MousePointer className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Zero-click save</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed font-semibold">
                  Jobs save automatically as you browse. No buttons to press.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-blue-600/30 border border-blue-500/20 p-5 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Works everywhere</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed font-semibold">
                  LinkedIn, Indeed, Naukri, company career pages, and more.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-blue-600/30 border border-blue-500/20 p-5 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-[#f97316]">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-extrabold text-[15px] text-white">Smart reminders</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed font-semibold">
                  Get notified when deadlines approach or follow-ups are due.
                </p>
              </div>

            </div>

            {/* Coming soon button */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-3 border border-white/20 bg-white/10 rounded-xl text-xs font-bold shadow-sm select-none">
                <ChromeIcon className="w-4 h-4 text-orange-400" />
                Coming to Chrome soon
              </span>
            </div>

          </div>

          {/* Right Column: Visual extension page mock */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Main mock browser */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] border border-slate-200 overflow-hidden select-none">
              {/* Browser Header Bar */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-[280px] bg-slate-100 border border-slate-200 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-semibold text-center truncate mx-auto">
                  linkedin.com/jobs/search
                </div>
                <div className="w-14"></div>
              </div>

              {/* Browser Main split grid */}
              <div className="grid grid-cols-[1.5fr_1fr] h-[270px]">
                
                {/* Left Side: Mock LinkedIn Results */}
                <div className="bg-white p-4 space-y-3.5 border-r border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-700">
                    <span>Results · 1,248</span>
                    <div className="w-10 h-2.5 bg-slate-100 rounded-full" />
                  </div>

                  <div className="space-y-2">
                    {/* Row 1 */}
                    <div className="flex items-center justify-between p-2.5 bg-blue-50/40 border border-blue-100/60 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0a4fcd] font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">R</div>
                        <div className="space-y-0.5">
                          <h5 className="text-[9px] font-extrabold text-slate-800 leading-none">Senior Product Manager</h5>
                          <p className="text-[7.5px] text-slate-400 font-semibold">Razorpay · Bengaluru</p>
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center justify-between p-2.5 bg-blue-50/40 border border-blue-100/60 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0a4fcd] font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">S</div>
                        <div className="space-y-0.5">
                          <h5 className="text-[9px] font-extrabold text-slate-800 leading-none">Frontend Lead Engineer</h5>
                          <p className="text-[7.5px] text-slate-400 font-semibold">Swiggy · Bengaluru</p>
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>

                    {/* Row 3 */}
                    <div className="flex items-center justify-between p-2.5 bg-blue-50/40 border border-blue-100/60 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0a4fcd] font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">P</div>
                        <div className="space-y-0.5">
                          <h5 className="text-[9px] font-extrabold text-slate-800 leading-none">Staff Backend Engineer</h5>
                          <p className="text-[7.5px] text-slate-400 font-semibold">PhonePe · Bengaluru</p>
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Mock Extension Panel */}
                <div className="bg-[#0f172a] text-white p-4 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] text-white flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500 flex items-center justify-center text-[7px] text-white font-extrabold">H</div>
                        hiredeck
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5">
                      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Today</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-white">12</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">tracked</span>
                      </div>
                    </div>

                    {/* Live Saving Card */}
                    <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[7px] font-extrabold uppercase">
                        <span className="text-[#f97316] flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-[#f97316]" /> Live</span>
                        <span className="text-slate-400">Auto-saving job</span>
                      </div>
                      <div className="text-[8.5px] font-extrabold text-slate-300">Razorpay · PM</div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#f97316] h-full rounded-full w-2/3 animate-pulse-slow"></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats list */}
                  <div className="space-y-2 border-t border-slate-800 pt-3 text-[8.5px] font-bold">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Applied</span>
                      <span className="text-white">4</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Saved</span>
                      <span className="text-white">8</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Overlapping Floating Badge 1: Works on 40+ sites (Top Right) */}
            <div className="absolute top-4 -right-4 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 text-[9px] font-bold text-slate-700 select-none animate-bounce-slow">
              <Globe className="w-3.5 h-3.5 text-[#0a4fcd]" />
              Works on 40+ sites
            </div>

            {/* Overlapping Floating Badge 2: Job auto-tracked (Bottom Left) */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[9px] font-bold text-slate-800 select-none hover:-translate-y-0.5 transition-transform duration-200">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-800 leading-none">Job auto-tracked</p>
                <p className="text-[7.5px] text-slate-400 leading-none">Razorpay · just now</p>
              </div>
          </div>

        </div>
      </div>
    </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-[#0f172a] rounded-3xl p-8 sm:p-14 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-800 shadow-xl group">
          {/* Blurred Background blobs */}
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-blue-500/25 rounded-full blur-[90px]" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-orange-500/20 rounded-full blur-[90px]" />
          <div className="absolute inset-0 hd-grid-overlay pointer-events-none" />

          <div className="space-y-4 max-w-lg text-center lg:text-left z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-orange-400">
              <Star className="w-3.5 h-3.5 fill-orange-400" />
              Get noticed by recruiters
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Build a profile that does the applying for you
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Add your experience, skills, and projects once. We'll match you with relevant roles and route recruiter outreach to your inbox.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-10">
            <button 
              onClick={() => router.push('/profile')}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 px-8 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Complete your profile
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => router.push('/')}
              className="border border-slate-700 bg-[#0f172a]/55 hover:bg-slate-800/80 text-white font-bold py-4 px-8 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              Browse jobs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Reusable sub-icons to avoid missing imports
function Code2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5" />
      <path d="M3 10V5a2 2 0 0 1 2-2h14" />
      <path d="M3 10v11a2 2 0 0 0 2 2h16v-5h-2" />
      <path d="M21 12H12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h9" />
    </svg>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M12 6h.01M12 10h.01" />
    </svg>
  );
}

function ChromeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}