'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, X, UploadCloud, Loader2 } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { uploadToS3 } from '@/lib/s3Helper';
import { API_BASE_URL } from '@/lib/config';
import { useRouter } from 'next/navigation';

export default function SmartFillPrompt() {
  const { data: session } = useSession();
  const { isComplete } = useProfileStore();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user && !isComplete) {
      const hasSkipped = localStorage.getItem(`has_skipped_smartfill_${session.user.email}`);
      if (!hasSkipped) {
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [session, isComplete]);

  const handleSkip = () => {
    if (session?.user?.email) {
      localStorage.setItem(`has_skipped_smartfill_${session.user.email}`, 'true');
    }
    setIsVisible(false);
  };

  const handleSmartFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a resume smaller than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      
      const s3FileUrl = await uploadToS3(file);
      
      const response = await fetch(`${API_BASE_URL}/resume/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_url: s3FileUrl })
      });

      if (!response.ok) throw new Error("AI extraction failed.");
      
      const dataResponse = await response.json();
      const extracted = dataResponse.extracted || dataResponse; 

      if (extracted) {
        const draftKey = `profile_draft_${session?.user?.email}`;
        const currentDraftStr = localStorage.getItem(draftKey);
        let currentDraft = currentDraftStr ? JSON.parse(currentDraftStr) : {};

        const mergedDraft = {
          ...currentDraft,
          summary: extracted.summary || currentDraft.summary,
          resumeName: file.name,
          resumeUrl: s3FileUrl,
          skills: Array.from(new Set([...(currentDraft.skills || []), ...(extracted.skills || [])])),
          languages: Array.from(new Set([...(currentDraft.languages || []), ...(extracted.languages || [])])),
          header: { ...(currentDraft.header || {}), ...(extracted.header || {}) },
          preferences: { ...(currentDraft.preferences || {}), ...(extracted.preferences || {}) },
          experience: extracted.experience?.length ? extracted.experience : currentDraft.experience,
          education: extracted.education?.length ? extracted.education : currentDraft.education,
          projects: extracted.projects?.length ? extracted.projects : currentDraft.projects,
        };

        localStorage.setItem(draftKey, JSON.stringify(mergedDraft));

        if (session?.user?.email) {
          localStorage.setItem(`has_skipped_smartfill_${session.user.email}`, 'true');
        }
        
        setIsVisible(false);
        router.push('/profile');
      }

    } catch (err) {
      console.error(err);
      alert("An error occurred during Smart Fill. Please try again.");
      setIsUploading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[420px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-[var(--kindling-border)] p-6 z-[100] animate-fade-in-up">
      <button 
        onClick={handleSkip} 
        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-4">
        <div className="w-12 h-12 bg-[#d4ff70] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#c3f05b]">
          <Sparkles className="w-6 h-6 text-[var(--kindling-ink)]" />
        </div>
        <div>
          <h3 className="text-[1.3rem] leading-none text-[var(--kindling-ink)] mb-2" style={{ fontFamily: 'var(--font-instrument-serif)' }}>AI Smart Fill</h3>
          <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
            ✨ Want to set up your profile in 5 seconds? Upload your resume and our AI will instantly build it for you.
          </p>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleSmartFill} 
              accept=".pdf,.doc,.docx" 
              className="hidden" 
              disabled={isUploading}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 bg-[var(--kindling-ink)] hover:bg-black text-white px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:bg-[var(--kindling-ink)]"
            >
              {isUploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>
              ) : (
                <><UploadCloud className="w-3.5 h-3.5" /> Upload Resume</>
              )}
            </button>
            <button 
              onClick={handleSkip}
              disabled={isUploading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
