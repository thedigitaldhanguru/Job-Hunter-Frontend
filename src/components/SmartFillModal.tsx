'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, X, UploadCloud, Loader2 } from 'lucide-react';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';
import { uploadToS3 } from '@/lib/s3Helper';
import { API_BASE_URL } from '@/lib/config';

export default function SmartFillModal() {
  const { data: session } = useSession();
  const { isOpen, onSkip, onUploadSuccess, closeModal } = useSmartFillModalStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    closeModal();
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
      
      // 1. Upload to S3
      const s3FileUrl = await uploadToS3(file);
      
      // 2. Extract details using Bedrock AI
      const response = await fetch(`${API_BASE_URL}/resume/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_url: s3FileUrl })
      });

      if (!response.ok) throw new Error("AI extraction failed.");
      
      const dataResponse = await response.json();
      const extracted = dataResponse.extracted || dataResponse; 

      if (extracted) {
        // 3. Write draft to localStorage
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

        // 4. Trigger redirect & tab opening success callback
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        closeModal();
      }

    } catch (err) {
      console.error(err);
      alert("An error occurred during Smart Fill extraction. Please check your internet connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in"
      onClick={handleSkip}
    >
      <div 
        className="relative w-full max-w-[420px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[var(--kindling-border)] overflow-hidden transform scale-100 transition-all duration-300 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={handleSkip}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-20"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* CONTENT */}
        <div className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 bg-[#d4ff70] rounded-xl flex items-center justify-center shadow-sm border border-[#c3f05b]">
              <Sparkles className="w-6 h-6 text-[var(--kindling-ink)]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-normal text-[var(--kindling-ink)] leading-none animate-fade-in" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                Optimize with AI Smart Fill
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[340px]">
                Want to set up your profile in 5 seconds? Upload your resume and our Bedrock AI will build it for you automatically.
              </p>
            </div>

            <div className="w-full pt-4 space-y-3">
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
                className="w-full bg-[var(--kindling-ink)] hover:bg-black text-white py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-75 disabled:hover:bg-[var(--kindling-ink)]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting resume details...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Upload Resume
                  </>
                )}
              </button>

              <button 
                onClick={handleSkip}
                disabled={isUploading}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-full text-sm font-semibold transition-all"
              >
                Skip and Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
