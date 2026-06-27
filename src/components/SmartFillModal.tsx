'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, UploadCloud, Check, ArrowUpRight } from 'lucide-react';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';
import { uploadToS3 } from '@/lib/s3Helper';
import { API_BASE_URL } from '@/lib/config';

export default function SmartFillModal() {
  const { data: session } = useSession();
  const { isOpen, onUploadSuccess, closeModal, setBackgroundExtracting } = useSmartFillModalStore();
  const [fileSelected, setFileSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset file selected state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFileSelected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runBackgroundExtraction = async (file: File, userEmail: string) => {
    try {
      // 1. Upload to S3 in background
      const s3FileUrl = await uploadToS3(file);
      
      // 2. Extract details using Bedrock AI in background
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
        const draftKey = `profile_draft_${userEmail}`;
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

        // 4. Set pending verification flag in localStorage
        localStorage.setItem('pending_profile_verification', 'true');

        // 5. Notify layout that draft profile is updated in background
        window.dispatchEvent(new Event('pending_profile_updated'));
      }
    } catch (err) {
      console.error("Background resume extraction failed:", err);
    } finally {
      setBackgroundExtracting(false);
    }
  };

  const handleSmartFill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a resume smaller than 5MB.");
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      alert("No active session found. Please log in again.");
      closeModal();
      return;
    }

    // 1. Set state to show the user direct proceed action screen
    setFileSelected(true);

    // 2. Set background extracting state
    setBackgroundExtracting(true);

    // 3. Trigger asynchronous background process
    runBackgroundExtraction(file, userEmail);
  };

  const handleProceed = () => {
    // Calling onUploadSuccess in a direct user-initiated click event ensures browsers don't block the popup!
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    closeModal();
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in"
    >
      <div 
        className="relative w-full max-w-[420px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[var(--kindling-border)] overflow-hidden transform scale-100 transition-all duration-300 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <div className="p-8">
          {!fileSelected ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-[#d4ff70] rounded-xl flex items-center justify-center shadow-sm border border-[#c3f05b]">
                <Sparkles className="w-6 h-6 text-[var(--kindling-ink)]" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-normal text-[var(--kindling-ink)] leading-none animate-fade-in" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                  Upload Your Resume
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[340px]">
                  To apply for jobs, please upload your resume. Our Bedrock AI will instantly pre-fill your profile details.
                </p>
              </div>

              <div className="w-full pt-4 space-y-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleSmartFill} 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[var(--kindling-ink)] hover:bg-black text-white py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Resume
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-[#d4ff70] rounded-full flex items-center justify-center shadow-sm border border-[#c3f05b]">
                <Check className="w-6 h-6 text-[var(--kindling-ink)]" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-normal text-[var(--kindling-ink)] leading-none animate-fade-in" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                  Resume Selected!
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[340px]">
                  We are parsing your resume with AI in the background. You can now proceed to the job page.
                </p>
              </div>

              <div className="w-full pt-4">
                <button 
                  onClick={handleProceed}
                  className="w-full bg-[var(--kindling-ink)] hover:bg-black text-white py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Proceed to Apply <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
