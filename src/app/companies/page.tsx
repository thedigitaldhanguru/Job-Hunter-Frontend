'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, Star, Search, MapPin, ArrowRight, Sparkles 
} from 'lucide-react';
import { useJobsStore } from '@/store/useJobsStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CompaniesPage() {
  const router = useRouter();
  const { setSearchQuery } = useJobsStore();
  const [searchTerm, setSearchTerm] = useState('');

  const companiesList = [
    { name: 'Stripe', logoText: 'S', logoBg: 'bg-indigo-100 text-indigo-600', rating: '4.7', reviews: '1.2k reviews', loc: 'Bengaluru / Remote', jobs: '24 active jobs', category: 'Fintech · Unicorn', desc: 'Providing global developer-first financial infrastructure.' },
    { name: 'Linear', logoText: 'L', logoBg: 'bg-purple-100 text-purple-600', rating: '4.8', reviews: '680 reviews', loc: 'Remote Only', jobs: '12 active jobs', category: 'Software · Startup', desc: 'Building toolsets to streamline project workflows.' },
    { name: 'Swiggy', logoText: 'S', logoBg: 'bg-orange-100 text-orange-600', rating: '4.2', reviews: '3.4k reviews', loc: 'Bengaluru / Hyderabad', jobs: '56 active jobs', category: 'E-commerce · MNC', desc: 'On-demand food and convenience delivery network.' },
    { name: 'Microsoft', logoText: 'M', logoBg: 'bg-blue-100 text-blue-600', rating: '4.5', reviews: '12k reviews', loc: 'Bengaluru / Hybrid', jobs: '98 active jobs', category: 'Product · MNC', desc: 'Empowering people and organizations to achieve more.' },
    { name: 'Amazon', logoText: 'A', logoBg: 'bg-red-100 text-red-600', rating: '3.9', reviews: '24k reviews', loc: 'Bengaluru / On-site', jobs: '213 active jobs', category: 'Product · MNC', desc: 'Focusing on e-commerce, cloud computing and digital streaming.' },
    { name: 'Flipkart', logoText: 'F', logoBg: 'bg-emerald-100 text-emerald-600', rating: '4.1', reviews: '8k reviews', loc: 'Bengaluru / Hybrid', jobs: '76 active jobs', category: 'Retail · MNC', desc: 'India\'s leading home-grown online marketplace.' }
  ];

  const handleCompanyClick = (name: string) => {
    setSearchQuery(name);
    router.push('/jobs');
  };

  const filteredCompanies = companiesList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased flex flex-col">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-[image:var(--hd-gradient-hero)] text-white relative overflow-hidden py-14 w-full">
        <div className="absolute inset-0 hd-dots-overlay opacity-60 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-bold uppercase tracking-wider mx-auto">
            <Sparkles className="w-3.5 h-3.5 fill-orange-400" />
            Top employers leaderboard
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Explore Top Employers</h1>
          <p className="text-sm sm:text-base text-blue-100/80 max-w-lg mx-auto">
            Review growth ratings, active openings, and worker reviews. Find your dream workplace today.
          </p>

          {/* Search strip */}
          <div className="bg-white rounded-xl p-1.5 shadow-lg flex items-center max-w-md mx-auto border border-blue-500/20 text-slate-800">
            <Search className="w-4.5 h-4.5 text-slate-400 ml-3.5 shrink-0" />
            <input 
              type="text" 
              placeholder="Search companies by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full text-sm font-semibold px-2.5 py-2 placeholder-slate-400" 
            />
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow space-y-10">
        <div className="border-b border-[#e2e8f0] pb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Brands ({filteredCompanies.length})</h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sorted by Rank</span>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl">
            <p className="text-slate-400 font-semibold text-sm">No companies found matching your search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((c, i) => (
              <div 
                key={c.name}
                onClick={() => handleCompanyClick(c.name)}
                className="bg-white border border-[#e2e8f0] rounded-2xl p-6 hover:shadow-md hover:border-[#2563eb]/20 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Top Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-xl font-bold flex items-center justify-center shadow-inner text-lg ${c.logoBg}`}>
                        {c.logoText}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-[17px] group-hover:text-[#2563eb] transition-colors">{c.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-slate-700">{c.rating}</span>
                          <span>({c.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-300">#0{i + 1}</span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400 pt-2">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 opacity-60" /> {c.loc}</div>
                    <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 opacity-60" /> {c.category}</div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">{c.jobs}</span>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#2563eb] group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
