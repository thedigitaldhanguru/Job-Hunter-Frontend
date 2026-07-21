'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Briefcase, Phone, Mail, Trash2, FileText, Award,
  TrendingUp, CheckCircle2, User, Calendar, Camera, Check,
  Edit2, Plus, Save, Loader2, XCircle, Share2, UploadCloud,
  ExternalLink, GraduationCap, LayoutGrid, CheckCircle, ArrowRight,
  X, Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { API_BASE_URL } from '@/lib/config';
import { useProfileStore, EMPTY_PROFILE } from '@/store/useProfileStore';
import { uploadToS3 } from '@/lib/s3Helper';

const PROFILE_SECTIONS = [
  { label: 'Identity', id: 'identity', icon: User },
  { label: 'Resume Headline', id: 'summary', icon: FileText },
  { label: 'Key Skills', id: 'skills', icon: Award },
  { label: 'Work History', id: 'employment', icon: Briefcase },
  { label: 'Education', id: 'education', icon: GraduationCap },
  { label: 'Projects', id: 'projects', icon: LayoutGrid }
];

const mapBackendToProfile = (res: any, email: string, sessionName?: string | null, sessionImage?: string | null) => {
  let extended = res.extended_profile;
  while (typeof extended === 'string') {
    try { extended = JSON.parse(extended); } catch { break; }
  }
  if (!extended || typeof extended !== 'object') extended = {};

  return {
    header: {
      name: res.full_name || sessionName || '',
      email: res.email || email,
      degree: res.degree || '',
      university: res.university || '',
      location: res.location || '',
      experience: res.experience || '',
      phone: res.phone || '',
      gender: res.gender || '',
      dob: res.dob || '',
      avatar: res.avatar_url && res.avatar_url !== 'null' ? res.avatar_url : (sessionImage || '')
    },
    summary: res.profile_summary || '',
    resumeName: extended.resumeName || '',
    resumeUrl: extended.resumeUrl || res.resume_url || '',
    employment: Array.isArray(extended.employment) ? extended.employment : [],
    internships: Array.isArray(extended.internships) ? extended.internships : [],
    education: Array.isArray(extended.education) ? extended.education : [],
    skills: Array.isArray(extended.skills) ? extended.skills : [],
    projects: Array.isArray(extended.projects) ? extended.projects : [],
    languages: Array.isArray(extended.languages) ? extended.languages : [],
    academicAchievements: Array.isArray(extended.academicAchievements) ? extended.academicAchievements : [],
    accomplishments: Array.isArray(extended.accomplishments) ? extended.accomplishments : [],
    exams: Array.isArray(extended.exams) ? extended.exams : [],
    preferences: extended.preferences || { jobType: '', availability: '', location: '', currentCTC: '', expectedCTC: '' },
    emailVerified: res.emailVerified || res.email_verified || null
  };
};

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const { profileData, hasFetched, isFetching, fetchProfile, setProfileData } = useProfileStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(EMPTY_PROFILE);
  const [initialData, setInitialData] = useState(EMPTY_PROFILE);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<'avatar' | 'resume' | 'parsing' | null>(null);
  const [activeSection, setActiveSection] = useState('identity');
  const [recruiterVisibility, setRecruiterVisibility] = useState(true);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeVersion, setResumeVersion] = useState(0);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const smartFillInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA FROM ZUSTAND STORE & HANDLE POLLING ---
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const email = session?.user?.email;
    if (!email) {
      setMounted(true);
      return;
    }

    const isPendingVerify = localStorage.getItem('pending_profile_verification') === 'true';

    // 1. Initial fetch (or force refetch if pending verification)
    if (!hasFetched && !isFetching) {
      fetchProfile(email, session?.user?.name, session?.user?.image);
    } else if (isPendingVerify && !isPolling) {
      fetchProfile(email, session?.user?.name, session?.user?.image, true);
    }
  }, [session, sessionStatus, hasFetched, isFetching, fetchProfile, isPolling]);

  // Polling effect for pending verification/parsing
  useEffect(() => {
    if (!isPolling || !session?.user?.email) return;

    const email = session.user.email;
    let attempts = 0;
    const maxAttempts = 10; // Poll for up to 30 seconds

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`${API_BASE_URL}/profile/${email}`);
        if (response.ok) {
          const res = await response.json();
          let extended = res.extended_profile;
          while (typeof extended === 'string') {
            try { extended = JSON.parse(extended); } catch { break; }
          }
          if (!extended || typeof extended !== 'object') extended = {};

          const hasParsedData = (extended.skills && extended.skills.length > 0) ||
            (extended.employment && extended.employment.length > 0) ||
            (extended.projects && extended.projects.length > 0);

          if (hasParsedData || attempts >= maxAttempts) {
            clearInterval(interval);
            setIsPolling(false);
            
            const formatted = mapBackendToProfile(res, email, session?.user?.name, session?.user?.image);
            setData(formatted);
            setInitialData(formatted);
            setProfileData(formatted);
          }
        }
      } catch (err) {
        console.error("Polling error on mount:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, session, setProfileData]);

  // Sync Zustand to local draft
  useEffect(() => {
    if (hasFetched && session?.user?.email) {
      const isPendingVerify = localStorage.getItem('pending_profile_verification') === 'true';
      if (isPendingVerify) {
        setShowVerifyBanner(true);

        // If a local draft exists, load the draft (handles refresh during review)
        const draftKey = `profile_draft_${session.user.email}`;
        const localDraft = localStorage.getItem(draftKey);
        if (localDraft) {
          try {
            const parsedDraft = JSON.parse(localDraft);
            setData(parsedDraft);
            setInitialData(profileData);
          } catch (e) {
            setData(profileData);
            setInitialData(profileData);
          }
        } else {
          // If no draft, load parsed data directly
          setData(profileData);
          setInitialData(profileData);

          // Start polling if we don't have parsed data yet
          const hasParsedData = (profileData.skills && profileData.skills.length > 0) ||
            (profileData.employment && profileData.employment.length > 0) ||
            (profileData.projects && profileData.projects.length > 0);

          if (!hasParsedData && !isPolling) {
            setIsPolling(true);
          }
        }
      } else {
        const draftKey = `profile_draft_${session.user.email}`;
        const localDraft = localStorage.getItem(draftKey);
        if (localDraft) {
          try {
            const parsedDraft = JSON.parse(localDraft);
            setData(parsedDraft);
            setInitialData(profileData);
          } catch (e) {
            setData(profileData);
            setInitialData(profileData);
          }
        } else {
          setData(profileData);
          setInitialData(profileData);
        }
      }
      setMounted(true);
    }
  }, [hasFetched, profileData, session, isPolling]);

  // Local draft auto-saver
  useEffect(() => {
    if (mounted && session?.user?.email && JSON.stringify(data) !== JSON.stringify(initialData)) {
      localStorage.setItem(`profile_draft_${session.user.email}`, JSON.stringify(data));
    }
  }, [data, mounted, session, initialData]);

  // --- SAVE DATA TO DB ---
  const saveProfile = async () => {
    if (!session?.user?.email) {
      alert("You must be logged in to save your profile.");
      return;
    }

    const { name, phone, location } = data.header;
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!phone) missingFields.push("Phone");
    if (!location) missingFields.push("Location");
    if (!data.resumeUrl) missingFields.push("Resume Upload");

    if (missingFields.length > 0) {
      alert(`Please fill out the following required fields to save:\n\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSaving(true);
    setEditMode({});

    const payload = {
      full_name: data.header.name,
      email: data.header.email || session.user.email,
      degree: data.header.degree,
      university: data.header.university,
      location: data.header.location,
      experience: data.header.experience,
      phone: data.header.phone,
      gender: data.header.gender,
      dob: data.header.dob,
      profile_summary: data.summary,
      avatar_url: data.header.avatar,
      current_ctc: data.preferences.currentCTC,
      expected_ctc: data.preferences.expectedCTC,
      extended_profile: {
        employment: data.employment,
        internships: data.internships,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        languages: data.languages,
        academicAchievements: data.academicAchievements,
        accomplishments: data.accomplishments,
        exams: data.exams,
        preferences: data.preferences,
        resumeName: data.resumeName,
        resumeUrl: data.resumeUrl
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        localStorage.removeItem(`profile_draft_${session.user.email}`);
        localStorage.removeItem('pending_profile_verification');
        setShowVerifyBanner(false);
        setInitialData(data);
        setProfileData(data);
        alert("Profile Saved Successfully! 🚀");
      } else {
        alert("Failed to save profile. Check backend logs.");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Completeness Scoring Engine
  const getProfileCompleteness = () => {
    let score = 0;
    const checklist = [
      { label: 'Add profile photo', done: !!data.header.avatar },
      { label: 'Add 10+ key skills', done: data.skills.length >= 10 },
      { label: 'Showcase projects', done: data.projects.length > 0 },
      { label: 'Add preferred locations', done: !!data.preferences.location }
    ];

    if (data.header?.name) score += 30;
    if (data.header?.avatar) score += 20;
    if (data.skills?.length >= 3) score += 20;
    if (data.projects?.length > 0) score += 15;
    if (data.resumeUrl) score += 15;

    return { score, checklist };
  };

  const { score, checklist } = getProfileCompleteness();



  const toggleEdit = (section: string) => setEditMode(prev => ({ ...prev, [section]: !prev[section] }));

  const handleArrayChange = (section: keyof typeof data, id: string, field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [section]: (prev[section] as any[]).map((item: any) => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const handleArrayAdd = (section: keyof typeof data, template: any) => {
    setData((prev: any) => ({ ...prev, [section]: [template, ...(prev[section] as any[])] }));
    setEditMode(prev => ({ ...prev, [section]: true }));
  };

  const handleArrayDelete = (section: keyof typeof data, id: string) => {
    setData((prev: any) => ({ ...prev, [section]: (prev[section] as any[]).filter((item: any) => item.id !== id) }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
      }
      try {
        setUploadingType('avatar');
        const s3FileUrl = await uploadToS3(file);
        setData((prev: any) => ({ ...prev, header: { ...prev.header, avatar: s3FileUrl } }));
      } catch (err) {
        alert("Upload failed.");
      } finally {
        setUploadingType(null);
        if (e.target) {
          e.target.value = '';
        }
      }
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const email = session?.user?.email;
      if (!email) {
        alert("You must be logged in to upload your resume.");
        return;
      }
      try {
        setUploadingType('resume');
        const s3FileUrl = await uploadToS3(file);

        // Update local draft
        setData((prev: any) => ({ ...prev, resumeName: file.name, resumeUrl: s3FileUrl }));
        setResumeVersion(prev => prev + 1);

        // Update database profile with the new resumeUrl (triggers parsing in bg)
        setUploadingType('parsing');
        localStorage.setItem('pending_profile_verification', 'true');
        setIsPolling(true);

        // Now, poll for background parsing results
        let attempts = 0;
        const maxAttempts = 10; // poll for up to 30 seconds
        const interval = setInterval(async () => {
          attempts++;
          try {
            const pollResponse = await fetch(`${API_BASE_URL}/profile/${email}`);
            if (pollResponse.ok) {
              const res = await pollResponse.json();
              // Check if parsing finished (for example, check if skills or projects or employment is populated)
              let extended = res.extended_profile;
              while (typeof extended === 'string') {
                try { extended = JSON.parse(extended); } catch { break; }
              }
              if (!extended || typeof extended !== 'object') extended = {};

              const hasParsedData = (extended.skills && extended.skills.length > 0) ||
                (extended.employment && extended.employment.length > 0) ||
                (extended.projects && extended.projects.length > 0);

              if (hasParsedData || attempts >= maxAttempts) {
                clearInterval(interval);
                setIsPolling(false);

                // Format and load profile data
                const formatted = mapBackendToProfile(res, email, session?.user?.name, session?.user?.image);
                setData(formatted);
                setInitialData(formatted);
                setProfileData(formatted);
                setUploadingType(null);
                setShowVerifyBanner(true);
                alert("Resume parsed successfully! Please verify and save your profile.");
              }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }, 3000);

      } catch (err) {
        alert("Resume upload/parsing failed.");
        setUploadingType(null);
      } finally {
        if (e.target) {
          e.target.value = '';
        }
      }
    }
  };


  const addSimpleItem = (field: 'skills' | 'languages', value: string, setter: (val: string) => void) => {
    const clean = String(value || '').trim();
    if (!clean) return;
    const current = (data[field] || []) as string[];
    if (!current.includes(clean)) {
      setData((prev: any) => ({ ...prev, [field]: [...current, clean] }));
    }
    setter('');
  };

  const handleSimpleArrayRemove = (field: 'skills' | 'languages', val: string) => {
    setData((prev: any) => ({ ...prev, [field]: (prev[field] || []).filter((item: any) => item !== val) }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Dynamic Save Visibility Check
  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(initialData);
  const isEditingAny = Object.values(editMode).some(Boolean);
  const showSaveButton = hasUnsavedChanges || isEditingAny || isSaving;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        {sessionStatus === 'loading' || !mounted ? (
          <div className="flex justify-center items-center py-40">
            <Loader2 className="w-10 h-10 animate-spin text-[#2563eb]" />
          </div>
        ) : !session ? (
          <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Access profile settings</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Please login to build, update, and manage your Hiredeck developer profile.</p>
            <button onClick={() => router.push('/login')} className="px-6 py-2 bg-[#2563eb] text-white rounded-full text-xs font-bold shadow-sm">Login now</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ================= LEFT SIDEBAR (SECTIONS & CONTACT) ================= */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Profile Sections</h3>
                  <nav className="flex flex-col gap-1">
                    {PROFILE_SECTIONS.map(sec => {
                      const SecIcon = sec.icon;
                      const active = activeSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => scrollToSection(sec.id)}
                          className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${active
                            ? 'bg-blue-50/70 text-[#2563eb]'
                            : 'text-slate-500 hover:text-[#2563eb] hover:bg-slate-50'
                            }`}
                        >
                          <SecIcon className="w-4 h-4 shrink-0" />
                          {sec.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Contact</h3>
                  <div className="space-y-3.5 text-xs text-slate-600 font-semibold px-1">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{data.header.email || session?.user?.email || ''}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{data.header.phone || 'Add phone number'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{data.header.location || 'Add location'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* ================= MIDDLE MAIN PANEL ================= */}
            <section className="lg:col-span-6 space-y-6">

              {/* MOBILE DASHBOARD WIDGET (ONLY ON MOBILE/TABLET) */}
              <div className="lg:hidden bg-white border border-[#e2e8f0] rounded-3xl p-5 space-y-4 shadow-sm select-none">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profile Dashboard</span>
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                      Welcome, {data.header.name || "Developer"}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-[#2563eb]">
                    {score}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2563eb] h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }}></div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="font-extrabold text-slate-800">142</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Views</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="font-extrabold text-slate-800">89</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Searches</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="font-extrabold text-emerald-600">Active</div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Visibility</div>
                  </div>
                </div>
              </div>

              {/* VERIFY PROFILE BANNER */}
              {showVerifyBanner && (
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/85 border border-blue-100 rounded-3xl p-5 shadow-sm flex items-start justify-between gap-4 animate-fade-in-up">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-600 shrink-0">
                      {isPolling ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <Sparkles className="w-5 h-5 animate-pulse text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        {isPolling ? 'AI Resume Parsing in Progress...' : 'Verify Profile Details'}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {isPolling 
                          ? 'Our AWS AI engine is currently extracting your experience, skills, and projects. This page will update automatically in a few seconds...'
                          : 'We successfully parsed your resume using AI! Please review the auto-filled details below, make any corrections, and click "Save Profile" to lock them in.'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('pending_profile_verification');
                      setShowVerifyBanner(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 shrink-0 transition-all active:scale-95"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* IDENTITY CARD */}
              <article id="identity" className="bg-white border border-[#e2e8f0] rounded-3xl overflow-hidden shadow-sm relative">
                {/* Banner backdrop */}
                <div className="h-32 bg-[#3b82f6] w-full relative"></div>

                <div className="px-6 pb-6 pt-0 space-y-5">
                  {/* Photo & Actions header container */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between -mt-16 gap-4">
                    {/* Avatar Rounded Square Overlay */}
                    <div className="relative w-28 h-28 bg-white p-1 rounded-[2rem] shadow-md border-4 border-white shrink-0 group">
                      <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-50 flex items-center justify-center relative">
                        {uploadingType === 'avatar' ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
                        ) : data.header.avatar ? (
                          <img
                            src={data.header.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-extrabold text-[#2563eb]">
                            {data.header.name ? data.header.name.substring(0, 2).toUpperCase() : 'BJ'}
                          </span>
                        )}

                        {/* Overlay camera trigger */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Badge badge overlay */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2563eb] border-2 border-white shadow-sm flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-20">
                      <button className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>

                      <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} accept=".pdf,.doc,.docx" className="hidden" />
                      {uploadingType === 'resume' || uploadingType === 'parsing' ? (
                        <button
                          disabled
                          className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-bold text-slate-400 bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563eb]" />
                          {uploadingType === 'resume' ? 'Uploading...' : 'AI Parsing...'}
                        </button>
                      ) : data.resumeUrl ? (
                        <div className="flex items-center">
                          <button
                            onClick={() => setShowResumeModal(true)}
                            className="px-4 py-2 border border-[#e2e8f0] rounded-l-xl border-r-0 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#2563eb]" />
                            View Resume
                          </button>
                          <button
                            onClick={() => resumeInputRef.current?.click()}
                            className="px-3 py-2 border border-[#e2e8f0] rounded-r-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors flex items-center gap-1 shadow-sm"
                            title="Upload updated resume"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            Update Resume
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => resumeInputRef.current?.click()}
                          className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Upload CV
                        </button>
                      )}

                      <button
                        onClick={() => toggleEdit('identity')}
                        className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer select-none"
                      >
                        {editMode.identity ? 'Done' : 'Update Profile'}
                      </button>
                    </div>
                  </div>

                  {/* Identity Edit Fields Toggle */}
                  {editMode.identity ? (
                    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 shadow-inner text-sm font-semibold">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                          <input type="text" value={data.header.name} onChange={e => setData({ ...data, header: { ...data.header, name: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Headline</label>
                          <input type="text" value={data.header.degree} onChange={e => setData({ ...data, header: { ...data.header, degree: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" placeholder="e.g. Full-Stack Web Developer" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Education summary</label>
                          <input type="text" value={data.header.university} onChange={e => setData({ ...data, header: { ...data.header, university: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" placeholder="e.g. BCA - ADTU" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                          <input type="text" value={data.header.location} onChange={e => setData({ ...data, header: { ...data.header, location: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Experience</label>
                          <input type="text" value={data.header.experience} onChange={e => setData({ ...data, header: { ...data.header, experience: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" placeholder="e.g. 3 Years" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Availability Status</label>
                          <input type="text" value={data.preferences.availability} onChange={e => setData({ ...data, preferences: { ...data.preferences, availability: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" placeholder="e.g. Immediate" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                          <input type="text" value={data.header.phone} onChange={e => setData({ ...data, header: { ...data.header, phone: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Employment</label>
                          <input type="text" value={data.preferences.jobType} onChange={e => setData({ ...data, preferences: { ...data.preferences, jobType: e.target.value } })} className="w-full bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl outline-none focus:border-[#2563eb] font-semibold text-slate-800" placeholder="e.g. Self-Employed" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Name and headline */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{data.header.name || "Your Name"}</h2>
                          {data.emailVerified && (
                            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        {data.header.degree && (
                          <p className="text-sm font-semibold text-slate-500">
                            {data.header.degree}
                          </p>
                        )}
                        {data.header.location && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold pt-1">
                            <MapPin className="w-3.5 h-3.5 opacity-70" />
                            <span>{data.header.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Specs grids */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl text-center space-y-0.5 shadow-sm">
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Experience</div>
                          <div className="text-xs font-extrabold text-slate-800 truncate">{data.header.experience || "-"}</div>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl text-center space-y-0.5 shadow-sm">
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current</div>
                          <div className="text-xs font-extrabold text-slate-800 truncate">{data.preferences.jobType || "-"}</div>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl text-center space-y-0.5 shadow-sm">
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Education</div>
                          <div className="text-xs font-extrabold text-slate-800 truncate">{data.header.university || "-"}</div>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl text-center space-y-0.5 shadow-sm">
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Notice</div>
                          <div className="text-xs font-extrabold text-orange-600 truncate">{data.preferences.availability || "-"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </article>

              {/* RESUME HEADLINE SUMMARY CARD */}
              <article id="summary" className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#2563eb] rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Resume Headline</h3>
                  </div>
                  <button
                    onClick={() => toggleEdit('summary')}
                    className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1.5 select-none"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {editMode.summary ? 'Done' : 'Edit'}
                  </button>
                </div>

                {editMode.summary ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-inner">
                    <textarea
                      value={data.summary}
                      onChange={e => setData({ ...data, summary: e.target.value })}
                      className="w-full h-32 bg-white border border-[#e2e8f0] rounded-xl outline-none p-3.5 text-sm font-semibold text-slate-800 focus:border-[#2563eb] resize-none"
                      placeholder="Add a summary headline describing your focus area..."
                    />
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                    {data.summary || ""}
                  </p>
                )}
              </article>

              {/* KEY SKILLS CARD */}
              <article id="skills" className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#2563eb] rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Key Skills</h3>
                  </div>
                  <button
                    onClick={() => toggleEdit('skills')}
                    className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1.5 select-none"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {editMode.skills ? 'Done' : 'Edit'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(data.skills || []).map(skill => (
                    <span
                      key={skill}
                      className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      {skill}
                      {editMode.skills && (
                        <button onClick={() => handleSimpleArrayRemove('skills', skill)} className="text-slate-400 hover:text-red-500 font-bold ml-0.5">&times;</button>
                      )}
                    </span>
                  ))}
                </div>

                {editMode.skills && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-2 mt-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add custom skill</label>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Type a skill (e.g. Next.js)..."
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSimpleItem('skills', newSkill, setNewSkill)}
                        className="flex-grow bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-[#2563eb]"
                      />
                      <button
                        onClick={() => addSimpleItem('skills', newSkill, setNewSkill)}
                        className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </article>

              {/* WORK HISTORY CARD */}
              <article id="employment" className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#2563eb] rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Work History</h3>
                  </div>
                  <button
                    onClick={() => handleArrayAdd('employment', { id: Date.now().toString(), title: '', company: '', duration: '', description: '' })}
                    className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 select-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="space-y-5">
                  {(data.employment || []).map(emp => (
                    <div key={emp.id} className="relative pl-5 border-l-2 border-slate-100 hover:border-blue-300 transition-colors py-1 group">
                      <div className="absolute -left-1.5 top-2.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white group-hover:bg-[#2563eb] transition-colors" />

                      {editMode.employment ? (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Edit Entry</span>
                            <button onClick={() => handleArrayDelete('employment', emp.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Designation" value={emp.title} onChange={e => handleArrayChange('employment', emp.id, 'title', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <input type="text" placeholder="Company Name" value={emp.company} onChange={e => handleArrayChange('employment', emp.id, 'company', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <input type="text" placeholder="Duration (e.g. 2023 - Present)" value={emp.duration} onChange={e => handleArrayChange('employment', emp.id, 'duration', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none col-span-2" />
                            <textarea placeholder="Job description" value={emp.description} onChange={e => handleArrayChange('employment', emp.id, 'description', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none col-span-2 h-20 resize-none" />
                          </div>
                          <button onClick={() => toggleEdit('employment')} className="px-4 py-1.5 bg-[#2563eb] text-white rounded-lg font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-slate-800">{emp.title || 'Add Designation'}</h4>
                            <button onClick={() => toggleEdit('employment')} className="text-[10px] font-bold text-slate-400 hover:text-[#2563eb]">Edit</button>
                          </div>
                          <p className="font-semibold text-xs text-slate-500">{emp.company} · {emp.duration}</p>
                          {emp.description && <p className="text-xs text-slate-500 leading-relaxed pt-1.5 font-medium">{emp.description}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              {/* EDUCATION CARD */}
              <article id="education" className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#2563eb] rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Education</h3>
                  </div>
                  <button
                    onClick={() => handleArrayAdd('education', { id: Date.now().toString(), degree: '', institution: '', details: '' })}
                    className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 select-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="space-y-5">
                  {(data.education || []).map(edu => (
                    <div key={edu.id} className="relative pl-5 border-l-2 border-slate-100 hover:border-blue-300 transition-colors py-1 group">
                      <div className="absolute -left-1.5 top-2.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white group-hover:bg-[#2563eb] transition-colors" />

                      {editMode.education ? (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Edit Education</span>
                            <button onClick={() => handleArrayDelete('education', edu.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Institution Name" value={edu.institution} onChange={e => handleArrayChange('education', edu.id, 'institution', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <input type="text" placeholder="Degree / Certificate" value={edu.degree} onChange={e => handleArrayChange('education', edu.id, 'degree', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <input type="text" placeholder="Year / Grade details" value={edu.details} onChange={e => handleArrayChange('education', edu.id, 'details', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none col-span-2" />
                          </div>
                          <button onClick={() => toggleEdit('education')} className="px-4 py-1.5 bg-[#2563eb] text-white rounded-lg font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-slate-800">{edu.institution || 'Add University'}</h4>
                            <button onClick={() => toggleEdit('education')} className="text-[10px] font-bold text-slate-400 hover:text-[#2563eb]">Edit</button>
                          </div>
                          <p className="font-semibold text-xs text-slate-500">{edu.degree} · {edu.details}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              {/* PROJECTS CARD */}
              <article id="projects" className="bg-white border border-[#e2e8f0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#2563eb] rounded-full"></div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Projects</h3>
                  </div>
                  <button
                    onClick={() => handleArrayAdd('projects', { id: Date.now().toString(), title: '', duration: '', description: '' })}
                    className="text-xs font-bold text-[#2563eb] hover:underline flex items-center gap-1 select-none animate-pulse-slow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add project
                  </button>
                </div>

                <div className="space-y-4">
                  {(data.projects || []).map(proj => (
                    <div key={proj.id} className="border border-slate-100 hover:border-blue-100 rounded-2xl p-5 hover:shadow-sm transition-all space-y-3 bg-slate-50/30 relative group">

                      {editMode.projects ? (
                        <div className="space-y-3 text-xs font-semibold">
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Project details</span>
                            <button onClick={() => handleArrayDelete('projects', proj.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4.5 h-4.5" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Project Name" value={proj.title} onChange={e => handleArrayChange('projects', proj.id, 'title', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <input type="text" placeholder="Duration (e.g. 2025 - Present)" value={proj.duration} onChange={e => handleArrayChange('projects', proj.id, 'duration', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none" />
                            <textarea placeholder="Description" value={proj.description} onChange={e => handleArrayChange('projects', proj.id, 'description', e.target.value)} className="bg-white border border-[#e2e8f0] p-2 rounded-lg font-medium text-slate-800 outline-none col-span-2 h-24 resize-none" />
                          </div>
                          <button onClick={() => toggleEdit('projects')} className="px-4 py-2 bg-[#2563eb] text-white rounded-lg font-bold">Done</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{proj.title || 'Add Project Name'}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400">{proj.duration || '2025 - Present'}</span>
                              <button onClick={() => toggleEdit('projects')} className="text-[10px] font-bold text-slate-400 hover:text-[#2563eb]">Edit</button>
                            </div>
                          </div>
                          {proj.description && <p className="text-xs leading-relaxed text-slate-500 font-semibold">{proj.description}</p>}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </article>

            </section>

            {/* ================= RIGHT PANEL (STRENGTH & STATS) ================= */}
            <section className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">

              {/* Profile Strength Card */}
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4.5 h-4.5 text-[#2563eb]" />
                    Profile Strength
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-[#2563eb] border border-blue-100 rounded-md text-[10px] font-bold">{score}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2563eb] h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }}></div>
                </div>

                {/* Checklist checkboxes */}
                <div className="space-y-2.5">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold">
                      {item.done ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-700'}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scrollToSection(score < 50 ? 'identity' : 'skills')}
                  className="w-full py-2.5 border border-[#2563eb] hover:bg-blue-50 text-[#2563eb] rounded-xl text-center text-xs font-extrabold transition-colors cursor-pointer select-none"
                >
                  Add Missing Details
                </button>
              </div>


            </section>

          </div>
        )}
      </main>

      {/* --- SMART FLOATING SAVE BUTTON --- */}
      {showSaveButton && (
        <button
          onClick={saveProfile}
          disabled={isSaving}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-slow cursor-pointer select-none active:scale-[0.97]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      )}

      {/* --- RESUME VIEWER MODAL --- */}
      {showResumeModal && data.resumeUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transform transition-all scale-100">
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {data.resumeName || 'Resume Document'}
              </h2>
              <div className="flex items-center gap-3">
                {uploadingType === 'resume' || uploadingType === 'parsing' ? (
                  <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    {uploadingType === 'resume' ? 'Uploading...' : 'AI Parsing...'}
                  </span>
                ) : (
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Update Resume
                  </button>
                )}
                <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-600 hover:text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors">
                  Open in new tab
                </a>
                <button onClick={() => setShowResumeModal(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-xl transition-all shadow-sm active:scale-95">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100 relative">
              <iframe
                src={`${data.resumeUrl}${data.resumeUrl.includes('?') ? '&' : '?'}v=${resumeVersion}#toolbar=0`}
                className="absolute inset-0 w-full h-full border-0"
                title="Resume Viewer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
