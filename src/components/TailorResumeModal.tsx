'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession as useAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, UploadCloud, Check, ArrowUpRight, 
  X, FileText, Loader2, Copy, Download, Briefcase, Award, FolderGit2, RefreshCw, AlertCircle, Trash2, Plus, Mail, Phone, MapPin, Link
} from 'lucide-react';
import { useTailorResumeModalStore } from '@/store/useTailorResumeModalStore';
import { useProfileStore } from '@/store/useProfileStore';
import { uploadToS3 } from '@/lib/s3Helper';
import { API_BASE_URL } from '@/lib/config';

interface TailoredResponse {
  contact: {
    email: string;
    phone: string;
    location: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
  summary: string;
  skills: string[];
  employment: Array<{
    company: string;
    title: string;
    duration: string;
    description: string[];
  }>;
  projects: Array<{
    title: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    details: string;
  }>;
  accomplishments: string[];
  languages: string[];
}

export default function TailorResumeModal() {
  const { data: session } = useAuthSession();
  const router = useRouter();
  const { isOpen, selectedJob, closeModal } = useTailorResumeModalStore();
  const { profileData, fetchProfile } = useProfileStore();

  const [uploading, setUploading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [tailoredData, setTailoredData] = useState<TailoredResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'contact' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'accomplishments'>('summary');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status message rotation while tailoring
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tailoring) {
      setLoadingPhase(0);
      const phases = [1, 2, 3];
      let currentPhaseIdx = 0;
      
      timer = setInterval(() => {
        if (currentPhaseIdx < phases.length - 1) {
          currentPhaseIdx++;
          setLoadingPhase(phases[currentPhaseIdx]);
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [tailoring]);

  // Reset local state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setTailoredData(null);
      setErrorMsg(null);
      setTailoring(false);
      setUploading(false);
    } else if (session?.user?.email) {
      fetchProfile(session.user.email, session.user.name, session.user.image);
    }
  }, [isOpen, session, fetchProfile]);

  if (!isOpen || !selectedJob) return null;

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!session?.user?.email) {
      setErrorMsg("You must be logged in to upload a resume.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);
      const s3Url = await uploadToS3(file);

      // Save to backend profile database
      const currentProfile = useProfileStore.getState().profileData;
      const payload = {
        full_name: currentProfile.header.name || session.user.name || '',
        email: session.user.email,
        degree: currentProfile.header.degree || '',
        university: currentProfile.header.university || '',
        location: currentProfile.header.location || '',
        experience: currentProfile.header.experience || '',
        phone: currentProfile.header.phone || '',
        gender: currentProfile.header.gender || '',
        dob: currentProfile.header.dob || '',
        profile_summary: currentProfile.summary || '',
        avatar_url: currentProfile.header.avatar || session.user.image || '',
        current_ctc: currentProfile.preferences.currentCTC || '',
        expected_ctc: currentProfile.preferences.expectedCTC || '',
        extended_profile: {
          ...currentProfile,
          resumeName: file.name,
          resumeUrl: s3Url
        }
      };

      const res = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save resume url");

      // Refetch profile to sync store
      await fetchProfile(session.user.email, session.user.name, session.user.image);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Resume upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!profileData?.resumeUrl) {
      setErrorMsg("Please upload a resume first.");
      return;
    }

    setTailoring(true);
    setErrorMsg(null);
    setTailoredData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/resume/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_url: profileData.resumeUrl,
          job_title: selectedJob.title,
          company: selectedJob.company_raw || "Target Company",
          job_description: selectedJob.description || ""
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Tailoring failed");
      }

