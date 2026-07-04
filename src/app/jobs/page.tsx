'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, MapPin, Star, Clock, Filter, Loader2, ArrowUpRight, 
  ArrowRight, ArrowLeft, Bookmark, Share2, TrendingUp, Sparkles, Briefcase, Wallet, Bell
} from 'lucide-react';
import { JobListing } from '@/types/job';
import { API_BASE_URL } from '@/lib/config';
import { useJobsStore } from '@/store/useJobsStore';
import Navbar from '@/components/Navbar';
import { useApplicationsStore } from '@/store/useApplicationsStore';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';
import { useProfileStore } from '@/store/useProfileStore';
import AdBanner from '@/components/AdBanner';

export default function JobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addApplicationLocal } = useApplicationsStore();
  const { openModal: openSmartFillModal, isBackgroundExtracting } = useSmartFillModalStore();
  const { 
    isComplete, profileData, fetchProfile, hasFetched: profileHasFetched 
  } = useProfileStore();

  const {
    jobs: dbJobs, loading, offset, searchQuery, locationQuery, hasFetched,
    setSearchQuery, setLocationQuery, setOffset, fetchJobs
  } = useJobsStore();

  const [applyingTo, setApplyingTo] = useState<number | string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [sortBy, setSortBy] = useState('Most relevant');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const LIMIT = 20;

  // Load profile details on mount/login
  useEffect(() => {
    if (session?.user?.email && !profileHasFetched) {
      fetchProfile(session.user.email, session.user.name, session.user.image);
    }
  }, [session, profileHasFetched, fetchProfile]);

  // --- DATA FETCHING (ZUSTAND) ---
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetchJobs(LIMIT, true);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, locationQuery]);

  useEffect(() => {
    if (!hasFetched) {
      fetchJobs(LIMIT, true);
    }
  }, [hasFetched, fetchJobs]);

  // Handle Apply Logic
  const handleApply = async (e: React.MouseEvent | React.FormEvent, job: JobListing) => {
    if (e) e.stopPropagation();
    if (!session?.user?.email) {
      router.push('/login');
      return;
    }

    setApplyingTo(job.id);

    try {
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
        if (isValidUrl) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert("This job does not have an external application link, but we tracked it in your pipeline!");
        }

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
      const hasUploadedResume = Boolean(profileData?.resumeUrl);

      if (!isComplete && !hasUploadedResume && !hasPendingVerification && !isBackgroundExtracting) {
        openSmartFillModal(() => {
          trackAndOpen();
          router.push('/applications');
        });
      } else {
        trackAndOpen();
        router.push('/applications');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to track application.");
    } finally {
      setApplyingTo(null);
    }
  };

  const allJobsList = [...dbJobs];

  // Apply filters
  const filteredJobs = allJobsList.filter(job => {
    // Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = job.title?.toLowerCase().includes(query);
      const matchCompany = job.company_raw?.toLowerCase().includes(query);
      const matchLoc = job.location?.toLowerCase().includes(query);
      if (!matchTitle && !matchCompany && !matchLoc) return false;
    }

    // Location Query filter
    if (locationQuery) {
      const loc = locationQuery.toLowerCase();
      if (!job.location?.toLowerCase().includes(loc)) return false;
    }

    const desc = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();

    // Work Mode Filter
    if (selectedWorkMode !== 'All') {
      const isRemote = job.location?.toLowerCase().includes('remote');
      const isHybrid = job.location?.toLowerCase().includes('hybrid');
      if (selectedWorkMode === 'Remote' && !isRemote) return false;
      if (selectedWorkMode === 'Hybrid' && !isHybrid) return false;
      if (selectedWorkMode === 'On-site' && (isRemote || isHybrid)) return false;
    }

    // Job Type Filter
    if (selectedJobType !== 'All') {
      const t = selectedJobType.toLowerCase().replace('-', '');
      if (!desc.includes(t) && !title.includes(t)) return false;
    }

    // Department Filter
    if (selectedDepartment !== 'All') {
      const d = selectedDepartment.toLowerCase();
      if (!desc.includes(d) && !title.includes(d)) return false;
    }

    // Experience Filter
    if (selectedExperience !== 'All') {
      const expString = selectedExperience.replace(' yrs', '');
      if (job.experience_req) {
        if (!job.experience_req.includes(expString)) return false;
      } else {
        if (!desc.includes(expString) && !desc.includes('years experience')) return false;
      }
    }

    return true;
  });

  // Apply Sorting
  if (sortBy === 'Newest first') {
    filteredJobs.sort((a, b) => {
      if (a.posted_time && b.posted_time) {
        return new Date(b.posted_time).getTime() - new Date(a.posted_time).getTime();
      }
      return parseInt(b.id) - parseInt(a.id);
    });
  }

  // Detailed Card Details Mock fields helper
  const getJobExtraInfo = (job: JobListing) => {
    let mode: string | null = null;
    if (job.location) {
      const locLower = job.location.toLowerCase();
      if (locLower.includes('remote')) mode = 'Remote';
      else if (locLower.includes('hybrid')) mode = 'Hybrid';
      else mode = 'On-site';
    }

    return {
      rating: null,
      exp: job.experience_req || null,
      salary: job.salary_range || null,
      skills: job.skills || [],
      mode: mode,
      count: null,
      type: null,
      category: null
    };
  };

  const parseJobDescription = (desc: string, company: string) => {
    if (!desc) {
      return { mainContent: 'No description available.', aboutCompany: null };
    }
    if (!desc.includes('<') && !desc.includes('>')) {
      return { mainContent: desc, aboutCompany: null };
    }
    if (typeof window === 'undefined') {
      return { mainContent: desc, aboutCompany: null };
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(desc, 'text/html');
      let aboutCompany = '';

      const intro = doc.querySelector('.content-intro');
      if (intro) {
        aboutCompany += intro.innerHTML;
        intro.remove();
      }

      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6, strong'));
      const headingMatches = (el: Element, keywords: string[]) => {
        const text = el.textContent?.toLowerCase() || '';
        return keywords.some(k => text.includes(k));
      };

      const extractSiblingContent = (headerEl: Element) => {
        let content = '';
        let sibling = headerEl.nextElementSibling;
        if (!sibling && headerEl.parentElement && headerEl.parentElement.tagName === 'P') {
          sibling = headerEl.parentElement.nextElementSibling;
        }
        while (sibling && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
          const strongText = sibling.querySelector('strong');
          if (strongText && (strongText.textContent?.toLowerCase().includes('about') || strongText.textContent?.toLowerCase().includes('what') || strongText.textContent?.toLowerCase().includes('why') || strongText.textContent?.toLowerCase().includes('responsibilities') || strongText.textContent?.toLowerCase().includes('requirements'))) {
            break;
          }
          content += sibling.outerHTML;
          const next = sibling.nextElementSibling;
          sibling.remove();
          sibling = next;
        }
        headerEl.remove();
        return content;
      };

      headings.forEach(h => {
        if (headingMatches(h, ['about ' + company.toLowerCase(), 'about the company', 'about crunchyroll', 'about our values', 'why you will love working'])) {
          aboutCompany += `<h3>${h.textContent}</h3>` + extractSiblingContent(h);
        }
      });

      const conclusion = doc.querySelector('.content-conclusion');
      if (conclusion) {
        aboutCompany += conclusion.innerHTML;
        conclusion.remove();
      }

      return {
        mainContent: doc.body.innerHTML.trim() || desc,
        aboutCompany: aboutCompany.trim() || null
      };
    } catch (e) {
      return { mainContent: desc, aboutCompany: null };
    }
  };

  const { mainContent, aboutCompany } = selectedJob
    ? parseJobDescription(selectedJob.description || '', selectedJob.company_raw || '')
    : { mainContent: '', aboutCompany: null };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ================= DETAILS VIEW ================= */}
      {selectedJob ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow space-y-6">
          {/* Back button */}
          <div>
            <button 
              onClick={() => setSelectedJob(null)}
              className="text-sm font-bold text-[#2563eb] hover:underline flex items-center gap-1.5 select-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to jobs
            </button>
          </div>

          {/* Job description Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Job Description details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header card info */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563eb] font-bold text-xl flex items-center justify-center shadow-inner shrink-0">
                    {selectedJob.company_raw ? selectedJob.company_raw.charAt(0).toUpperCase() : 'J'}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{selectedJob.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500 font-semibold">
                      <span className="text-slate-800">{selectedJob.company_raw || "Confidential"}</span>
                      {getJobExtraInfo(selectedJob).rating && (
                        <>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span>{getJobExtraInfo(selectedJob).rating}</span>
                          </div>
                          <span>·</span>
                        </>
                      )}
                      {getJobExtraInfo(selectedJob).count && <span>{getJobExtraInfo(selectedJob).count} applicants</span>}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-semibold pt-2">
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 opacity-60" /> {selectedJob.location || "Remote"}</div>
                      {getJobExtraInfo(selectedJob).exp && (
                        <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 opacity-60" /> {getJobExtraInfo(selectedJob).exp} {getJobExtraInfo(selectedJob).type ? `· ${getJobExtraInfo(selectedJob).type}` : ''}</div>
                      )}
                      {getJobExtraInfo(selectedJob).salary && (
                        <div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 opacity-60" /> {getJobExtraInfo(selectedJob).salary}</div>
                      )}
                      <span>·</span>
                      <span>Posted 3d ago</span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={(e) => handleApply(e, selectedJob)}
                    disabled={applyingTo === selectedJob.id}
                    className="px-8 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                  >
                    {applyingTo === selectedJob.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        Apply now
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button className="px-5 py-3.5 border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition-all flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                  <button className="px-5 py-3.5 border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition-all flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* About the role detail card */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-sm sm:text-base">
                <style dangerouslySetInnerHTML={{ __html: `
                  .hd-jd-content ul {
                    list-style-type: disc !important;
                    padding-left: 1.25rem !important;
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                    display: block !important;
                  }
                  .hd-jd-content li {
                    margin-bottom: 0.25rem !important;
                    display: list-item !important;
                  }
                  .hd-jd-content h2, .hd-jd-content h3 {
                    font-size: 1.125rem !important;
                    font-weight: 700 !important;
                    color: #0f172a !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 0.5rem !important;
                  }
                  .hd-jd-content p {
                    margin-bottom: 0.75rem !important;
                    line-height: 1.625 !important;
                  }
                  .hd-jd-content {
                    overflow-wrap: break-word !important;
                    word-wrap: break-word !important;
                  }
                  .hd-jd-content * {
                    max-width: 100% !important;
                  }
                `}} />

                <div className="space-y-3">
                  <div 
                    className="text-slate-600 leading-relaxed space-y-4 hd-jd-content break-words overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: mainContent }}
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Job at a glance cards */}
            <div className="space-y-6">
              
              {/* Job at a glance summary card */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-6 shadow-sm">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-sm uppercase tracking-wider">Job at a glance</h3>
                
                <div className="space-y-4 text-sm font-semibold">
                  {getJobExtraInfo(selectedJob).mode && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Work mode</span>
                      <span className="text-slate-800">{getJobExtraInfo(selectedJob).mode}</span>
                    </div>
                  )}
                  {getJobExtraInfo(selectedJob).exp && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Experience</span>
                      <span className="text-slate-800">{getJobExtraInfo(selectedJob).exp}</span>
                    </div>
                  )}
                  {getJobExtraInfo(selectedJob).type && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Type</span>
                      <span className="text-slate-800">{getJobExtraInfo(selectedJob).type}</span>
                    </div>
                  )}
                  {getJobExtraInfo(selectedJob).count && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Applicants</span>
                      <span className="text-slate-800">{getJobExtraInfo(selectedJob).count}</span>
                    </div>
                  )}
                  {getJobExtraInfo(selectedJob).category && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Category</span>
                      <span className="text-[#2563eb]">{getJobExtraInfo(selectedJob).category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info card */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm text-sm">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">About {selectedJob.company_raw || "Company"}</h3>
                {aboutCompany ? (
                  <div 
                    className="text-slate-500 leading-relaxed space-y-3 hd-jd-content break-words overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: aboutCompany }}
                  />
                ) : (
                  <p className="text-slate-500 leading-relaxed">
                    Explore career opportunities and open roles at {selectedJob.company_raw || "this company"}.
                  </p>
                )}
                <button className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 select-none">
                  See more jobs at {selectedJob.company_raw || "this company"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AdSense Placement - Bottom of Job Details */}
              <AdBanner format="horizontal" className="mt-6" />

            </div>

          </div>
        </main>
      ) : (
        // ================= SEARCH GRID VIEW =================
        <>
          {/* Hero Banner with dots overlay */}
          <section className="bg-[image:var(--hd-gradient-hero)] text-white relative overflow-hidden py-10 w-full">
            <div className="absolute inset-0 hd-dots-overlay opacity-80 pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
              
              {/* Breadcrumb */}
              <div className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>&gt;</span>
                <span className="text-white">All jobs</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Discover your next role</h1>
                  <p className="text-xs sm:text-sm text-blue-100/70 font-semibold">
                    8+ openings · 2 remote · 3 posted in the last 48h
                  </p>
                </div>
                <button className="w-fit bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-inner flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#f97316]" />
                  Create job alert
                </button>
              </div>

              {/* Search Cluster inputs */}
              <div className="bg-white rounded-2xl p-1.5 shadow-xl flex flex-col sm:flex-row items-center gap-1.5 max-w-[760px] border border-blue-500/20 text-slate-800">
                <div className="flex-1 flex items-center pl-4 py-2.5 w-full">
                  <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Job title, skills, or company" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none w-full text-sm font-semibold placeholder-slate-400" 
                  />
                </div>
                
                <div className="hidden sm:block w-[1px] h-6 bg-slate-200 mx-1"></div>
                
                <div className="flex-1 flex items-center pl-4 py-2.5 w-full">
                  <MapPin className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="City, state, or 'Remote'" 
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="bg-transparent outline-none w-full text-sm font-semibold placeholder-slate-400" 
                  />
                </div>
                
                <button 
                  onClick={() => fetchJobs(LIMIT, true)}
                  className="w-full sm:w-auto bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  Search jobs
                </button>
              </div>

              {/* Trending buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-200/80 pt-1">
                <span>Trending:</span>
                {['Remote', 'Full-time', 'Engineering', 'Design', 'Data', '0-1 yrs'].map(tag => (
                  <span 
                    key={tag}
                    onClick={() => setSearchQuery(tag === '0-1 yrs' ? '' : tag)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md cursor-pointer transition-colors shadow-inner"
                  >
                    {tag}
                  </span>
                ))}
              </div>

            </div>
          </section>

          {/* Main Content Grid */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar Filters */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-slate-500" />
                    All filters
                  </h2>
                  <button 
                    onClick={() => { setSelectedExperience('All'); setSelectedWorkMode('All'); setSelectedJobType('All'); setSelectedDepartment('All'); setSearchQuery(''); }}
                    className="text-xs font-semibold text-[#2563eb] hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                {/* Work Mode */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Mode</h3>
                  {['Remote', 'Hybrid', 'On-site'].map(mode => (
                    <label key={mode} className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedWorkMode === mode}
                        onChange={() => setSelectedWorkMode(selectedWorkMode === mode ? 'All' : mode)}
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      {mode}
                      <span className="ml-auto text-xs text-slate-400 font-medium">{mode === 'Remote' ? '2' : '3'}</span>
                    </label>
                  ))}
                </div>

                {/* Job Type */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Type</h3>
                  {['Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedJobType === type}
                        onChange={() => setSelectedJobType(selectedJobType === type ? 'All' : type)}
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      {type}
                    </label>
                  ))}
                </div>

                {/* Department */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</h3>
                  {['Engineering', 'Design', 'Data', 'Marketing'].map((dept) => (
                    <label key={dept} className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedDepartment === dept}
                        onChange={() => setSelectedDepartment(selectedDepartment === dept ? 'All' : dept)}
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      {dept}
                    </label>
                  ))}
                </div>

                {/* Experience Levels */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience</h3>
                  {['3-5 yrs', '5-10 yrs', '10+ yrs'].map((exp) => (
                    <label key={exp} className="flex items-center gap-2 text-sm text-slate-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedExperience === exp}
                        onChange={() => setSelectedExperience(selectedExperience === exp ? 'All' : exp)}
                        className="h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                      />
                      {exp}
                    </label>
                  ))}
                </div>

                {/* AdSense Placement - Sidebar */}
                <div className="pt-2 pb-4">
                  <AdBanner format="rectangle" />
                </div>

                {/* Smart Match Card */}
                <div className="bg-[#f1f5f9]/50 border border-[#e2e8f0] rounded-2xl p-4.5 space-y-3 text-xs">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Sparkles className="w-4 h-4 text-[#f97316]" />
                    Smart match
                  </span>
                  <p className="text-slate-500 leading-relaxed font-semibold">
                    Upload a resume and we'll auto-rank roles by your skills.
                  </p>
                  <button 
                    onClick={() => router.push('/profile')}
                    className="w-full bg-[#0b0f19] hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-center shadow-sm select-none transition-colors"
                  >
                    Upload resume
                  </button>
                </div>

              </div>
            </aside>

            {/* Right Listings Column */}
            <section className="flex-1 space-y-6">
              
              {/* Header result banner */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center shadow-inner">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-[15px]">{filteredJobs.length} jobs found</h2>
                    <p className="text-xs text-slate-500 font-medium">Curated openings across top companies</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span>Sort by</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-slate-700 outline-none bg-white cursor-pointer"
                  >
                    <option>Most relevant</option>
                    <option>Newest first</option>
                  </select>
                </div>
              </div>

              {/* Metrics strip cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#e2e8f0] p-4.5 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 shadow-inner">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Avg. Salary</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-0.5">₹24 LPA</div>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] p-4.5 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 shadow-inner">
                    <Building2Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hiring now</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-0.5">8 cos</div>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] p-4.5 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 shadow-inner">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Easy Apply</div>
                    <div className="text-sm font-extrabold text-slate-800 mt-0.5">6 jobs</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Job Cards List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-[#e2e8f0] rounded-3xl p-5 hover:shadow-md transition-all flex flex-col justify-between animate-pulse">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-slate-200 rounded-xl"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                              <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
                            </div>
                          </div>
                          <div className="w-5 h-5 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <div className="h-6 w-14 bg-slate-200 rounded-lg"></div>
                          <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
                          <div className="h-6 w-12 bg-slate-200 rounded-lg"></div>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                        <div className="flex gap-3 items-center">
                          <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
                          <div className="h-8 w-20 bg-slate-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-3xl shadow-sm">
                  <p className="text-slate-400 font-semibold text-sm">No jobs match your filter criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job, idx) => {
                    const extra = getJobExtraInfo(job);
                    
                    return (
                      <div key={job.id} className="space-y-4">
                        {/* Inject Ad Banner every 5 jobs */}
                        {idx > 0 && idx % 5 === 0 && (
                          <AdBanner format="horizontal" className="mb-4" />
                        )}
                        {/* Inject Pro Tip Banner after 2nd job card */}
                        {idx === 2 && (
                          <div className="bg-gradient-to-r from-[#0a4fcd] to-[#051949] rounded-3xl p-6 text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900/50 shadow-md">
                            <div className="absolute inset-0 hd-grid-overlay opacity-20 pointer-events-none" />
                            <div className="space-y-2 z-10 text-center sm:text-left">
                              <span className="px-2.5 py-0.5 bg-white/10 ring-1 ring-white/20 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                Pro Tip
                              </span>
                              <h3 className="font-extrabold text-lg sm:text-xl leading-snug">Get matched to jobs automatically</h3>
                              <p className="text-xs text-blue-200/90 leading-relaxed font-semibold">
                                Complete your profile so recruiters reach out to you first.
                              </p>
                            </div>
                            <button 
                              onClick={() => router.push('/profile')}
                              className="px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] shrink-0 z-10"
                            >
                              Build profile
                            </button>
                          </div>
                        )}

                        {/* Job Card */}
                        <article 
                          onClick={() => setSelectedJob(job)}
                          className="bg-white border border-[#e2e8f0] rounded-3xl p-5 hover:shadow-md hover:border-[#2563eb]/20 transition-all flex flex-col justify-between cursor-pointer group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 bg-blue-50 text-[#2563eb] rounded-xl font-bold flex items-center justify-center text-lg shadow-inner">
                                  {job.company_raw ? job.company_raw.charAt(0).toUpperCase() : 'J'}
                                </div>
                                <div>
                                  <h3 className="font-extrabold text-slate-800 text-[15px] group-hover:text-[#2563eb] transition-colors">
                                    {job.title}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                    <span className="font-semibold text-slate-700">{job.company_raw || "Confidential"}</span>
                                    {extra.rating && (
                                      <>
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        <span className="font-bold text-slate-600">{extra.rating}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                                <Bookmark className="w-4.5 h-4.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400 font-semibold">
                              {extra.exp && <div className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 opacity-60" /> {extra.exp}</div>}
                              {extra.salary && <div className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5 opacity-60" /> {extra.salary}</div>}
                              {job.location && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 opacity-60" /> {job.location}</div>}
                            </div>

                            {/* Skills Tags */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {extra.skills.map(skill => (
                                <span key={skill} className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-lg text-xs font-semibold">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 opacity-60" /> {job.posted_time || 'Just now'}</span>
                            <div className="flex items-center gap-3">
                              {extra.mode && <span className="text-[10px] font-bold text-[#2563eb] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase">{extra.mode}</span>}
                              <button 
                                onClick={(e) => handleApply(e, job)}
                                disabled={applyingTo === job.id}
                                className="px-4.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-bold shadow-sm transition-all flex items-center gap-1 disabled:opacity-50 active:scale-[0.98]"
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
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Slicing / Pagination footer results */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 shadow-sm flex items-center justify-between text-xs text-slate-400 font-semibold flex-wrap gap-4 mt-8">
                <span>Showing {dbJobs.length > 0 ? (offset + 1) : 0}–{offset + dbJobs.length} results</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const prevOffset = Math.max(0, offset - LIMIT);
                      setOffset(prevOffset);
                      fetchJobs(LIMIT, false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={offset === 0 || loading}
                    className="px-3.5 py-2 border border-[#e2e8f0] rounded-xl hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed font-bold"
                  >
                    Previous
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#0a4fcd] text-white flex items-center justify-center font-bold">
                    {Math.floor(offset / LIMIT) + 1}
                  </button>
                  <button 
                    onClick={() => {
                      const nextOffset = offset + LIMIT;
                      setOffset(nextOffset);
                      fetchJobs(LIMIT, false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={dbJobs.length < LIMIT || loading}
                    className="px-3.5 py-2 border border-[#e2e8f0] rounded-xl hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>

            </section>

          </main>
        </>
      )}
    </div>
  );
}

// Sub-icons
function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
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

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
