'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Calendar, Plus, Briefcase, ChevronDown, Trash2,
  Search, Clock, CheckCircle2, XCircle, UserPlus, Loader2, AlertCircle, 
  Link as LinkIcon, ExternalLink, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthModalStore } from '@/store/useAuthModalStore';

import { API_BASE_URL } from '@/lib/config';
import { useApplicationsStore, Status, Application } from '@/store/useApplicationsStore';

export default function ApplicationsPage() {
  const { data: session, status: sessionStatus } = useSession(); 
  const { 
    apps, hasFetched, isFetching, error, 
    fetchApplications, updateStatusLocal, deleteApplicationLocal, addApplicationLocal 
  } = useApplicationsStore();
  const { openModal } = useAuthModalStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | Status>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newApp, setNewApp] = useState<{company: string, role: string, jobUrl: string, status: Status}>({ 
    company: '', 
    role: '', 
    jobUrl: '', 
    status: 'Applied' 
  });

  const getBookmarkletCode = () => {
    const appDomain = typeof window !== 'undefined' ? window.location.origin : '';
    return `javascript:(function(){var t=encodeURIComponent(document.title),u=encodeURIComponent(window.location.href);window.open("${appDomain}/applications?autoAdd=true&title="+t+"&url="+u,"_blank");})();`;
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

  const handleNextStepChange = async (id: string, newNextStep: string) => {
    // Update local state dynamically
    useApplicationsStore.setState((state) => ({
      apps: state.apps.map(app => app.id === id ? { ...app, nextStep: newNextStep } : app)
    }));

    try {
      const tokenResponse = await fetch('/api/auth/token');
      const { token } = await tokenResponse.json();

      await fetch(`${API_BASE_URL}/applications/${id}/next_step`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ next_step: newNextStep })
      });
    } catch (err) {
      console.error("Failed to update next step in DB:", err);
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
          jobUrl: payload.job_url || '',
          location: 'Remote',
          nextStep: ''
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

  // 1. Calculate dynamic status counts
  const totalAppsCount = apps.length;
  const activeAppsCount = apps.filter(app => app.status !== 'Rejected').length;
  const appliedCount = apps.filter(app => app.status === 'Applied').length;
  const shortlistedCount = apps.filter(app => app.status === 'Shortlisted').length;
  const interviewCount = apps.filter(app => app.status === 'Interview').length;
  const offerCount = apps.filter(app => app.status === 'Offer').length;
  const rejectedCount = apps.filter(app => app.status === 'Rejected').length;

  // 2. Client-side Search and Status Tab Filters
  const filteredApps = apps.filter(app => {
    // Search filter
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status Tab filter
    if (selectedStatusTab !== 'ALL' && app.status !== selectedStatusTab) {
      return false;
    }

    return true;
  });

  const getStatusColorClasses = (status: Status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Shortlisted': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Interview': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Offer': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2">
          <div className="space-y-2.5">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              Application Tracker
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Your job pipeline
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[480px]">
              Track every role you applied to, monitor responses, and never lose context across interviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/jobs')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              Find more jobs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* --- STATUS OVERVIEW CARDS (GRID) --- */}
        {mounted && session?.user && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* ALL */}
            <button 
              onClick={() => setSelectedStatusTab('ALL')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'ALL' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">ALL</span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {activeAppsCount} active
                </span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{totalAppsCount}</h2>
            </button>

            {/* APPLIED */}
            <button 
              onClick={() => setSelectedStatusTab('Applied')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'Applied' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">APPLIED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{appliedCount}</h2>
            </button>

            {/* SHORTLISTED */}
            <button 
              onClick={() => setSelectedStatusTab('Shortlisted')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'Shortlisted' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">SHORTLISTED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{shortlistedCount}</h2>
            </button>

            {/* INTERVIEW */}
            <button 
              onClick={() => setSelectedStatusTab('Interview')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'Interview' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">INTERVIEW</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{interviewCount}</h2>
            </button>

            {/* OFFER */}
            <button 
              onClick={() => setSelectedStatusTab('Offer')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'Offer' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">OFFER</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{offerCount}</h2>
            </button>

            {/* REJECTED */}
            <button 
              onClick={() => setSelectedStatusTab('Rejected')}
              className={`bg-white border rounded-[1.5rem] p-5 text-left transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${selectedStatusTab === 'Rejected' ? 'border-blue-600 ring-2 ring-blue-500/10 shadow-md' : 'border-[#e2e8f0]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">REJECTED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mt-4 leading-none">{rejectedCount}</h2>
            </button>

          </div>
        )}

        {/* --- MAIN DATA CONTAINER (TABLE / LIST) --- */}
        {(!mounted || sessionStatus === 'loading') ? (
          <SkeletonTable />
        ) : !session ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto mt-10">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold text-slate-900 leading-none">Access Denied</h2>
            <p className="text-slate-500 max-w-sm text-sm">Please sign in to view and track your job application pipeline.</p>
            <button 
              onClick={openModal}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm mt-2"
            >
              Sign In
            </button>
          </div>
        ) : (isFetching || !hasFetched) ? (
          <SkeletonTable />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-[1.25rem] flex items-center gap-3 text-sm font-medium max-w-2xl mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/> {error}
          </div>
        ) : (
          /* --- PIPELINE TABLE CONTAINER --- */
          <div className="bg-white border border-[#e2e8f0] rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
            
            {/* Table Search & Tool Bar */}
            <div className="p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search role, company, location..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-full text-xs font-semibold outline-none focus:border-blue-500 transition-all w-full shadow-inner placeholder-slate-400 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-extrabold text-slate-400 shrink-0">
                <span>{filteredApps.length} results</span>
                
                {/* Manual Trigger */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Manually
                </button>
              </div>
            </div>

            {/* Responsive Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-[#e2e8f0] text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    <th className="py-4 px-6">Role & Company</th>
                    <th className="py-4 px-6 text-center">Applied</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Next Step</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/40 transition-colors group">
                      
                      {/* 1. ROLE & COMPANY */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3.5">
                          {/* Monogram Box */}
                          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-serif text-[15px] pt-0.5 shrink-0 select-none shadow-sm">
                            {app.company ? app.company.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-[14px] leading-snug">{app.role}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">{app.company} · {app.location || 'Remote'}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. DATE APPLIED */}
                      <td className="py-4.5 px-6 text-center text-slate-500 text-xs">
                        <div className="inline-flex items-center gap-1.5 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {app.dateApplied || 'Just now'}
                        </div>
                      </td>

                      {/* 3. STATUS BADGE + SELECTOR */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getStatusColorClasses(app.status)}`}>
                            {app.status}
                          </span>

                          <div className="relative">
                            <select 
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as Status)}
                              className="appearance-none text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg pl-2.5 pr-7 py-1 outline-none cursor-pointer hover:border-slate-300 transition-all select-none"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview">Interview</option>
                              <option value="Offer">Offer</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </td>

                      {/* 4. NEXT STEP (AUTO-SAVING INLINE INPUT) */}
                      <td className="py-4.5 px-6">
                        <input 
                          type="text" 
                          value={app.nextStep || ''} 
                          onChange={(e) => handleNextStepChange(app.id, e.target.value)}
                          placeholder="—"
                          className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white px-2 py-1 rounded text-xs w-full transition-all outline-none text-slate-700 font-bold"
                        />
                      </td>

                      {/* 5. ACTIONS */}
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          {app.jobUrl ? (
                            <a 
                              href={app.jobUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                            >
                              View <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300 font-bold select-none">—</span>
                          )}

                          <button 
                            onClick={() => handleDelete(app.id)}
                            className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400">
                        <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-[14px] font-extrabold text-slate-700 leading-none">No applications found</h3>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">Try modifying your filters or search query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {filteredApps.map(app => (
                <div key={app.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-serif text-base pt-0.5 shrink-0 shadow-sm select-none">
                        {app.company ? app.company.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{app.role}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{app.company} · {app.location || 'Remote'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(app.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied Date</span>
                      <div className="text-xs text-slate-600 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {app.dateApplied || 'Just now'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getStatusColorClasses(app.status)}`}>
                          {app.status}
                        </span>
                        <div className="relative">
                          <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as Status)}
                            className="appearance-none text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-lg pl-2 pr-5 py-0.5 outline-none cursor-pointer"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Step</span>
                    <input 
                      type="text" 
                      value={app.nextStep || ''} 
                      onChange={(e) => handleNextStepChange(app.id, e.target.value)}
                      placeholder="e.g. Prepare for technical round..."
                      className="w-full bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder-slate-300"
                    />
                  </div>

                  {app.jobUrl && (
                    <div className="pt-2">
                      <a 
                        href={app.jobUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full justify-center bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-blue-600 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-center"
                      >
                        View Job Posting <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredApps.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="text-[14px] font-extrabold text-slate-700 leading-none">No applications found</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Try modifying your filters or search query.</p>
                </div>
              )}
            </div>

            {/* Table Footer Bookmarklet Help */}
            {mounted && session?.user && (
              <div className="bg-slate-50/50 p-5 border-t border-[#e2e8f0] hidden md:flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
                <p className="max-w-2xl leading-relaxed text-center md:text-left text-slate-400">
                  💡 Install the tracker bookmarklet! Drag the <strong className="text-slate-600">Job Hunter Track</strong> link in the header block to your browser bookmarks bar to instantly save job postings.
                </p>
                <div dangerouslySetInnerHTML={{
                  __html: `
                    <a 
                      href='${getBookmarkletCode()}'
                      onclick="window.alert('⚙️ HOW TO INSTALL:\\n1. Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to show your Bookmarks Bar.\\n2. Drag and drop this button into the bar.\\n\\n🚀 HOW TO USE:\\nWhenever you find a job on LinkedIn, just click the bookmark to instantly save it here!'); return false;"
                      class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-grab shrink-0 select-none shadow-sm"
                      title="Drag to Bookmarks!"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                      Job Hunter Track
                    </a>
                  `
                }} />
              </div>
            )}

          </div>
        )}
      </main>

      {/* --- ADD NEW APPLICATION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-md overflow-hidden border border-slate-200 transform transition-all scale-100 animate-fade-in-up">
            <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[14px] font-extrabold text-slate-900 uppercase tracking-wider">Add New Application</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Input: Company Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
                <div className="relative">
                  <Building2 className="w-[18px] h-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Google, Stripe" 
                    value={newApp.company} 
                    onChange={e => setNewApp({...newApp, company: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all shadow-inner text-slate-800" 
                  />
                </div>
              </div>
              
              {/* Input: Job Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job Title / Role</label>
                <div className="relative">
                  <Briefcase className="w-[18px] h-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Product Designer" 
                    value={newApp.role} 
                    onChange={e => setNewApp({...newApp, role: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all shadow-inner text-slate-800" 
                  />
                </div>
              </div>

              {/* Input: Job URL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Job URL</label>
                <div className="relative">
                  <LinkIcon className="w-[18px] h-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newApp.jobUrl} 
                    onChange={e => setNewApp({...newApp, jobUrl: e.target.value})} 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all shadow-inner text-slate-800" 
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Pipeline Status</label>
                <div className="relative">
                  <select 
                    value={newApp.status} 
                    onChange={e => setNewApp({...newApp, status: e.target.value as Status})} 
                    className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold outline-none focus:border-blue-500 cursor-pointer shadow-sm pr-10 text-slate-700"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interviewing</option>
                    <option value="Offer">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-5 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-full hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-full transition-all shadow-sm active:scale-95"
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
function SkeletonTable() {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4 shadow-sm animate-pulse">
      <div className="h-10 bg-slate-100 rounded-full w-full mb-6" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5 w-1/3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-slate-100 rounded-md w-4/5" />
              <div className="h-2.5 bg-slate-100 rounded-md w-1/2" />
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-md w-20" />
          <div className="h-7 bg-slate-100 rounded-full w-24" />
          <div className="h-3 bg-slate-100 rounded-md w-32" />
          <div className="h-8 bg-slate-100 rounded-lg w-16" />
        </div>
      ))}
    </div>
  );
}