      const data = await res.json();
      if (data.status === 'success' && data.tailored) {
        const t = data.tailored;
        
        // Defensive key mapping to handle any variation from AWS Bedrock AI
        const contactObj = t.contact || t.contact_info || {};
        const phoneVal = contactObj.phone || contactObj.phone_number || contactObj.mobile || contactObj.telephone || contactObj.tel || profileData?.header?.phone || '';
        const emailVal = contactObj.email || contactObj.email_address || profileData?.header?.email || session?.user?.email || '';
        const locVal = contactObj.location || contactObj.city_country || contactObj.address || profileData?.header?.location || '';
        const githubVal = contactObj.github || contactObj.github_url || '';
        const linkedinVal = contactObj.linkedin || contactObj.linkedin_url || '';
        const portfolioVal = contactObj.portfolio || contactObj.portfolio_url || contactObj.website || '';

        let rawEdu = t.education || t.edu || t.education_history || [];
        if (!Array.isArray(rawEdu)) {
          rawEdu = [];
        }
        let parsedEdu = rawEdu.map((edu: any) => ({
          institution: edu.institution || edu.school || edu.university || '',
          degree: edu.degree || edu.major || edu.qualification || '',
          details: edu.details || edu.year || edu.duration || edu.date || edu.gpa || ''
        })).filter((edu: any) => edu.institution || edu.degree);

        // Fallback to profile education if empty
        if (parsedEdu.length === 0) {
          if (Array.isArray(profileData?.education) && profileData.education.length > 0) {
            parsedEdu = profileData.education.map((edu: any) => ({
              institution: edu.school || edu.institution || '',
              degree: edu.degree || '',
              details: edu.year || edu.details || ''
            }));
          } else {
            parsedEdu = [{
              institution: profileData?.header?.university || '',
              degree: profileData?.header?.degree || '',
              details: ''
            }];
          }
        }

        let rawAcc = t.accomplishments || t.certifications || t.awards || t.honors || [];
        if (!Array.isArray(rawAcc)) {
          rawAcc = typeof rawAcc === 'string' ? [rawAcc] : [];
        }
        let accomplishmentsList = rawAcc.map((a: any) => typeof a === 'object' ? (a.title || a.name || JSON.stringify(a)) : String(a));
        if (accomplishmentsList.length === 0 && Array.isArray(profileData?.accomplishments)) {
          accomplishmentsList = profileData.accomplishments;
        }

        let rawLang = t.languages || t.langs || [];
        if (!Array.isArray(rawLang)) {
          rawLang = typeof rawLang === 'string' ? [rawLang] : [];
        }
        let languagesList = rawLang.map((l: any) => typeof l === 'object' ? (l.name || JSON.stringify(l)) : String(l));
        if (languagesList.length === 0 && Array.isArray(profileData?.languages)) {
          languagesList = profileData.languages;
        }

        const normalized: TailoredResponse = {
          contact: {
            email: emailVal,
            phone: phoneVal,
            location: locVal,
            github: githubVal,
            linkedin: linkedinVal,
            portfolio: portfolioVal
          },
          summary: t.summary || '',
          skills: Array.isArray(t.skills) ? t.skills : [],
          employment: Array.isArray(t.employment) ? t.employment.map((emp: any) => ({
            company: emp.company || '',
            title: emp.title || '',
            duration: emp.duration || '',
            description: Array.isArray(emp.description) ? emp.description : ['']
          })) : [],
          projects: Array.isArray(t.projects) ? t.projects.map((proj: any) => ({
            title: proj.title || '',
            description: Array.isArray(proj.description) ? proj.description : ['']
          })) : [],
          education: parsedEdu,
          accomplishments: accomplishmentsList,
          languages: languagesList
        };

        setTailoredData(normalized);
        setActiveTab('summary');
      } else {
        throw new Error("Invalid response schema from tailoring server");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to tailor resume. Please try again.");
    } finally {
      setTailoring(false);
    }
  };

  const triggerCopiedNotification = (section: string) => {
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyToClipboard = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    triggerCopiedNotification(sectionName);
  };

  // EDIT STATE HANDLERS
  const handleUpdateContact = (field: keyof TailoredResponse['contact'], val: string) => {
    if (!tailoredData) return;
    setTailoredData({
      ...tailoredData,
      contact: {
        ...tailoredData.contact,
        [field]: val
      }
    });
  };

  const handleUpdateSummary = (val: string) => {
    if (!tailoredData) return;
    setTailoredData({ ...tailoredData, summary: val });
  };

  const handleUpdateSkills = (val: string) => {
    if (!tailoredData) return;
    setTailoredData({ ...tailoredData, skills: val.split(',').map(s => s.trim()) });
  };

  const handleUpdateEmployment = (index: number, field: string, val: any) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.employment];
    nextList[index] = { ...nextList[index], [field]: val };
    setTailoredData({ ...tailoredData, employment: nextList });
  };

  const handleUpdateEmploymentBullet = (empIdx: number, bulletIdx: number, val: string) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.employment];
    const bullets = [...nextList[empIdx].description];
    bullets[bulletIdx] = val;
    nextList[empIdx] = { ...nextList[empIdx], description: bullets };
    setTailoredData({ ...tailoredData, employment: nextList });
  };

  const handleAddEmploymentBullet = (empIdx: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.employment];
    nextList[empIdx].description.push('');
    setTailoredData({ ...tailoredData, employment: nextList });
  };

  const handleRemoveEmploymentBullet = (empIdx: number, bulletIdx: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.employment];
    nextList[empIdx].description.splice(bulletIdx, 1);
    setTailoredData({ ...tailoredData, employment: nextList });
  };

  const handleAddEmployment = () => {
    if (!tailoredData) return;
    setTailoredData({
      ...tailoredData,
      employment: [...tailoredData.employment, { company: '', title: '', duration: '', description: [''] }]
    });
  };

  const handleRemoveEmployment = (index: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.employment];
    nextList.splice(index, 1);
    setTailoredData({ ...tailoredData, employment: nextList });
  };

  const handleUpdateProject = (index: number, field: string, val: any) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.projects];
    nextList[index] = { ...nextList[index], [field]: val };
    setTailoredData({ ...tailoredData, projects: nextList });
  };

  const handleUpdateProjectBullet = (projIdx: number, bulletIdx: number, val: string) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.projects];
    const bullets = [...nextList[projIdx].description];
    bullets[bulletIdx] = val;
    nextList[projIdx] = { ...nextList[projIdx], description: bullets };
    setTailoredData({ ...tailoredData, projects: nextList });
  };

  const handleAddProjectBullet = (projIdx: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.projects];
    nextList[projIdx].description.push('');
    setTailoredData({ ...tailoredData, projects: nextList });
  };

  const handleRemoveProjectBullet = (projIdx: number, bulletIdx: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.projects];
    nextList[projIdx].description.splice(bulletIdx, 1);
    setTailoredData({ ...tailoredData, projects: nextList });
  };

  const handleAddProject = () => {
    if (!tailoredData) return;
    setTailoredData({
      ...tailoredData,
      projects: [...tailoredData.projects, { title: '', description: [''] }]
    });
  };

  const handleRemoveProject = (index: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.projects];
    nextList.splice(index, 1);
    setTailoredData({ ...tailoredData, projects: nextList });
  };

  const handleUpdateEducation = (index: number, field: string, val: string) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.education];
    nextList[index] = { ...nextList[index], [field]: val };
    setTailoredData({ ...tailoredData, education: nextList });
  };

  const handleAddEducation = () => {
    if (!tailoredData) return;
    setTailoredData({
      ...tailoredData,
      education: [...tailoredData.education, { institution: '', degree: '', details: '' }]
    });
  };

  const handleRemoveEducation = (index: number) => {
    if (!tailoredData) return;
    const nextList = [...tailoredData.education];
    nextList.splice(index, 1);
    setTailoredData({ ...tailoredData, education: nextList });
  };

  const handleUpdateAccomplishments = (val: string) => {
    if (!tailoredData) return;
    setTailoredData({ ...tailoredData, accomplishments: val.split('\n').map(s => s.trim()).filter(Boolean) });
  };

  const handleUpdateLanguages = (val: string) => {
    if (!tailoredData) return;
    setTailoredData({ ...tailoredData, languages: val.split(',').map(s => s.trim()).filter(Boolean) });
  };

  const getFullMarkdown = () => {
    if (!tailoredData) return '';
    return `# ${profileData?.header?.name || session?.user?.name || 'My Name'}
${tailoredData.contact.email} | ${tailoredData.contact.phone} | ${tailoredData.contact.location}
${tailoredData.contact.linkedin ? `LinkedIn: ${tailoredData.contact.linkedin}` : ''} | ${tailoredData.contact.github ? `GitHub: ${tailoredData.contact.github}` : ''} | ${tailoredData.contact.portfolio ? `Portfolio: ${tailoredData.contact.portfolio}` : ''}

## Professional Summary
${tailoredData.summary}

## Technical Skills
${tailoredData.skills.join(', ')}

## Work Experience
${tailoredData.employment.map(emp => `
### ${emp.title} | ${emp.company}
*${emp.duration}*
${emp.description.map(desc => `- ${desc}`).join('\n')}
`).join('\n')}

## Projects
${tailoredData.projects.map(proj => `
### ${proj.title}
${proj.description.map(desc => `- ${desc}`).join('\n')}
`).join('\n')}

## Education
${tailoredData.education.map(edu => `
### ${edu.degree}
*${edu.institution} | ${edu.details}*
`).join('\n')}

${tailoredData.accomplishments.length > 0 ? `
## Certifications & Accomplishments
${tailoredData.accomplishments.map(acc => `- ${acc}`).join('\n')}
` : ''}

${tailoredData.languages.length > 0 ? `
## Languages
- ${tailoredData.languages.join(', ')}
` : ''}
`;
  };

  // GENERATES SINGLE-COLUMN, ATS-FRIENDLY PDF (IFRAME METHOD)
  const generatePdf = () => {
    if (!tailoredData) return;

    const name = profileData?.header?.name || session?.user?.name || 'Candidate Name';
    const email = tailoredData.contact.email;
    const phone = tailoredData.contact.phone;
    const location = tailoredData.contact.location;
    const github = tailoredData.contact.github;
    const linkedin = tailoredData.contact.linkedin;
    const portfolio = tailoredData.contact.portfolio;

    // Contact line formatting
    const contactParts = [
      email,
      phone,
      location,
      linkedin ? 'LinkedIn: ' + linkedin : '',
      github ? 'GitHub: ' + github : '',
      portfolio ? 'Portfolio: ' + portfolio : ''
    ].filter(Boolean);
    const contactLineHtml = contactParts.join(' &nbsp;•&nbsp; ');

    const skillsHtml = tailoredData.skills.join(', ');
    
    const employmentHtml = tailoredData.employment.map(emp => {
      const bulletsHtml = emp.description.map(desc => '<li>' + desc + '</li>').join('');
      return `
        <div class="item">
          <div class="item-header">
            <span>${emp.title}</span>
            <span class="date">${emp.duration}</span>
          </div>
          <div class="item-sub">${emp.company}</div>
          <ul>
            ${bulletsHtml}
          </ul>
        </div>
      `;
    }).join('');

    const projectsHtml = tailoredData.projects.map(proj => {
      const bulletsHtml = proj.description.map(desc => '<li>' + desc + '</li>').join('');
      return `
        <div class="item">
          <div class="item-header">
            <span>${proj.title}</span>
          </div>
          <ul>
            ${bulletsHtml}
          </ul>
        </div>
      `;
    }).join('');

    const educationHtml = tailoredData.education.map(edu => `
      <div class="item" style="margin-bottom: 6px;">
        <div class="item-header">
          <span>${edu.degree}</span>
          <span class="date">${edu.details}</span>
        </div>
        <div class="item-sub">${edu.institution}</div>
      </div>
    `).join('');

    const accomplishmentsHtml = tailoredData.accomplishments.length > 0 
      ? `
        <h2>Certifications & Accomplishments</h2>
        <ul>
          ${tailoredData.accomplishments.map(acc => '<li>' + acc + '</li>').join('')}
        </ul>
      ` 
      : '';

    const languagesHtml = tailoredData.languages.length > 0
      ? `
        <h2>Languages</h2>
        <div style="margin-bottom: 10px;">
          ${tailoredData.languages.join(', ')}
        </div>
      `
      : '';

    // Create a hidden iframe inside the same page context
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      alert("Failed to generate PDF. Please try again.");
      document.body.removeChild(iframe);
      return;
    }

    doc.write(`
      <html>
        <head>
          <title>${name} - Resume</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 20mm 15mm 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.45;
              color: #111111;
              padding: 0;
              margin: 0;
              font-size: 12.5px;
            }
            .header {
              text-align: center;
              margin-bottom: 12px;
            }
            .name {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000000;
            }
            .contact {
              font-size: 10.5px;
              color: #333333;
              margin: 0;
            }
            h2 {
              font-size: 13px;
              font-weight: bold;
              border-bottom: 1.5px solid #111111;
              padding-bottom: 2px;
              margin-top: 15px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000000;
            }
            .item {
              margin-bottom: 10px;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              color: #000000;
            }
            .item-sub {
              font-style: italic;
              color: #333333;
              font-size: 11.5px;
              margin-bottom: 3px;
            }
            .date {
              font-weight: bold;
              font-size: 11px;
              color: #333333;
            }
            ul {
              margin: 0 0 4px 0;
              padding-left: 18px;
            }
            li {
              margin-bottom: 3px;
              text-align: justify;
            }
            .summary {
              text-align: justify;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="name">${name}</h1>
            <p class="contact">${contactLineHtml}</p>
          </div>

          <h2>Professional Summary</h2>
          <div class="summary">
            ${tailoredData.summary}
          </div>

          <h2>Technical Skills</h2>
          <div style="margin-bottom: 10px;">
            ${skillsHtml}
          </div>

          <h2>Professional Experience</h2>
          ${employmentHtml}

          <h2>Key Projects</h2>
          ${projectsHtml}

          <h2>Education</h2>
          ${educationHtml}

          ${accomplishmentsHtml}
          ${languagesHtml}
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing safely from the iframe window context
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove iframe from DOM after printing dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const downloadTextFile = () => {
    const content = getFullMarkdown();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tailored_Resume_${selectedJob.company_raw.replace(/\s+/g, '_')}_${selectedJob.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPhaseText = () => {
    switch (loadingPhase) {
      case 0: return "Reading original resume & details...";
      case 1: return "Analyzing target job requirements...";
      case 2: return "Aligning your experience bullet points with keywords...";
      case 3: return "Generating tailored professional summary...";
      default: return "Tailoring your resume...";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Resume Tailoring</h3>
              <p className="text-xs text-slate-500 font-medium">
                Optimize and edit your accomplishments for {selectedJob.title} at {selectedJob.company_raw}
              </p>
            </div>
          </div>
          <button 
            onClick={closeModal} 
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-rose-700/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* 1. Resume selection/upload state (when not tailored yet) */}
          {!tailoring && !tailoredData && (
            <div className="space-y-6 max-w-xl mx-auto py-8">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Tailor your resume for this role</h4>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  Our AI matches your experiences directly with the job description keywords to bypass Applicant Tracking Systems (ATS) and catch hiring managers' eyes.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Your Base Resume</span>
                  {profileData?.resumeUrl && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Change File
                    </button>
                  )}
                </div>

                {profileData?.resumeUrl ? (
                  <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {profileData.resumeName || "Uploaded Resume"}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">Ready to tailor</p>
                    </div>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-full">
                      <Check className="w-4 h-4" />
                    </span>
                  </div>
                ) : (
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleUploadResume}
                      accept=".pdf,.docx" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/10 p-8 rounded-xl transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                          <p className="text-sm font-bold text-slate-700 mt-2">Uploading resume...</p>
                          <p className="text-xs text-slate-400 font-semibold">Adding to your profile secure storage</p>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Click to upload your resume</p>
                          <p className="text-xs text-slate-400 font-semibold">Supports PDF and Word formats up to 10MB</p>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleTailorResume}
                disabled={!profileData?.resumeUrl || uploading}
                className="w-full py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Tailor Resume with AI
              </button>
            </div>
          )}

          {/* 2. Loading Phase Animator */}
          {tailoring && (
            <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-pulse">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-50"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-800">Generating tailored copy</h4>
                <div className="h-5 overflow-hidden relative w-full">
                  <p className="text-sm text-slate-500 font-semibold text-center transition-all duration-500">
                    {getPhaseText()}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <span 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      idx === loadingPhase ? 'bg-blue-600 scale-125' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Results Tabbed View (EDITABLE) */}
          {tailoredData && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Tab selector */}
              <div className="lg:col-span-1 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 border-slate-100 lg:pr-2">
                <button 
                  onClick={() => setActiveTab('contact')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'contact' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact Info
                </button>
                <button 
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'summary' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Summary
                </button>
                <button 
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'skills' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Skills
                </button>
                <button 
                  onClick={() => setActiveTab('experience')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'experience' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Experience
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'projects' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4" />
                  Projects
                </button>
                <button 
                  onClick={() => setActiveTab('education')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'education' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Education
                </button>
                <button 
                  onClick={() => setActiveTab('accomplishments')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 shrink-0 ${
                    activeTab === 'accomplishments' 
                      ? 'bg-blue-50 text-[#2563eb] shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Honors & Languages
                </button>
              </div>

              {/* Tab details container (EDIT PANEL) */}
              <div className="lg:col-span-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 min-h-[420px] flex flex-col justify-between">
                
                {/* 1. CONTACT INFO TAB */}
                {activeTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Contact Information</h4>
                      <span className="text-xs text-slate-400">Prefilled from resume / profile</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">Email Address</label>
                        <input 
                          type="email" 
                          value={tailoredData.contact.email} 
                          onChange={(e) => handleUpdateContact('email', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">Phone Number</label>
                        <input 
                          type="text" 
                          value={tailoredData.contact.phone} 
                          onChange={(e) => handleUpdateContact('phone', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">Location (City, Country)</label>
                        <input 
                          type="text" 
                          value={tailoredData.contact.location} 
                          onChange={(e) => handleUpdateContact('location', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Bangalore, India"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">LinkedIn Profile URL</label>
                        <input 
                          type="text" 
                          value={tailoredData.contact.linkedin} 
                          onChange={(e) => handleUpdateContact('linkedin', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">GitHub Profile URL</label>
                        <input 
                          type="text" 
                          value={tailoredData.contact.github} 
                          onChange={(e) => handleUpdateContact('github', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="github.com/username"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500">Portfolio Website URL</label>
                        <input 
                          type="text" 
                          value={tailoredData.contact.portfolio} 
                          onChange={(e) => handleUpdateContact('portfolio', e.target.value)}
                          className="w-full text-sm font-medium text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="myportfolio.dev"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SUMMARY TAB */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Professional Summary</h4>
                      <span className="text-xs text-slate-400">Click below to refine AI text</span>
                    </div>
                    <textarea 
                      value={tailoredData.summary}
                      onChange={(e) => handleUpdateSummary(e.target.value)}
                      className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4.5 leading-relaxed shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[220px]"
                      placeholder="Write a brief professional summary..."
                    />
                  </div>
                )}

                {/* 3. SKILLS TAB */}
                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Skills List</h4>
                      <span className="text-xs text-slate-400">Separate values with commas</span>
                    </div>
                    <textarea 
                      value={tailoredData.skills.join(', ')}
                      onChange={(e) => handleUpdateSkills(e.target.value)}
                      className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4.5 leading-relaxed shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[160px]"
                      placeholder="React, Next.js, Node.js..."
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {tailoredData.skills.filter(Boolean).map((skill) => (
                        <span 
                          key={skill} 
                          className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. WORK EXPERIENCE TAB */}
                {activeTab === 'experience' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Work Experience</h4>
                      <button 
                        onClick={handleAddEmployment}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Position
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                      {tailoredData.employment.map((emp, empIdx) => (
                        <div key={empIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative">
                          <button 
                            onClick={() => handleRemoveEmployment(empIdx)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-all p-1 hover:bg-slate-50 rounded-lg"
                            title="Delete Position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Role Title</label>
                              <input 
                                type="text"
                                value={emp.title}
                                onChange={(e) => handleUpdateEmployment(empIdx, 'title', e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                                placeholder="Software Engineer"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                              <input 
                                type="text"
                                value={emp.company}
                                onChange={(e) => handleUpdateEmployment(empIdx, 'company', e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                                placeholder="Tech Corp"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                              <input 
                                type="text"
                                value={emp.duration}
                                onChange={(e) => handleUpdateEmployment(empIdx, 'duration', e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                                placeholder="June 2024 - Present"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Bullet Points</label>
                              <button 
                                onClick={() => handleAddEmploymentBullet(empIdx)}
                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" /> Add Bullet
                              </button>
                            </div>
                            <div className="space-y-2">
                              {emp.description.map((bullet, bulletIdx) => (
                                <div key={bulletIdx} className="flex items-center gap-2">
                                  <textarea 
                                    value={bullet}
                                    onChange={(e) => handleUpdateEmploymentBullet(empIdx, bulletIdx, e.target.value)}
                                    className="flex-1 text-xs text-slate-600 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none min-h-[40px] resize-y"
                                    placeholder="Write accomplishment bullet point..."
                                  />
                                  <button 
                                    onClick={() => handleRemoveEmploymentBullet(empIdx, bulletIdx)}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. PROJECTS TAB */}
                {activeTab === 'projects' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Key Projects</h4>
                      <button 
                        onClick={handleAddProject}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Project
                      </button>
                    </div>

                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                      {tailoredData.projects.map((proj, projIdx) => (
                        <div key={projIdx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative">
                          <button 
                            onClick={() => handleRemoveProject(projIdx)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-all p-1 hover:bg-slate-50 rounded-lg"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Project Title</label>
                            <input 
                              type="text"
                              value={proj.title}
                              onChange={(e) => handleUpdateProject(projIdx, 'title', e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                              placeholder="Project Name / Website"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Project Highlights</label>
                              <button 
                                onClick={() => handleAddProjectBullet(projIdx)}
                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" /> Add Highlight
                              </button>
                            </div>
                            <div className="space-y-2">
                              {proj.description.map((bullet, bulletIdx) => (
                                <div key={bulletIdx} className="flex items-center gap-2">
                                  <textarea 
                                    value={bullet}
                                    onChange={(e) => handleUpdateProjectBullet(projIdx, bulletIdx, e.target.value)}
                                    className="flex-1 text-xs text-slate-600 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none min-h-[40px] resize-y"
                                    placeholder="Write project highlight..."
                                  />
                                  <button 
                                    onClick={() => handleRemoveProjectBullet(projIdx, bulletIdx)}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. EDUCATION TAB */}
                {activeTab === 'education' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Edit Education</h4>
                      <button 
                        onClick={handleAddEducation}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add School
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                      {tailoredData.education.map((edu, eduIdx) => (
                        <div key={eduIdx} className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 relative pt-8 md:pt-4">
                          <button 
                            onClick={() => handleRemoveEducation(eduIdx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 transition-all p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Institution Name</label>
                            <input 
                              type="text"
                              value={edu.institution}
                              onChange={(e) => handleUpdateEducation(eduIdx, 'institution', e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                              placeholder="Stanford University"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Degree obtained</label>
                            <input 
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleUpdateEducation(eduIdx, 'degree', e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                              placeholder="B.S. in Computer Science"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Graduation / Details</label>
                            <input 
                              type="text"
                              value={edu.details}
                              onChange={(e) => handleUpdateEducation(eduIdx, 'details', e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2 focus:border-blue-500 outline-none"
                              placeholder="Graduated 2024 / GPA: 3.9"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. ACCOMPLISHMENTS TAB */}
                {activeTab === 'accomplishments' && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Certifications & Honors</h4>
                        <span className="text-xs text-slate-400">One item per line</span>
                      </div>
                      <textarea 
                        value={tailoredData.accomplishments.join('\n')}
                        onChange={(e) => handleUpdateAccomplishments(e.target.value)}
                        className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-4 leading-relaxed shadow-sm focus:border-blue-500 outline-none min-h-[140px]"
                        placeholder="Certified AWS Solutions Architect&#10;Google Analytics Certification..."
                      />
                    </div>
                    <div className="space-y-3 border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">Languages Spoken</h4>
                        <span className="text-xs text-slate-400">Separate with commas</span>
                      </div>
                      <input 
                        type="text"
                        value={tailoredData.languages.join(', ')}
                        onChange={(e) => handleUpdateLanguages(e.target.value)}
                        className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-3 shadow-sm focus:border-blue-500 outline-none"
                        placeholder="English, Spanish, Hindi..."
                      />
                    </div>
                  </div>
                )}

                {/* Footnote indicating that edits sync to the download */}
                <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Edits made here are reflected live in your PDF and Markdown downloads.</span>
                  <button 
                    onClick={() => {
                      const text = activeTab === 'summary' ? tailoredData.summary 
                                : activeTab === 'skills' ? tailoredData.skills.join(', ')
                                : activeTab === 'experience' ? tailoredData.employment.map(emp => `### ${emp.title} | ${emp.company}\n*${emp.duration}*\n${emp.description.map(d => `- ${d}`).join('\n')}`).join('\n\n')
                                : tailoredData.projects.map(p => `### ${p.title}\n${p.description.map(d => `- ${d}`).join('\n')}`).join('\n\n');
                      copyToClipboard(text, activeTab);
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Active Section
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions (when result is present) */}
        {tailoredData && (
          <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <button 
              onClick={handleTailorResume}
              className="px-4.5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Tailor
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => copyToClipboard(getFullMarkdown(), 'Full Resume')}
                className="px-5 py-2.5 border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> 
                {copiedSection === 'Full Resume' ? 'Copied Full!' : 'Copy Full (MD)'}
              </button>
              
              <button 
                onClick={downloadTextFile}
                className="px-5 py-2.5 border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download (.md)
              </button>

              <button 
                onClick={generatePdf}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <FileText className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
