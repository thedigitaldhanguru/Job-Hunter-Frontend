'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Building2, Calendar, Plus, Briefcase, ChevronDown, Trash2,
  Search, Clock, CheckCircle2, XCircle, UserPlus, Loader2, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthModalStore } from '@/store/useAuthModalStore';

import { API_BASE_URL } from '@/lib/config';
import { useApplicationsStore, Status, Application } from '@/store/useApplicationsStore';

const COLUMNS: { title: string; status: Status; icon: any; color: string; bg: string; dot: string }[] = [
  { title: 'Applied', status: 'Applied', icon: Clock, color: 'text-blue-600', bg: 'bg-white', dot: 'bg-blue-500' },
  { title: 'Interviewing', status: 'Interviewing', icon: UserPlus, color: 'text-purple-600', bg: 'bg-white', dot: 'bg-purple-500' },
  { title: 'Offered', status: 'Offered', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-white', dot: 'bg-emerald-500' },
  { title: 'Rejected', status: 'Rejected', icon: XCircle, color: 'text-slate-500', bg: 'bg-white', dot: 'bg-slate-400' }
];

export default function SandboxApplicationsPage() {
  const { data: session, status: sessionStatus } = useSession(); 
  const { apps, hasFetched, isFetching, error, fetchApplications, updateStatusLocal, deleteApplicationLocal, addApplicationLocal } = useApplicationsStore();
  const { openModal } = useAuthModalStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newApp, setNewApp] = useState<{company: string, role: string, jobUrl: string, status: Status}>({ 
    company: '', 
    role: '', 
    jobUrl: '', 
    status: 'Applied' 
  });

  const getBookmarkletCode = () => {
    const appDomain = typeof window !== 'undefined' ? window.location.origin : '';
    return `javascript:(function(){var t=encodeURIComponent(document.title),u=encodeURIComponent(window.location.href);window.open("${appDomain}/design-sandbox/applications?autoAdd=true&title="+t+"&url="+u,"_blank");})();`;
  };

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

  const handleStatusChange = async (id: string, newStatus: Status) => {
    updateStatusLocal(id, newStatus);
    
    try {
      const tokenResponse = await fetch('/api/auth/token');
      const { token } = await tokenResponse.json();

      await fetch(`${API_BASE_URL}/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        const tokenResponse = await fetch('/api/auth/token');
        const { token } = await tokenResponse.json();

        await fetch(`${API_BASE_URL}/applications/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Failed to delete from DB:", err);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      alert("You must be logged in to add an application.");
      return;
    }
    
    const payload = { 
      user_email: session.user.email,
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

  const filteredApps = apps.filter(app => 
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen antialiased font-sans text-slate-800 pb-20 relative overflow-x-hidden w-full">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-6 mt-10 space-y-10 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[var(--kindling-border)] pb-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[var(--kindling-ink)]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>Pipeline</h1>
            <p className="text-[15px] text-gray-500 mt-2">Manage and track your job hunt progress seamlessly.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="w-[18px] h-[18px] text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search jobs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white border border-[var(--kindling-border)] rounded-full text-[14px] outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all w-full sm:w-64 shadow-sm"
              />
            </div>
            
            {mounted && session?.user && (
              <span dangerouslySetInnerHTML={{
                __html: `
                  <a 
                    href='${getBookmarkletCode()}'
                    onclick="window.alert('⚙️ HOW TO INSTALL:\\n1. Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to show your Bookmarks Bar.\\n2. Drag and drop this button into the bar.\\n\\n🚀 HOW TO USE:\\nWhenever you find a job on LinkedIn, just click the bookmark to instantly save it here!'); return false;"
                    class="bg-white border border-[var(--kindling-border)] text-gray-700 px-4 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 transition-all shadow-sm hover:border-gray-300 cursor-grab shrink-0"
                    title="Drag to Bookmarks!"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    Job Hunter Track
                  </a>
                `
              }} />
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!session?.user} 
              className="bg-[var(--kindling-ink)] hover:bg-black disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-[14px] font-medium flex items-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>

        {/* --- LAYOUT SWITCHER BASED ON APPLICATION STATE --- */}
        {(!mounted || sessionStatus === 'loading') ? (
          <SkeletonBoard />
        ) : !session ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto mt-10">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-900 leading-none">Access Denied</h2>
            <p className="text-slate-500 max-w-sm text-sm">Please sign in to view and track your job application pipeline.</p>
            <button 
              onClick={openModal}
              className="bg-[var(--kindling-ink)] text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-sm mt-2"
            >
              Sign In
            </button>
          </div>
        ) : (isFetching || !hasFetched) ? (
          <SkeletonBoard />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-[1.25rem] flex items-center gap-3 text-sm font-medium max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/> {error}
          </div>
        ) : (
          /* --- KANBAN BOARD --- */
          <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 items-start overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {COLUMNS.map(col => {
              const columnApps = filteredApps.filter(app => app.status === col.status);
              return (
                <div key={col.title} className="flex-none w-[85vw] sm:w-[320px] md:w-auto flex flex-col gap-4 bg-[#f9f9f9]/50 p-2.5 rounded-[1.5rem] border border-[var(--kindling-border)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] snap-center md:snap-align-none">
                  
                  {/* Column Header */}
                  <div className={`flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white border border-[var(--kindling-border)] shadow-sm`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h2 className="font-semibold text-[14px] text-gray-800 tracking-wide uppercase">{col.title}</h2>
                    </div>
                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200`}>
                      {columnApps.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex flex-col gap-3 min-h-[150px] transition-all px-1 pb-1">
                    {columnApps.map(app => (
                      <div key={app.id} className="bg-white border border-[var(--kindling-border)] rounded-[1.25rem] p-4 shadow-sm hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                        
                        {/* Status Accent Bar - Subtler in Kindling design */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 ${col.dot}`} />

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDelete(app.id)}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-gray-50 rounded-full"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start gap-3.5">
                          <div className="w-[36px] h-[36px] bg-[var(--kindling-ink)] text-white rounded-[8px] flex items-center justify-center font-serif text-[18px] pt-1 shrink-0">
                            {app.company ? app.company.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="pr-6 flex-1">
                            <div className="text-[13px] font-medium text-gray-600 leading-tight mb-0.5 truncate max-w-[140px]">{app.company}</div>
                            <h3 className="font-normal text-[1.25rem] leading-[1.1] text-gray-900 mb-2" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                              {app.role}
                            </h3>
                            
                            {/* Job URL Link */}
                            {app.jobUrl && (
                              <a 
                                href={app.jobUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-black border border-gray-200 px-2.5 py-1 rounded-full transition-colors"
                              >
                                <LinkIcon className="w-3 h-3" /> View Posting
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-dotted border-gray-300 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {app.dateApplied || 'Just now'}
                          </div>

                          <div className="relative">
                            <select 
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as Status)}
                              className="appearance-none text-[12px] font-medium bg-[#f9f9f9] border border-[var(--kindling-border)] text-gray-700 rounded-full pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:border-gray-300 transition-all shadow-sm"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Intv</option>
                              <option value="Offered">Offered</option>
                              <option value="Rejected">Reject</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnApps.length === 0 && (
                      <div className="border border-dashed border-gray-300 bg-white/50 rounded-[1.25rem] py-8 flex flex-col items-center justify-center text-center">
                        <span className="text-[12px] font-medium text-gray-400 tracking-wide">Empty pipeline</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md overflow-hidden border border-[var(--kindling-border)] transform transition-all scale-100">
            <div className="p-5 border-b border-[var(--kindling-border)] flex justify-between items-center bg-[#f9f9f9]">
              <h2 className="text-[15px] font-bold text-gray-900">Add New Application</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors p-1.5 hover:bg-gray-200 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Input: Company Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <div className="relative">
                  <Building2 className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Google, Stripe" 
                    value={newApp.company} 
                    onChange={e => setNewApp({...newApp, company: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--kindling-border)] rounded-xl text-[14px] outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm" 
                  />
                </div>
              </div>
              
              {/* Input: Job Title */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Title / Role</label>
                <div className="relative">
                  <Briefcase className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Product Designer" 
                    value={newApp.role} 
                    onChange={e => setNewApp({...newApp, role: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--kindling-border)] rounded-xl text-[14px] outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm" 
                  />
                </div>
              </div>

              {/* Input: Job URL */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job URL</label>
                <div className="relative">
                  <LinkIcon className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newApp.jobUrl} 
                    onChange={e => setNewApp({...newApp, jobUrl: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--kindling-border)] rounded-xl text-[14px] outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm" 
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Pipeline Status</label>
                <div className="relative">
                  <select 
                    value={newApp.status} 
                    onChange={e => setNewApp({...newApp, status: e.target.value as Status})} 
                    className="w-full appearance-none px-4 py-2.5 bg-white border border-[var(--kindling-border)] rounded-xl text-[14px] outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 cursor-pointer shadow-sm pr-10 font-medium text-gray-700"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-5 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-[var(--kindling-border)] text-gray-600 font-medium text-[14px] py-2.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[var(--kindling-ink)] text-white font-medium text-[14px] py-2.5 rounded-full hover:bg-black transition-all shadow-sm"
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
    <div className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 items-start overflow-x-hidden pb-6 -mx-6 px-6 md:mx-0 md:px-0">
      {COLUMNS.map((col) => (
        <div key={col.title} className="flex-none w-[85vw] sm:w-[320px] md:w-auto flex flex-col gap-4 bg-[#f9f9f9]/50 p-2.5 rounded-[1.5rem] border border-[var(--kindling-border)]">
          
          <div className={`flex items-center justify-between p-3.5 rounded-[1.25rem] border border-[var(--kindling-border)] bg-white shadow-sm`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${col.dot} opacity-60 animate-pulse`} />
              <span className="font-semibold text-[14px] text-gray-300 uppercase tracking-wide animate-pulse">{col.title}</span>
            </div>
            <div className="w-6 h-5 bg-gray-100 rounded-full animate-pulse" />
          </div>
          
          {[1, 2].map((cardIndex) => (
            <div key={cardIndex} className="bg-white border border-[var(--kindling-border)] rounded-[1.25rem] p-4 shadow-sm space-y-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${col.dot} opacity-20 animate-pulse`} />
              
              <div className="flex items-start gap-3.5">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-gray-100 animate-pulse shrink-0 border border-[var(--kindling-border)]" />
                <div className="flex-1 space-y-2.5 mt-1">
                  <div className="h-2.5 bg-gray-100 rounded-md w-1/2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded-md w-4/5 animate-pulse" />
                </div>
              </div>
              <div className="pt-4 border-t border-dotted border-gray-200 flex justify-between items-center">
                <div className="w-20 h-3 bg-gray-100 animate-pulse rounded-md" />
                <div className="w-20 h-7 bg-gray-50 border border-[var(--kindling-border)] rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
