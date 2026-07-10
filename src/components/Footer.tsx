'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Hide the footer on full-screen login / register screens
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <footer className="bg-[#0b0f19] border-t border-slate-900 text-slate-400 py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8">
          {/* Tagline */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0a4fcd] to-[#051949] flex items-center justify-center shadow-md">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                hire<span className="text-[#f97316]">deck</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Curated jobs from India's top product companies and global startups. Skip the noise.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              {['Tw', 'In', 'Yt', 'Li'].map(social => (
                <span 
                  key={social} 
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:bg-white/10 cursor-pointer transition-colors shadow-sm"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {[
            {
              title: 'For Seekers',
              links: [
                { label: 'Search Jobs', href: '/jobs' },
                { label: 'Browse Companies', href: '/companies' },
                { label: 'Browse Salaries', href: '#' },
                { label: 'Help Center', href: '#' }
              ]
            },
            {
              title: 'For Employers',
              links: [
                { label: 'Post a job', href: '#' },
                { label: 'Browse Resumes', href: '#' },
                { label: 'Employer Brands', href: '#' },
                { label: 'Recruitment Software', href: '#' }
              ]
            },
            {
              title: 'Company',
              links: [
                { label: 'About Us', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press & Media', href: '#' },
                { label: 'Contact support', href: '#' }
              ]
            },
            {
              title: 'Resources',
              links: [
                { label: 'Career Advice', href: '#' },
                { label: 'Resume Builder', href: '#' },
                { label: 'Interview Prep', href: '#' },
                { label: 'Salary Insights', href: '#' }
              ]
            }
          ].map(col => (
            <div key={col.title} className="space-y-4 border-b border-slate-900/60 pb-4 md:border-b-0 md:pb-0">
              <h4 
                onClick={() => toggleSection(col.title)}
                className="text-xs font-bold uppercase tracking-[0.16em] text-white flex items-center justify-between cursor-pointer md:cursor-default"
              >
                <span>{col.title}</span>
                <span className="md:hidden text-slate-500 text-base font-normal leading-none select-none">
                  {openSections[col.title] ? '−' : '+'}
                </span>
              </h4>
              <ul className={`space-y-2 text-sm text-slate-500 md:block ${openSections[col.title] ? 'block' : 'hidden'}`}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>&copy; {currentYear} hiredeck Pro. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}