'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react'; // <-- 1. Import NextAuth
import { 
  MapPin, Briefcase, Phone, Mail, 
  Trash2, FileText, Award, TrendingUp, CheckCircle2, User, Calendar, Camera, Check, Edit2, Plus, Save, Loader2, XCircle, Menu
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { API_BASE_URL } from '@/lib/config';
import { useProfileStore, EMPTY_PROFILE } from '@/store/useProfileStore';

const QUICK_LINKS = [
  { label: 'Profile summary', id: 'summary' },
  { label: 'Resume', id: 'resume' },
  { label: 'Employment', id: 'employment' },
  { label: 'Internships', id: 'internships' },
  { label: 'Education', id: 'education' },
  { label: 'Key skills', id: 'skills' },
  { label: 'Projects', id: 'projects' },
  { label: 'Languages', id: 'languages' },
  { label: 'Academic achievements', id: 'academic' },
  { label: 'Accomplishments', id: 'accomplishments' },
  { label: 'Competitive exams', id: 'exams' },
  { label: 'Preferences', id: 'preferences' },
];

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const { profileData, hasFetched, isFetching, fetchProfile, setProfileData } = useProfileStore();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(EMPTY_PROFILE);
  const [initialData, setInitialData] = useState(EMPTY_PROFILE); 
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<'avatar' | 'resume' | null>(null);
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null); 

  // --- 1. FETCH DATA FROM ZUSTAND STORE ---
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    const email = session?.user?.email;
    if (!email) {
      setMounted(true);
      return;
    }

    if (!hasFetched && !isFetching) {
      fetchProfile(email, session?.user?.name, session?.user?.image);
    }
  }, [session, sessionStatus, hasFetched, isFetching, fetchProfile]);

  // Sync Zustand to local draft
  useEffect(() => {
    if (hasFetched && session?.user?.email) {
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
      setMounted(true);
    }
  }, [hasFetched, profileData, session]);

  // --- LOCAL DRAFT SAVER ---
  useEffect(() => {
    if (mounted && session?.user?.email && data !== initialData) {
      localStorage.setItem(`profile_draft_${session.user.email}`, JSON.stringify(data));
    }
  }, [data, mounted, session, initialData]);

  // --- 2. SAVE DATA TO FASTAPI ---
  const saveProfile = async () => {
    // <-- 4. Guard against saving if not logged in
    if (!session?.user?.email) {
      alert("You must be logged in to save your profile.");
      return;
    }

    // --- STRICT VALIDATION ---
    const { name, phone, location, degree, university } = data.header;
    const { currentCTC, expectedCTC } = data.preferences;
    
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!phone) missingFields.push("Phone");
    if (!location) missingFields.push("Location");
    if (!degree) missingFields.push("Degree");
    if (!university) missingFields.push("University");
    if (!currentCTC) missingFields.push("Current CTC");
    if (!expectedCTC) missingFields.push("Expected CTC");
    if (!data.resumeUrl) missingFields.push("Resume Upload");

    if (missingFields.length > 0) {
      alert(`Cannot save profile. Please fill out the following required fields:\n\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSaving(true);
    setEditMode({});

    const userEmail = session.user.email; 

    const payload = {
      full_name: data.header.name,
      email: data.header.email || userEmail, 
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
        localStorage.removeItem(`profile_draft_${userEmail}`);
        setInitialData(data); 
        setProfileData(data); // Sync Zustand to the backend state
        alert("Profile Saved Successfully! 🚀");
      } else {
        alert("Failed to save profile. Check backend logs.");
      }
    } catch (error) {
      console.error("Network error saving profile:", error);
      alert("Network Error: Could not reach the server.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- SAVE BUTTON VISIBILITY LOGIC ---
  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(initialData);
  const isEditingAny = Object.values(editMode).some(Boolean);
  const showSaveButton = hasUnsavedChanges || isEditingAny || isSaving;

  // --- DYNAMIC SCORING ENGINE ---
  const getProfileCompleteness = () => {
    let score = 0;
    const missing = [];

    if (data.header?.name && data.header?.email) score += 20; 
    else missing.push({ label: 'Basic Details', boost: 20, icon: User });
    
    if (data.summary) score += 10; 
    else missing.push({ label: 'Profile Summary', boost: 10, icon: FileText });
    
    if (data.resumeName) score += 10; 
    else missing.push({ label: 'Resume', boost: 10, icon: FileText });
    
    if (data.education?.length > 0) score += 10; 
    else missing.push({ label: 'Education', boost: 10, icon: Award });
    
    if (data.skills?.length >= 3) score += 10; 
    else missing.push({ label: 'Key Skills', boost: 10, icon: TrendingUp });
    
    if (data.employment?.length > 0) score += 10; 
    else missing.push({ label: 'Employment', boost: 10, icon: Briefcase });
    
    if (data.projects?.length > 0) score += 10; 
    else missing.push({ label: 'Projects', boost: 10, icon: FileText });
    
    if (data.languages?.length > 0) score += 5; 
    else missing.push({ label: 'Languages', boost: 5, icon: FileText });
    
    if (data.internships?.length > 0) score += 5; 
    else missing.push({ label: 'Internship', boost: 5, icon: TrendingUp });
    
    if (data.exams?.length > 0) score += 5; 
    else missing.push({ label: 'Competitive exams', boost: 5, icon: Award });
    
    if (data.accomplishments?.length > 0 || data.academicAchievements?.length > 0) score += 5; 
    else missing.push({ label: 'Accomplishments', boost: 5, icon: Award });

    return { score, missing: missing.slice(0, 3) };
  };

  const { score, missing } = getProfileCompleteness();

  // --- ACTIONS ---
  const toggleEdit = (section: string) => setEditMode(prev => ({ ...prev, [section]: !prev[section] }));

  const handleArrayChange = (section: keyof typeof data, id: string, field: string, value: string) => {
    setData(prev => ({ ...prev, [section]: (prev[section] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const handleArrayAdd = (section: keyof typeof data, template: any) => {
    setData(prev => ({ ...prev, [section]: [template, ...(prev[section] as any[])] }));
    setEditMode(prev => ({ ...prev, [section]: true })); 
  };

  const handleArrayDelete = (section: keyof typeof data, id: string) => {
    setData(prev => ({ ...prev, [section]: (prev[section] as any[]).filter(item => item.id !== id) }));
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    try {
      const urlResponse = await fetch(`${API_BASE_URL}/uploads/presigned-url?file_name=${encodeURIComponent(file.name)}&file_type=${encodeURIComponent(file.type)}`);
      if (!urlResponse.ok) throw new Error("Failed to get AWS secure upload URL");
      
      const { upload_url, file_url } = await urlResponse.json();

      const s3Response = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      if (!s3Response.ok) throw new Error("Failed to upload file to S3");
      return file_url;
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw error;
    }
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
        setData(prev => ({ ...prev, header: { ...prev.header, avatar: s3FileUrl } }));
      } catch (err) {
        alert("An error occurred while uploading your profile picture. Please try again.");
      } finally {
        setUploadingType(null);
      }
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Please upload a resume smaller than 10MB.");
        return;
      }
      try {
        setUploadingType('resume');
        const s3FileUrl = await uploadToS3(file);
        setData(prev => ({ ...prev, resumeName: file.name, resumeUrl: s3FileUrl }));
      } catch (err) {
        alert("An error occurred while uploading your resume. Please try again.");
      } finally {
        setUploadingType(null);
      }
    }
  };

  const addSimpleItem = (field: 'skills' | 'languages', value: string, setter: (val: string) => void) => {
    const cleanValue = String(value || '').trim();
    if (!cleanValue) return; 
    
    const currentArray = (data[field] || []) as string[];
    
    if (!currentArray.includes(cleanValue)) {
      setData(prev => ({ ...prev, [field]: [...currentArray, cleanValue] }));
    }
    setter(''); 
  };

  const handleSimpleArrayRemove = (field: 'skills' | 'languages', valueToRemove: string) => {
    setData(prev => ({ ...prev, [field]: (prev[field] || []).filter(item => item !== valueToRemove) }));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- REUSABLE ARRAY SECTION COMPONENT ---
  const renderArraySection = (
    id: string, title: string, dataKey: keyof typeof data, template: any, emptySubtitle: string,
    fields: { key: string, label: string, placeholder: string, type: 'input' | 'textarea' }[]
  ) => {
    const items = (data[dataKey] || []) as any[];
    
    return (
      <div id={id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {items.length === 0 && !editMode[id] && (
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{emptySubtitle}</p>
            )}
          </div>
          
          <div className="flex gap-4">
            {items.length > 0 && !editMode[id] && (
              <button onClick={() => toggleEdit(id)} className="text-slate-500 hover:text-blue-600 font-semibold text-sm transition-colors">Edit</button>
            )}
            {!editMode[id] && (
              <button onClick={() => handleArrayAdd(dataKey, template)} className="text-blue-600 font-semibold text-sm hover:underline">Add</button>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="relative group transition-all duration-300">
              {editMode[id] ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-inner transition-all duration-300 ease-in-out">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Enter Details</h3>
                    <button onClick={() => handleArrayDelete(dataKey, item.id)} className="text-slate-400 hover:text-red-500 shrink-0 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(f => (
                      <div key={f.key} className={f.type === 'textarea' ? "md:col-span-2" : ""}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.label}</label>
                        {f.type === 'input' ? (
                          <input type="text" value={item[f.key] || ''} onChange={e => handleArrayChange(dataKey, item.id, f.key, e.target.value)} placeholder={f.placeholder} className="w-full text-sm text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                        ) : (
                          <textarea value={item[f.key] || ''} onChange={e => handleArrayChange(dataKey, item.id, f.key, e.target.value)} placeholder={f.placeholder} className="w-full text-sm text-slate-900 bg-white border border-slate-200 px-4 py-3 rounded-lg outline-none resize-none h-24 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => toggleEdit(id)} className="bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm">Done</button>
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-slate-200 pl-5 relative group-hover:border-blue-300 transition-colors duration-300">
                  <div className="absolute w-3 h-3 bg-slate-200 rounded-full -left-[7px] top-1.5 group-hover:bg-blue-500 transition-all duration-300 shadow-sm"></div>
                  <h3 className="font-bold text-slate-900">{item[fields[0].key]}</h3>
                  {fields[1] && <p className="text-sm font-medium text-slate-700 mt-0.5">{item[fields[1].key]}</p>}
                  {fields[2] && <p className="text-sm text-slate-500 mt-0.5">{item[fields[2].key]}</p>}
                  {fields[3] && <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{item[fields[3].key]}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans antialiased text-slate-800 pb-16 relative">
      <div className="h-2 w-full bg-slate-900"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* --- DYNAMIC RENDER: SKELETON OR CONTENT --- */}
        {(!mounted || sessionStatus === 'loading' || isFetching || !hasFetched) ? (
          <SkeletonProfile />
        ) : !session?.user ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-slate-500 mt-2">Please sign in to view and edit your profile.</p>
          </div>
        ) : (
          <>
            {/* ================= 1. PREMIUM HERO HEADER ================= */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden transition-all duration-300 hover:shadow-md">
              
              <button onClick={() => toggleEdit('header')} className="absolute top-6 right-6 md:right-8 text-slate-400 hover:text-slate-900 font-semibold text-sm transition-colors">
                {editMode.header ? 'Done' : 'Edit'}
              </button>

              {/* Avatar & Dynamic Progress Ring */}
              <div className="relative w-36 h-36 shrink-0 mt-2 group">
                <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="289" strokeDashoffset={289 - (289 * score) / 100} className="transition-all duration-1000 ease-out drop-shadow-sm" strokeLinecap="round"/>
                </svg>
                
                <div 
                  onClick={() => !uploadingType && fileInputRef.current?.click()}
                  className="absolute inset-0 m-2 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-inner flex items-center justify-center cursor-pointer relative"
                >
                  {uploadingType === 'avatar' ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : data.header.avatar && data.header.avatar !== 'null' ? (
                    <img 
                      src={data.header.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-slate-300">{data.header?.name?.charAt(0) || '?'}</span>
                  )}
                  {!uploadingType && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" disabled={!!uploadingType} />
                
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-green-600 text-xs font-extrabold px-3 py-0.5 rounded-full shadow-sm border border-green-100 z-10">
                  {score}%
                </div>
              </div>

              {/* User Data Grid */}
              <div className="flex-1 w-full space-y-4">
                {editMode.header ? (
                  <div className="space-y-3 max-w-lg bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner transition-all duration-300">
                    <input type="text" value={data.header?.name || ''} onChange={e => setData({...data, header: {...data.header, name: e.target.value}})} className="w-full text-lg font-bold text-slate-900 border-b border-slate-300 outline-none pb-1 bg-transparent focus:border-blue-500 transition-colors" placeholder="Full Name"/>
                    <input type="text" value={data.header?.degree || ''} onChange={e => setData({...data, header: {...data.header, degree: e.target.value}})} className="w-full text-sm font-semibold text-slate-700 border-b border-slate-300 outline-none pb-1 bg-transparent focus:border-blue-500 transition-colors" placeholder="Degree (e.g. B.C.A.)"/>
                    <input type="text" value={data.header?.university || ''} onChange={e => setData({...data, header: {...data.header, university: e.target.value}})} className="w-full text-sm text-slate-500 border-b border-slate-300 outline-none pb-1 bg-transparent focus:border-blue-500 transition-colors" placeholder="University"/>
                  </div>
                ) : (
                  <div className="transition-all duration-300 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{data.header?.name || 'Your Name'}</h1>
                    <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1">{data.header?.degree || 'Add your degree'}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{data.header?.university || 'Add your university'}</p>
                  </div>
                )}

                <div className="h-px bg-slate-100 w-full my-4"></div>

                {editMode.header ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-w-lg bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner transition-all duration-300">
                    <input type="text" value={data.header?.location || ''} onChange={e => setData({...data, header: {...data.header, location: e.target.value}})} placeholder="Location" className="border-b border-slate-300 outline-none bg-transparent focus:border-blue-500 transition-colors py-1"/>
                    <input type="text" value={data.header?.phone || ''} onChange={e => setData({...data, header: {...data.header, phone: e.target.value}})} placeholder="Phone" className="border-b border-slate-300 outline-none bg-transparent focus:border-blue-500 transition-colors py-1"/>
                    <input type="text" value={data.header?.gender || ''} onChange={e => setData({...data, header: {...data.header, gender: e.target.value}})} placeholder="Gender" className="border-b border-slate-300 outline-none bg-transparent focus:border-blue-500 transition-colors py-1"/>
                    <input type="email" value={data.header?.email || ''} onChange={e => setData({...data, header: {...data.header, email: e.target.value}})} placeholder="Email" className="border-b border-slate-300 outline-none bg-transparent focus:border-blue-500 transition-colors py-1 text-slate-400" disabled />
                    <input type="date" value={data.header?.dob || ''} onChange={e => setData({...data, header: {...data.header, dob: e.target.value}})} placeholder="Date of Birth" className="border-b border-slate-300 outline-none bg-transparent focus:border-blue-500 transition-colors py-1 text-slate-600"/>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm text-slate-600 transition-all duration-300">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /><span>{data.header?.location || '-'}</span></div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" /><span>{data.header?.phone || '-'}</span>
                      {data.header?.phone && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400 shrink-0" /><span>{data.header?.gender || '-'}</span></div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">{data.header?.email || '-'}</span>
                      {data.header?.email && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /><span>{data.header?.dob || '-'}</span></div>
                  </div>
                )}
              </div>

              {/* Dynamic Missing Details Gamification Box */}
              <div className="w-full md:w-80 shrink-0 bg-[#FFF6F0] rounded-2xl p-5 border border-[#FFE8DA] transition-all duration-300 hover:shadow-md">
                <div className="space-y-3">
                  {missing.length > 0 ? missing.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => scrollToSection(item.label.toLowerCase())}>
                        <div className="flex items-center gap-3 text-slate-700 font-medium text-sm transition-colors group-hover:text-orange-600">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-orange-300 transition-all duration-300 group-hover:scale-110">
                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors"/>
                          </div>
                          Add {item.label.toLowerCase()}
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-white px-2 py-0.5 rounded-full border border-green-100 shadow-sm transition-transform group-hover:scale-105">↑ {item.boost}%</span>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-4 animate-fade-in">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2"/>
                      <p className="text-sm font-bold text-slate-800">Profile 100% Complete!</p>
                    </div>
                  )}
                </div>
                
                {missing.length > 0 && (
                  <button className="w-full mt-5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-3 px-4 rounded-full transition-all duration-300 shadow-sm shadow-orange-500/30 active:scale-95">
                    Add {missing.length} missing details
                  </button>
                )}
              </div>
            </div>

            {/* MOBILE QUICK LINKS HAMBURGER */}
            <div className="lg:hidden sticky top-[4.5rem] z-30 bg-[#F3F4F6] py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.05)] border-b border-slate-200/50">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full justify-between active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <Menu className="w-4 h-4 text-slate-500" />
                  Jump to Section
                </div>
                {showMobileMenu ? <XCircle className="w-4 h-4 text-slate-400" /> : <span className="text-xs font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{QUICK_LINKS.length}</span>}
              </button>
              
              {/* Dropdown Menu */}
              {showMobileMenu && (
                <div className="absolute top-full left-4 right-4 sm:left-6 sm:right-6 mt-2 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 z-40 max-h-[60vh] overflow-y-auto animate-fade-in">
                  <h3 className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Profile Sections</h3>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {QUICK_LINKS.map(link => (
                      <button 
                        key={link.id} 
                        onClick={() => {
                          scrollToSection(link.id);
                          setShowMobileMenu(false);
                        }}
                        className="text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors truncate"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= 2. MAIN LAYOUT SPLIT ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
              
              {/* LEFT SIDEBAR (STICKY QUICK LINKS) */}
              <div className="lg:col-span-3 hidden lg:block lg:sticky lg:top-24 z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-5 max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <h3 className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Links</h3>
                  <ul className="text-sm font-medium text-slate-600 space-y-1">
                    {QUICK_LINKS.map(link => (
                      <li 
                        key={link.id} onClick={() => scrollToSection(link.id)}
                        className="px-6 py-2.5 hover:bg-slate-50 hover:text-blue-600 cursor-pointer border-l-2 border-transparent hover:border-blue-600 transition-all duration-200"
                      >
                        {link.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RIGHT MAIN AREA */}
              <div className="lg:col-span-9 space-y-6">
              
                {/* SUMMARY */}
                <div id="summary" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Profile Summary</h2>
                    {!editMode.summary && (
                      <button onClick={() => toggleEdit('summary')} className="text-blue-600 font-semibold text-sm hover:underline transition-all">
                        {data.summary ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>
                  
                  {!data.summary && !editMode.summary && (
                    <p className="text-sm text-slate-500 mb-4">Your Profile Summary should mention the highlights of your career and education, what your professional interests are, and what kind of a career you are looking for.</p>
                  )}

                  {editMode.summary ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner transition-all duration-300">
                      <textarea value={data.summary || ''} onChange={e => setData({...data, summary: e.target.value})} className="w-full h-32 p-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all duration-200"/>
                      <div className="flex gap-3 pt-4">
                        <button onClick={() => toggleEdit('summary')} className="bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm">Done</button>
                      </div>
                    </div>
                  ) : data.summary && <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 transition-all duration-300">{data.summary}</p>}
                </div>

                {/* RESUME UPLOAD SECTION */}
                <div id="resume" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Resume</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-between border border-slate-200 rounded-xl p-4 bg-slate-50 gap-4 transition-all duration-300 hover:border-blue-200">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="truncate">
                        {data.resumeUrl ? (
                          <button onClick={() => setShowResumeModal(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left truncate max-w-[200px] sm:max-w-xs">
                            {data.resumeName || 'View Uploaded Resume'}
                          </button>
                        ) : (
                          <p className="text-sm font-bold text-slate-900">{data.resumeName || 'No resume uploaded'}</p>
                        )}
                        {data.resumeName && <p className="text-xs text-slate-500 mt-0.5">Ready to be saved</p>}
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={resumeInputRef} 
                      onChange={handleResumeUpload} 
                      accept=".pdf,.doc,.docx" 
                      className="hidden" 
                      disabled={uploadingType === 'resume'}
                    />

                    <button 
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingType === 'resume'}
                      className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-blue-600 border border-blue-600 bg-white rounded-full hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      {uploadingType === 'resume' ? (
                        <><Loader2 className="w-4 h-4 animate-spin"/> Uploading AWS...</>
                      ) : data.resumeName ? (
                        'Update resume'
                      ) : (
                        'Upload resume'
                      )}
                    </button>
                  </div>
                </div>

                {/* ARRAY SECTIONS */}
                {renderArraySection('employment', 'Employment', 'employment', { id: Date.now().toString(), title: '', company: '', duration: '', description: '' }, 
                  "Talk about the company you worked at, your designation and describe what all you did there.",
                  [{key:'company', label: 'Company name', placeholder:'e.g. Google', type:'input'}, {key:'title', label: 'Designation / Job Title', placeholder:'e.g. Software Engineer', type:'input'}, {key:'duration', label: 'Duration (Start to End)', placeholder:'e.g. Jan 2024 - Present', type:'input'}, {key:'description', label: 'Describe what you did', placeholder:'Key responsibilities and impact...', type:'textarea'}])}
                
                {renderArraySection('internships', 'Internships', 'internships', { id: Date.now().toString(), role: '', company: '', duration: '', description: '' }, 
                  "Talk about the company you interned at, what projects you undertook and what special skills you learned.",
                  [{key:'company', label: 'Company name', placeholder:'e.g. Microsoft', type:'input'}, {key:'role', label: 'Internship Role', placeholder:'e.g. Frontend Intern', type:'input'}, {key:'duration', label: 'Internship duration', placeholder:'e.g. Summer 2025', type:'input'}, {key:'description', label: 'Describe what you did at internship', placeholder:'Projects undertaken and skills learned...', type:'textarea'}])}
                
                {renderArraySection('education', 'Education', 'education', { id: Date.now().toString(), degree: '', institution: '', details: '' }, 
                  "Add details of your educational background, including degrees, institutions, and graduation year.",
                  [{key:'institution', label: 'Institution Name', placeholder:'e.g. MIT', type:'input'}, {key:'degree', label: 'Degree / Class', placeholder:'e.g. B.Tech Computer Science', type:'input'}, {key:'details', label: 'Graduation Details', placeholder:'e.g. Graduating in 2026, Full Time', type:'input'}])}

                {/* KEY SKILLS */}
                <div id="skills" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Key Skills</h2>
                      {data.skills.length === 0 && !editMode.skills && <p className="text-sm text-slate-500 mt-1 max-w-2xl">Add skills that showcase your technical expertise.</p>}
                    </div>
                    {!editMode.skills && <button onClick={() => toggleEdit('skills')} className="text-blue-600 font-semibold text-sm hover:underline transition-colors">Edit</button>}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {(data.skills || []).map((skill) => (
                      <span key={skill} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50">
                        {skill}
                        {editMode.skills && <button onClick={() => handleSimpleArrayRemove('skills', skill)} className="text-slate-400 hover:text-red-500 transition-colors">&times;</button>}
                      </span>
                    ))}
                  </div>
                  
                  {editMode.skills && (
                    <div className="mt-5 bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-inner transition-all duration-300">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Add a new skill</label>
                      <div className="flex gap-2 w-full md:w-1/2">
                        <input 
                          type="text" 
                          placeholder="Type a skill..." 
                          value={newSkill} 
                          onChange={(e) => setNewSkill(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && addSimpleItem('skills', newSkill, setNewSkill)} 
                          className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        />
                        <button 
                          onClick={() => addSimpleItem('skills', newSkill, setNewSkill)}
                          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => {
                            addSimpleItem('skills', newSkill, setNewSkill); 
                            toggleEdit('skills');
                          }} 
                          className="bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROJECTS */}
                {renderArraySection('projects', 'Projects', 'projects', { id: Date.now().toString(), title: '', duration: '', description: '' }, 
                  "Showcase your work by adding projects you've built, including the tech stack and your specific contributions.",
                  [{key:'title', label: 'Project Name', placeholder:'e.g. Student Marketplace', type:'input'}, {key:'duration', label: 'Project Duration', placeholder:'e.g. Jan 2026 - Mar 2026', type:'input'}, {key:'description', label: 'Describe the project', placeholder:'Architecture, tech stack, and your role...', type:'textarea'}])}

                {/* LANGUAGES */}
                <div id="languages" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Languages</h2>
                      {data.languages.length === 0 && !editMode.languages && <p className="text-sm text-slate-500 mt-1 max-w-2xl">Add languages you can speak, read, or write.</p>}
                    </div>
                    {!editMode.languages && <button onClick={() => toggleEdit('languages')} className="text-blue-600 font-semibold text-sm hover:underline transition-colors">Edit</button>}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {(data.languages || []).map((lang) => (
                      <span key={lang} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50">
                        {lang}
                        {editMode.languages && <button onClick={() => handleSimpleArrayRemove('languages', lang)} className="text-slate-400 hover:text-red-500 transition-colors">&times;</button>}
                      </span>
                    ))}
                  </div>
                  
                  {editMode.languages && (
                    <div className="mt-5 bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-inner transition-all duration-300">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Add a new language</label>
                      <div className="flex gap-2 w-full md:w-1/2">
                        <input 
                          type="text" 
                          placeholder="Type a language..." 
                          value={newLanguage} 
                          onChange={(e) => setNewLanguage(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && addSimpleItem('languages', newLanguage, setNewLanguage)} 
                          className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                        />
                        <button 
                          onClick={() => addSimpleItem('languages', newLanguage, setNewLanguage)}
                          className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => {
                            addSimpleItem('languages', newLanguage, setNewLanguage); 
                            toggleEdit('languages');
                          }} 
                          className="bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACADEMIC ACHIEVEMENTS */}
                {renderArraySection('academic', 'Academic Achievements', 'academicAchievements', { id: Date.now().toString(), title: '', description: '' }, 
                  "Highlight honors, scholarships, or academic awards you have received.",
                  [{key:'title', label: 'Achievement Title', placeholder:'e.g. Dean\'s List', type:'input'}, {key:'description', label: 'Context / Description', placeholder:'Received during Fall Semester 2025...', type:'textarea'}])}

                {/* ACCOMPLISHMENTS */}
                {renderArraySection('accomplishments', 'Accomplishments', 'accomplishments', { id: Date.now().toString(), title: '', description: '' }, 
                  "Add certifications, publications, or special recognitions that make you proud.",
                  [{key:'title', label: 'Title', placeholder:'e.g. AWS Certified Developer', type:'input'}, {key:'description', label: 'Details', placeholder:'Issued by Amazon, valid until 2028...', type:'textarea'}])}

                {/* COMPETITIVE EXAMS */}
                {renderArraySection('exams', 'Competitive Exams', 'exams', { id: Date.now().toString(), examName: '', year: '', score: '' }, 
                  "Talk about any competitive exams you appeared for and the rank or score received.",
                  [{key:'examName', label: 'Exam Name', placeholder:'e.g. GATE / GRE', type:'input'}, {key:'year', label: 'Year', placeholder:'e.g. 2025', type:'input'}, {key:'score', label: 'Score / Rank', placeholder:'e.g. 98th Percentile', type:'input'}])}

                {/* 🚀 UPGRADED PREFERENCES (WITH CTC) 🚀 */}
                <div id="preferences" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 scroll-mt-24 transition-all duration-300 hover:shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Career Preferences</h2>
                    <button onClick={() => toggleEdit('preferences')} className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 transition-colors">
                      {editMode.preferences ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 ${editMode.preferences ? 'bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-inner' : ''} transition-all duration-300 ease-in-out`}>
                    
                    {/* Job Type */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred job type</p>
                      {editMode.preferences ? (
                        <input type="text" placeholder="e.g. Full-Time, Remote" value={data.preferences?.jobType || ''} onChange={e => setData({...data, preferences: {...data.preferences, jobType: e.target.value}})} className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{data.preferences?.jobType || '-'}</p>
                      )}
                    </div>
                    
                    {/* Availability */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Availability</p>
                      {editMode.preferences ? (
                        <input type="text" placeholder="e.g. Immediate, 30 Days" value={data.preferences?.availability || ''} onChange={e => setData({...data, preferences: {...data.preferences, availability: e.target.value}})} className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{data.preferences?.availability || '-'}</p>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred location</p>
                      {editMode.preferences ? (
                        <input type="text" placeholder="e.g. Bangalore, Remote" value={data.preferences?.location || ''} onChange={e => setData({...data, preferences: {...data.preferences, location: e.target.value}})} className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{data.preferences?.location || '-'}</p>
                      )}
                    </div>

                    {/* NEW: Current CTC */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current CTC</p>
                      {editMode.preferences ? (
                        <input type="text" placeholder="e.g. 12 LPA" value={data.preferences?.currentCTC || ''} onChange={e => setData({...data, preferences: {...data.preferences, currentCTC: e.target.value}})} className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{data.preferences?.currentCTC || '-'}</p>
                      )}
                    </div>

                    {/* NEW: Expected CTC */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expected CTC</p>
                      {editMode.preferences ? (
                        <input type="text" placeholder="e.g. 18 LPA" value={data.preferences?.expectedCTC || ''} onChange={e => setData({...data, preferences: {...data.preferences, expectedCTC: e.target.value}})} className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"/>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{data.preferences?.expectedCTC || '-'}</p>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>

      {/* --- SMART FLOATING SAVE BUTTON --- */}
      <button 
        onClick={saveProfile}
        disabled={isSaving}
        className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-full shadow-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showSaveButton ? 'translate-y-0 opacity-100 scale-100 hover:scale-105 active:scale-95' : 'translate-y-24 opacity-0 scale-90 pointer-events-none'}`}
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} 
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>

      {/* --- RESUME VIEWER MODAL --- */}
      {showResumeModal && data.resumeUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden transform transition-all scale-100">
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600"/>
                {data.resumeName || 'Resume Document'}
              </h2>
              <div className="flex items-center gap-3">
                <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                  Open in new tab
                </a>
                <button onClick={() => setShowResumeModal(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-xl transition-all shadow-sm active:scale-95">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100 relative">
              <iframe 
                src={`${data.resumeUrl}#toolbar=0`} 
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

// --- SUB-COMPONENT: SKELETON PROFILE LOADER ---
function SkeletonProfile() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Hero Header Skeleton */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-36 h-36 rounded-full bg-slate-100 shrink-0 border-4 border-white shadow-inner mt-2"></div>
        <div className="flex-1 w-full space-y-4 pt-2">
          <div className="h-8 bg-slate-100 rounded-md w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded-md w-1/4"></div>
          <div className="h-4 bg-slate-100 rounded-md w-1/5"></div>
          <div className="h-px bg-slate-50 w-full my-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
          </div>
        </div>
        <div className="w-full md:w-80 h-32 bg-slate-50 border border-slate-100 rounded-2xl shrink-0"></div>
      </div>

      {/* 2. Main Layout Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar Skeleton */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="h-4 bg-slate-100 rounded-md w-1/2 mb-6"></div>
            <div className="space-y-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-3 bg-slate-100 rounded-md w-3/4"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Skeleton */}
        <div className="lg:col-span-9 space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex justify-between mb-6">
                <div className="h-6 bg-slate-100 rounded-md w-1/4"></div>
                <div className="h-4 bg-slate-100 rounded-md w-12"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded-md w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}