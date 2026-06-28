'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Code, Paintbrush, BarChart3, Megaphone, TrendingUp, Box, 
  DollarSign, Activity, Search, Sparkles, ArrowRight, ArrowLeft 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface SpecializationItem {
  id: string;
  title: string;
  description: string;
  category: 'Tech' | 'Design & Creative' | 'Business' | 'Operations';
  skills: string[];
  openRoles: string;
  avgPay: string;
  trend: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function SpecializationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Tech' | 'Design & Creative' | 'Business' | 'Operations'>('All');

  const specializations: SpecializationItem[] = [
    {
      id: 'spec-1',
      title: 'Engineering',
      description: 'Build the systems and products powering modern companies — from web apps to distributed backends.',
      category: 'Tech',
      skills: ['React', 'Node.js', 'Python', 'Go'],
      openRoles: '1,240',
      avgPay: '₹18-45 LPA',
      trend: '+24%',
      icon: Code,
      color: 'from-blue-500/15 to-blue-500/5 text-[#2563eb]'
    },
    {
      id: 'spec-2',
      title: 'Design',
      description: 'Shape end-to-end product experiences — from research and prototypes to polished design systems.',
      category: 'Design & Creative',
      skills: ['Figma', 'Prototyping', 'Design Systems', 'UX Research'],
      openRoles: '320',
      avgPay: '₹12-32 LPA',
      trend: '+18%',
      icon: Paintbrush,
      color: 'from-rose-500/15 to-rose-500/5 text-rose-600'
    },
    {
      id: 'spec-3',
      title: 'Data',
      description: 'Turn raw data into decisions — analytics, ML models and the platforms that serve them at scale.',
      category: 'Tech',
      skills: ['Python', 'SQL', 'Pandas', 'PyTorch'],
      openRoles: '480',
      avgPay: '₹16-40 LPA',
      trend: '+32%',
      icon: BarChart3,
      color: 'from-amber-500/15 to-amber-500/5 text-amber-600'
    },
    {
      id: 'spec-4',
      title: 'Marketing',
      description: 'Drive brand growth, user acquisition campaigns, and market positioning tactics.',
      category: 'Business',
      skills: ['SEO', 'SEM', 'Copywriting', 'Paid Ads'],
      openRoles: '560',
      avgPay: '₹10-22 LPA',
      trend: '+14%',
      icon: Megaphone,
      color: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600'
    },
    {
      id: 'spec-5',
      title: 'Sales',
      description: 'Accelerate business revenue pipelines and maintain key client accounts.',
      category: 'Business',
      skills: ['Enterprise Sales', 'CRM', 'Negotiation', 'B2B'],
      openRoles: '720',
      avgPay: '₹12-25 LPA',
      trend: '+11%',
      icon: TrendingUp,
      color: 'from-purple-500/15 to-purple-500/5 text-purple-600'
    },
    {
      id: 'spec-6',
      title: 'Product',
      description: 'Own product lifecycles, coordinate releases, and define strategy roadmaps.',
      category: 'Design & Creative',
      skills: ['Agile', 'Roadmapping', 'Jira', 'User Stories'],
      openRoles: '290',
      avgPay: '₹15-35 LPA',
      trend: '+22%',
      icon: Box,
      color: 'from-cyan-500/15 to-cyan-500/5 text-cyan-600'
    },
    {
      id: 'spec-7',
      title: 'Finance',
      description: 'Oversee commercial budgeting, financial statement audits, and tax strategy.',
      category: 'Business',
      skills: ['Accounting', 'Excel', 'Valuation', 'Taxation'],
      openRoles: '140',
      avgPay: '₹10-24 LPA',
      trend: '+15%',
      icon: DollarSign,
      color: 'from-indigo-500/15 to-indigo-500/5 text-indigo-600'
    },
    {
      id: 'spec-8',
      title: 'Operations',
      description: 'Streamline day-to-day corporate logistics, vendor pipelines, and team syncs.',
      category: 'Operations',
      skills: ['Logistics', 'Process Optimization', 'Vendor Relations', 'Slack'],
      openRoles: '180',
      avgPay: '₹8-16 LPA',
      trend: '+8%',
      icon: Activity,
      color: 'from-teal-500/15 to-teal-500/5 text-teal-600'
    }
  ];

  // Category statistics helper
  const getCatCount = (catName: string) => {
    if (catName === 'All') return specializations.length;
    return specializations.filter(s => s.category === catName).length;
  };

  // Filtering list
  const filtered = specializations.filter(spec => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = spec.title.toLowerCase().includes(q);
      const matchDesc = spec.description.toLowerCase().includes(q);
      const matchSkills = spec.skills.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSkills) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && spec.category !== selectedCategory) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ================= HERO HEADER ================= */}
      <section className="bg-[image:var(--hd-gradient-hero)] text-white relative overflow-hidden py-12 sm:py-16 lg:py-20 w-full">
        {/* Background Dot Overlays */}
        <div className="absolute inset-0 hd-dots-overlay opacity-80 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          
          {/* Breadcrumb */}
          <div className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Specializations</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-[11px] font-bold text-blue-100 shadow-sm uppercase tracking-wider">
              {specializations.length} specializations · 4,200+ open roles
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Find a domain that <span className="text-[#f97316]">fits your craft</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-100/70 font-semibold max-w-2xl leading-relaxed">
              Browse openings by the work you actually want to do. Each specialization shows live roles, top skills and what the market pays.
            </p>
          </div>

          {/* Large search input */}
          <div className="bg-white rounded-2xl p-1.5 shadow-xl flex items-center max-w-[500px] border border-blue-500/20 text-slate-800">
            <div className="flex-grow flex items-center pl-4 py-2.5">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search specializations, roles or skills" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-sm font-semibold placeholder-slate-400" 
              />
            </div>
          </div>

        </div>
      </section>

      {/* ================= CATEGORIES FILTER BUTTONS ================= */}
      <section className="bg-white border-b border-[#e2e8f0] py-5 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Tech', 'Design & Creative', 'Business', 'Operations'] as const).map(catName => {
              const active = selectedCategory === catName;
              return (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    active 
                      ? 'bg-[#0a4fcd] text-white shadow-md' 
                      : 'bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{catName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {getCatCount(catName)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SPECIALIZATIONS GRID ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-3xl shadow-sm">
            <p className="text-slate-400 font-semibold text-sm">No specializations found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(spec => {
              const IconComp = spec.icon;
              return (
                <article 
                  key={spec.id}
                  className="bg-white border border-[#e2e8f0] rounded-3xl p-6 hover:shadow-md hover:border-[#2563eb]/20 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: icon & growth tag */}
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${spec.color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center shadow-inner`}>
                        <IconComp className="w-5.5 h-5.5" />
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        {spec.trend}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-lg leading-tight group-hover:text-[#2563eb] transition-colors">
                        {spec.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        {spec.description}
                      </p>
                    </div>

                    {/* Skill Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {spec.skills.map(skill => (
                        <span key={skill} className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-lg text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Roles</div>
                        <div className="text-sm font-extrabold text-slate-800 mt-0.5">{spec.openRoles}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Pay</div>
                        <div className="text-sm font-extrabold text-slate-800 mt-0.5">{spec.avgPay}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => router.push(`/jobs?query=${spec.title}`)}
                      className="w-full py-2.5 bg-blue-50 border border-blue-100 text-[#2563eb] font-bold rounded-xl text-xs hover:bg-[#2563eb] hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      Browse {spec.title} jobs
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ================= NOT SURE WHERE YOU FIT BANNER ================= */}
        <section className="bg-gradient-to-r from-[#0a4fcd] to-[#051949] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-blue-900/50 shadow-md">
          <div className="absolute inset-0 hd-grid-overlay opacity-20 pointer-events-none" />
          <div className="space-y-3 z-10 text-center lg:text-left max-w-xl">
            <span className="px-2.5 py-0.5 bg-white/10 ring-1 ring-white/20 rounded-md text-[9px] font-bold uppercase tracking-wider">
              For candidates
            </span>
            <h3 className="font-extrabold text-2xl sm:text-3xl leading-snug">Not sure where you fit?</h3>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed font-semibold">
              Upload your resume and we'll surface specializations and roles matched to your experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 z-10 shrink-0">
            <button 
              onClick={() => router.push('/profile')}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-[#2563eb] font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              Upload resume
              <ArrowRight className="w-4 h-4 text-[#2563eb]" />
            </button>
            <button 
              onClick={() => router.push('/jobs')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              Browse all jobs (8+)
            </button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
