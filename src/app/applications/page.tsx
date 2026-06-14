'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // <-- 1. Import NextAuth hook
import { 
  Building2, Calendar, Plus, Briefcase, ChevronDown, Trash2,
  Search, Clock, CheckCircle2, XCircle, UserPlus, Loader2, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';

import { API_BASE_URL } from '@/lib/config';
import { useApplicationsStore, Status, Application } from '@/store/useApplicationsStore';

export default function ApplicationsPage() {
  const { data: session, status: sessionStatus } = useSession(); 
  const { apps, hasFetched, isFetching, error, fetchApplications, updateStatusLocal, deleteApplicationLocal, addApplicationLocal } = useApplicationsStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newApp, setNewApp] = useState<{company: string, role: string, jobUrl: string, status: Status}>({ 
    company: '', 
    role: '', 
    jobUrl: '', 
    status: 'Applied' 
  });

  // --- 🔥 BULLETPROOF BOOKMARKLET GENERATOR 🔥 ---
  const getBookmarkletCode = () => {
    const appDomain = typeof window !== 'undefined' ? window.location.origin : '';
    return `javascript:(function(){var t=encodeURIComponent(document.title),u=encodeURIComponent(window.location.href);window.open("${appDomain}/applications?autoAdd=true&title="+t+"&url="+u,"_blank");})();`;
  };

  // --- CATCH BOOKMARKLET REDIRECTS & EXTRACT COMPANY ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoAdd') === 'true') {
        
        const rawTitle = params.get('title') || '';
        let extractedRole = rawTitle;
        let extractedCompany = '';

        if (rawTitle.toLowerCase().includes(' at ')) {
            const parts = rawTitle.split(/ at /i);
            extractedRole = parts[0].trim();
            extractedCompany = parts[1].split('|')[0].split('-')[0].trim();
        } else if (rawTitle.includes('-')) {
            const parts = rawTitle.split('-');
            extractedRole = parts[0].trim();
            extractedCompany = parts[1].split('|')[0].trim();
        }

        extractedRole = extractedRole.replace(' | LinkedIn', '');
        extractedCompany = extractedCompany.replace(' | LinkedIn', '');

        setNewApp(prev => ({
          ...prev,
          role: extractedRole || '',
          company: extractedCompany || '',
          jobUrl: params.get('url') || '',
        }));
        
        setIsModalOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // --- FETCH DATA FROM ZUSTAND ---
  useEffect(() => {
    if (sessionStatus === 'loading') return; 
    
    if (!session?.user?.email) {
      setMounted(true);
      return;
    }

    if (!hasFetched && !isFetching) {
      fetchApplications(session.user.email).then(() => setMounted(true));
    } else {
      setMounted(true);
    }
  }, [session, sessionStatus, hasFetched, isFetching, fetchApplications]);

  // --- ACTIONS ---
  const handleStatusChange = async (id: string, newStatus: Status) => {
    updateStatusLocal(id, newStatus);
    
    try {
      await fetch(`${API_BASE_URL}/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      });
    } catch (err) {
      console.error("Failed to update status in DB:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this application from your tracker?')) {
      deleteApplicationLocal(id);
      
      try {
        await fetch(`${API_BASE_URL}/applications/${id}`, { 
          method: 'DELETE' 
        });
      } catch (err) {
        console.error("Failed to delete from DB:", err);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 7. Security check before submitting
    if (!session?.user?.email) {
      alert("You must be logged in to add an application.");
      return;
    }
    
    const payload = { 
      user_email: session.user.email, // <-- 8. Use the dynamic email here
      job_id: 0, 
      company_name: newApp.company || "Unknown Company",
      job_title: newApp.role || "Unknown Role",
      job_url: newApp.jobUrl || null,
      application_status: newApp.status.toLowerCase() 
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const addedApp: Application = {
          id: data.id ? data.id.toString() : Date.now().toString(),
          company: payload.company_name,
          role: payload.job_title,
          status: newApp.status,
          dateApplied: new Date().toISOString().split('T')[0],
          jobUrl: payload.job_url || ''
        };
        addApplicationLocal(addedApp);
        setIsModalOpen(false);
        setNewApp({ company: '', role: '', jobUrl: '', status: 'Applied' });
      } else {
        alert("Failed to add application. Check backend logs.");
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  // --- FILTERING ---
  const filteredApps = apps.filter(app => 
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: { title: string; status: Status; icon: any; color: string; bg: string; dot: string }[] = [
    { title: 'Applied', status: 'Applied', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50/50 border-blue-100', dot: 'bg-blue-500' },
    { title: 'Interviewing', status: 'Interviewing', icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-50/50 border-purple-100', dot: 'bg-purple-500' },
    { title: 'Offered', status: 'Offered', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100', dot: 'bg-emerald-500' },
    { title: 'Rejected', status: 'Rejected', icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased text-slate-800 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">Application Tracker</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your job hunt progress seamlessly.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search jobs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all w-full sm:w-64 shadow-sm"
              />
            </div>
            
            {/* 🔥 THE MAGIC BOOKMARKLET BUTTON (REACT SECURITY BYPASS) 🔥 */}
            {mounted && session?.user && (
              <span dangerouslySetInnerHTML={{
                __html: `
                  <a 
                    href='${getBookmarkletCode()}'
                    onclick="window.alert('⚙️ HOW TO INSTALL:\\n1. Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to show your Bookmarks Bar.\\n2. Drag and drop this button into the bar.\\n\\n🚀 HOW TO USE:\\nWhenever you find a job on LinkedIn, just click the bookmark to instantly save it here!'); return false;"
                    class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-grab shrink-0"
                    title="Drag to Bookmarks!"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    JOB HUNTER TRACK
                  </a>
                `
              }} />
            )}

            {/* Add Manually Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!session?.user} // Prevent opening if not logged in
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>

        {/* --- LAYOUT SWITCHER BASED ON APPLICATION STATE --- */}
        {(!mounted || sessionStatus === 'loading' || isFetching || !hasFetched) ? (
          <SkeletonBoard />
        ) : error ? (
          <div className="bg-red-50/60 border border-red-200/60 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/> {error}
          </div>
        ) : (
          /* --- KANBAN BOARD --- */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {columns.map(col => {
              const columnApps = filteredApps.filter(app => app.status === col.status);
              return (
                <div key={col.title} className="flex flex-col gap-4 bg-slate-50/40 p-3 rounded-2xl border border-slate-200/50">
                  
                  {/* Column Header */}
                  <div className={`flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm ${col.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      <h2 className="font-bold text-sm text-slate-800">{col.title}</h2>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/40`}>
                      {columnApps.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex flex-col gap-3 min-h-[150px] transition-all">
                    {columnApps.map(app => (
                      <div key={app.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
                        
                        {/* Status Accent Bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${col.dot}`} />

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDelete(app.id)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-slate-50 rounded-lg"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start gap-3 pl-1">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 shadow-sm">
                            {app.company.charAt(0).toUpperCase()}
                          </div>
                          <div className="pr-6">
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-2">{app.role}</h3>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[140px]">{app.company}</span>
                            </div>
                            
                            {/* Job URL Link */}
                            {app.jobUrl && (
                              <a 
                                href={app.jobUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-2 bg-blue-50/50 w-fit px-2 py-0.5 rounded"
                              >
                                <LinkIcon className="w-3 h-3" /> View Posting
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between pl-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {app.dateApplied || 'Just now'}
                          </div>

                          {/* Minimal Custom Selector Wrapper */}
                          <div className="relative">
                            <select 
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as Status)}
                              className="appearance-none text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-2.5 pr-7 py-1 outline-none cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Intv</option>
                              <option value="Offered">Offered</option>
                              <option value="Rejected">Reject</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnApps.length === 0 && (
                      <div className="border border-dashed border-slate-200/80 bg-slate-50/20 rounded-xl py-8 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-semibold text-slate-400 tracking-wide">No applications</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- ADD NEW APPLICATION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[4px] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Add New Application</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="text-xs text-amber-700 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                <strong>Magic Bookmarklet Triggered!</strong> Check your details below and hit save to add this to your tracker.
              </div>

              {/* Input: Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Google, Stripe" 
                    value={newApp.company} 
                    onChange={e => setNewApp({...newApp, company: e.target.value})} 
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                  />
                </div>
              </div>
              
              {/* Input: Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Title / Role</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Full-Stack Developer" 
                    value={newApp.role} 
                    onChange={e => setNewApp({...newApp, role: e.target.value})} 
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                  />
                </div>
              </div>

              {/* Input: Job URL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job URL</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="url" 
                    placeholder="https://linkedin.com/jobs/..." 
                    value={newApp.jobUrl} 
                    onChange={e => setNewApp({...newApp, jobUrl: e.target.value})} 
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Pipeline Status</label>
                <div className="relative">
                  <select 
                    value={newApp.status} 
                    onChange={e => setNewApp({...newApp, status: e.target.value as Status})} 
                    className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 cursor-pointer shadow-sm pr-10 font-medium text-slate-700"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow active:scale-[0.98]"
                >
                  Save Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: SKELETON LOADER ---
function SkeletonBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
      {[1, 2, 3, 4].map((colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4 bg-slate-50/40 p-3 rounded-2xl border border-slate-200/50">
          
          {/* Skeleton Header */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm">
            <div className="w-24 h-4 bg-slate-100 rounded-md animate-pulse" />
            <div className="w-6 h-6 bg-slate-100 rounded-md animate-pulse" />
          </div>
          
          {/* Skeleton Cards */}
          {[1, 2].map((cardIndex) => (
            <div key={cardIndex} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-md w-3/4 animate-pulse" />
                  <div className="h-2.5 bg-slate-100 rounded-md w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="pt-3.5 border-t border-slate-100 flex justify-between items-center">
                <div className="w-16 h-2.5 bg-slate-100 rounded-md animate-pulse" />
                <div className="w-14 h-5 bg-slate-100 rounded-md animate-pulse" />
              </div>
            </div>
          ))}

        </div>
      ))}
    </div>
  );
}