'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession as useAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, UploadCloud, Check, ArrowUpRight, 
  Clock, TrendingUp, Zap, X, FileText, Loader2 
} from 'lucide-react';
import { useSmartFillModalStore } from '@/store/useSmartFillModalStore';
import { useProfileStore } from '@/store/useProfileStore';
import { uploadToS3 } from '@/lib/s3Helper';
import { API_BASE_URL } from '@/lib/config';

export default function SmartFillModal() {
  const { data: session } = useAuthSession();
  const router = useRouter();
  const { isOpen, onUploadSuccess, closeModal, setBackgroundExtracting } = useSmartFillModalStore();
  const [fileSelected, setFileSelected] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status message rotation while parsing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (fileSelected) {
      setLoadingPhase(0);
      const phases = [1, 2, 3];
      let currentPhaseIdx = 0;
      
      timer = setInterval(() => {
        if (currentPhaseIdx < phases.length - 1) {
          currentPhaseIdx++;
          setLoadingPhase(phases[currentPhaseIdx]);
        }
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [fileSelected]);

  // Reset file selected state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFileSelected(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runBackgroundExtraction = async (file: File, userEmail: string) => {
    try {
      // 1. Upload to S3
      const s3FileUrl = await uploadToS3(file);
      
      // 2. Fetch current profile from Zustand store
      const currentProfile = useProfileStore.getState().profileData;
      const updatedProfile = {
        ...currentProfile,
        resumeName: file.name,
        resumeUrl: s3FileUrl
      };

      // Set pending verification flag for Profile page
      localStorage.setItem('pending_profile_verification', 'true');
      window.dispatchEvent(new Event('pending_profile_updated'));

      // 5. Update store state locally
      useProfileStore.getState().setProfileData(updatedProfile);

      // 6. Complete upload and immediately proceed to Apply
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      closeModal();
    } catch (err) {
      console.error("Resume upload and save failed:", err);
      setErrorMsg("Resume upload failed. Please try again or complete manually.");
      setFileSelected(false);
    } finally {
      setBackgroundExtracting(false);
    }
  };

  const handleSmartFill = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Please upload a resume smaller than 10MB.");
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      alert("No active session found. Please log in again.");
      closeModal();
      return;
    }

    setFileSelected(true);
    setBackgroundExtracting(true);
    setErrorMsg(null);
    runBackgroundExtraction(file, userEmail);
  };

  const handleProceed = () => {
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    closeModal();
  };

  const handleManualRedirect = () => {
    closeModal();
    router.push('/profile');
  };

  const getStatusText = () => {
    return "Uploading resume copy to secure cloud S3...";
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[6px] animate-fade-in">
      <div 
        className="relative w-full max-w-[850px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-200 overflow-hidden transform scale-100 transition-all duration-300 animate-fade-in-up flex flex-col md:flex-row md:min-h-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================= LEFT BLUE BENEFIT COLUMN (45% width) ================= */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-[#0c1a30] to-[#081224] text-white p-8 hidden md:flex flex-col justify-between relative overflow-hidden select-none animate-fade-in">
          {/* Blurred Background blobs */}
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-blue-500/10 rounded-full blur-[60px]" />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-orange-500/10 rounded-full blur-[60px]" />

          <div className="space-y-7 relative z-10">
            {/* Autofill Eyebrow badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-blue-200 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
              AI Autofill
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold leading-tight">
                Skip the typing. <br/>
                <span className="text-blue-400">Upload your resume.</span>
              </h2>
              <p className="text-xs leading-relaxed text-slate-300 font-semibold">
                Our AI reads your resume and fills your entire hiredeck profile in seconds — experience, skills, education, projects. You just review.
              </p>
            </div>

            {/* List of benefits */}
            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[12px] font-extrabold text-white leading-tight">Profile ready in ~10 seconds</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">No more 30-minute forms.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[12px] font-extrabold text-white leading-tight">3x more recruiter matches</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Complete profiles surface higher in search.</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[12px] font-extrabold text-white leading-tight">One-click apply, everywhere</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Use your profile across 40+ job sites.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy disclaimer */}
          <div className="flex items-center gap-2 pt-6 border-t border-white/10 text-[10px] text-slate-400 font-bold relative z-10">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span>Private by default. Your resume is never shared without consent.</span>
          </div>

        </div>

        {/* ================= RIGHT WHITE UPLOAD COLUMN (55% width) ================= */}
        <div className="w-full md:w-[55%] p-8 flex flex-col justify-between relative bg-white min-h-[360px] md:min-h-[400px]">
          
          {/* Close button (Redirects to manual profile completion on click) */}
          <button 
            onClick={handleManualRedirect}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Action Area */}
          <div className="my-auto space-y-6">
            
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                {errorMsg}
              </div>
            )}

            {!fileSelected ? (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Upload your resume</h3>
                  <p className="text-xs text-slate-400 font-bold">PDF, DOCX or TXT · up to 10 MB</p>
                </div>

                {/* Dashed Drag & Drop Box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 bg-blue-50/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-blue-50/20 hover:border-blue-300 transition-all group animate-fade-in"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleSmartFill} 
                    accept=".pdf,.doc,.docx,.txt" 
                    className="hidden" 
                  />
                  
                  {/* Circle cloud icon */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition-colors shrink-0 group-hover:scale-105 duration-200">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-sm font-extrabold text-slate-800">
                      Drop your resume here
                    </p>
                    <p className="text-xs font-bold text-blue-500 hover:underline">
                      or browse files
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    PDF · DOCX · TXT
                  </span>
                </div>
              </div>
            ) : (
              /* Loading / Extraction State */
              <div className="flex flex-col items-center text-center space-y-6 py-4 animate-fade-in">
                <div className="relative flex items-center justify-center">
                  {/* Outer spinning ring */}
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                  {/* Inner document icon */}
                  <div className="absolute w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <FileText className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-800 leading-tight">Uploading your resume</h3>
                  <p className="text-xs text-slate-500 max-w-[280px] font-semibold leading-relaxed animate-pulse">
                    {getStatusText()}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer controls & social proof */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 flex-wrap gap-4 text-xs font-extrabold text-slate-500">
            <button 
              onClick={handleManualRedirect}
              className="text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider text-[10px]"
            >
              I'll do it manually
            </button>

            {/* Social proof */}
            <div className="flex items-center gap-2">
              {/* Colored circles stack */}
              <div className="flex -space-x-1.5 select-none">
                <div className="w-5 h-5 rounded-full bg-blue-500 border border-white shrink-0" />
                <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white shrink-0" />
                <div className="w-5 h-5 rounded-full bg-amber-500 border border-white shrink-0" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                12,400+ profiles built this week
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
