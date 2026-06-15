'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProfileStore } from '@/store/useProfileStore';
import { getMissingProfileFields, REQUIRED_FIELDS, ProfileData } from '@/lib/profileHelper';
import { User, Phone, MapPin, Award, BookOpen, DollarSign, FileText, Loader2, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const { isComplete, hasFetched, isFetching, fetchProfile, profileData } = useProfileStore();
  const [mounted, setMounted] = useState(false);
  const [draftData, setDraftData] = useState<ProfileData | null>(null);

  // Trigger Profile Fetching
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (session?.user?.email) {
      if (!hasFetched && !isFetching) {
        fetchProfile(session.user.email, session.user.name, session.user.image).then(() => {
          Promise.resolve().then(() => setMounted(true));
        });
      } else {
        Promise.resolve().then(() => setMounted(true));
      }
    } else {
      Promise.resolve().then(() => setMounted(true));
    }
  }, [session, sessionStatus, hasFetched, isFetching, fetchProfile]);

  // Load localStorage draft to reflect live user progress in the onboarding card
  useEffect(() => {
    if (mounted && session?.user?.email) {
      const draftKey = `profile_draft_${session.user.email}`;
      const localDraft = localStorage.getItem(draftKey);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          Promise.resolve().then(() => setDraftData(parsed));
        } catch {
          Promise.resolve().then(() => setDraftData(null));
        }
      }
    }
  }, [mounted, session, isComplete]);

  if (sessionStatus === 'loading' || (session && (!hasFetched || !mounted))) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Checking profile status...</p>
      </div>
    );
  }

  // If not logged in, let the page-level Auth gate handle it
  if (!session) {
    return <>{children}</>;
  }

  // If profile is fully complete, render contents normally
  if (isComplete) {
    return <>{children}</>;
  }

  // Profile is incomplete! Render the premium checklist overlay.
  // Evaluate completion based on draft data first (to reward progress) then fallback to saved data
  const evaluationProfile = draftData || profileData;
  const missingFields = getMissingProfileFields(evaluationProfile);
  const missingKeys = missingFields.map(f => f.fieldKey);
  
  const completedCount = REQUIRED_FIELDS.length - missingFields.length;
  const completionPercentage = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  // Field definitions with respective Lucide icons for beautiful list items
  const fieldIcons: Record<string, { icon: React.ElementType; label: string }> = {
    name: { icon: User, label: 'Full Name' },
    phone: { icon: Phone, label: 'Phone Number' },
    location: { icon: MapPin, label: 'Current Location' },
    degree: { icon: Award, label: 'Degree / Education' },
    university: { icon: BookOpen, label: 'University / Institution' },
    currentCTC: { icon: DollarSign, label: 'Current Salary' },
    expectedCTC: { icon: DollarSign, label: 'Expected Salary' },
    resumeUrl: { icon: FileText, label: 'Resume Upload' },
  };

  return (
    <div className="relative min-h-screen">
      {/* Blur the main page contents behind */}
      <div className="absolute inset-0 pointer-events-none select-none blur-sm filter opacity-20">
        {children}
      </div>

      {/* Screen Blocking Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 p-6 sm:p-10 max-w-xl w-full my-8 animate-fade-in-up space-y-8">
          
          {/* Decorative Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-xs mx-auto shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Complete Profile to Unlock
          </div>

          {/* Heading */}
          <div className="text-center space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Let&apos;s complete your profile
            </h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base max-w-md mx-auto">
              Finish setting up your credentials to match with premium tech roles and start sending applications.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Completion Progress</span>
              <span className="text-blue-600">{completedCount} of {REQUIRED_FIELDS.length} Fields</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative w-full h-3 bg-slate-200/70 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Interactive Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {REQUIRED_FIELDS.map((item) => {
              const def = fieldIcons[item.fieldKey];
              const Icon = def.icon;
              const isFieldFilled = !missingKeys.includes(item.fieldKey);

              return (
                <div 
                  key={item.fieldKey}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                    isFieldFilled 
                      ? 'bg-emerald-50/40 border-emerald-100/60 text-emerald-800' 
                      : 'bg-white border-slate-200/70 text-slate-600 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center border shrink-0 ${
                      isFieldFilled 
                        ? 'bg-emerald-100/40 border-emerald-200/50 text-emerald-600' 
                        : 'bg-slate-50 border-slate-200/60 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold truncate">{def.label}</span>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isFieldFilled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 block border border-slate-300/60" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Link Action */}
          <Link 
            href="/profile" 
            className="group relative w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-blue-600/10 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            <span>Complete My Profile</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>
      </div>
    </div>
  );
}
