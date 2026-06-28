'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Eye, EyeOff, Star, ArrowRight, Loader2 } from 'lucide-react';
import { signIn } from "next-auth/react";

export default function HiredeckLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        action: 'login',
        redirect: false,
      });
      
      if (res?.error) {
        alert(res.error);
      } else if (res?.ok) {
        window.location.href = '/'; 
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="hiredeck min-h-screen bg-white text-[#0f172a] font-sans antialiased flex flex-col">
      {/* Site Header */}
      <header className="w-full border-b border-[#e2e8f0] bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0a4fcd] to-[#051949] flex items-center justify-center shadow-md">
              <Briefcase className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#0f172a]">
              hire<span className="text-[#f97316]">deck</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Jobs</Link>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Companies</Link>
            <Link href="/register" className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full text-sm font-semibold shadow-sm transition-all active:scale-[0.98]">Register</Link>
          </div>
        </div>
      </header>

      {/* Main split-screen grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Form */}
        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-md space-y-8">
            
            {/* Logo and Greeting */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center shadow-md">
                  <Briefcase className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-bold text-lg text-[#0f172a]">hire<span className="text-[#f97316]">deck</span></span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500">
                Log in to continue applying, tracking and growing your career.
              </p>
            </div>

            {/* Social logins */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-4 border border-[#e2e8f0] rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.85-2.2 2.2l3.4 2.64c2-1.84 3.85-5.06 3.85-8.69z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.4-2.64c-.95.63-2.16 1.01-4.53 1.01-3.48 0-6.42-2.35-7.47-5.5H1.05v2.85C3.03 21.92 7.23 24 12 24z"/><path fill="#FBBC05" d="M4.53 13.96c-.27-.8-.42-1.66-.42-2.54s.15-1.74.42-2.54V6.03H1.05C.38 7.37 0 9.15 0 11s.38 3.63 1.05 4.97l3.48-2.01z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.4-3.4C17.93 1.19 15.24 0 12 0 7.23 0 3.03 2.08 1.05 6.03l3.48 2.85c1.05-3.15 3.99-5.5 7.47-5.5z"/></svg>
                    Google
                  </>
                )}
              </button>
              <button 
                disabled={isLoading || isGoogleLoading}
                className="flex items-center justify-center gap-2 py-2.5 px-4 border border-[#e2e8f0] rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.93-14.38-6.19-3.48-2.82-7.36-7.59-11.62-14.3-4.85-7.62-9.1-16.73-12.76-27.32-3.66-10.59-5.48-20.91-5.48-30.97 0-14.88 3.79-27.2 11.37-36.93 7.58-9.74 17.07-14.65 28.48-14.75 4.34 0 9.38 1.34 15.12 4 5.73 2.67 9.4 4 11 4 1.22 0 4.98-1.33 11.3-4 6.33-2.66 11.37-3.9 15.12-3.7 13 .84 23.36 5.82 31.06 14.95-10.85 6.64-16.14 15.54-15.86 26.68.28 8.92 3.51 16.3 9.68 22.12 6.17 5.83 13.56 9.07 22.17 9.71-2.58 7.58-5.91 14.92-10.01 22zM119.22 19c0-7.31 2.61-14.15 7.82-20.52 1.35-1.65 2.87-3.19 4.56-4.63.48-.39.87-.24.78.37-1.42 10.22-5.72 19.14-12.89 26.77-1.47 1.58-3.08 3.02-4.82 4.31-.49.37-.87.21-.78-.37.91-3.97 1.33-7.97 1.33-11.94z"/></svg>
                Apple
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e8f0]"></div>
              </div>
              <span className="relative px-3 bg-white text-xs font-semibold uppercase tracking-wider text-slate-400">
                or login with email
              </span>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Email</label>
                <input 
                  type="email" 
                  placeholder="you@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isGoogleLoading}
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm outline-none focus:border-[#2563eb] transition-all placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#2563eb] hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="w-full px-4 py-3 pr-10 border border-[#e2e8f0] rounded-xl text-sm outline-none focus:border-[#2563eb] transition-all placeholder:text-slate-300 disabled:opacity-50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                />
                <label htmlFor="remember" className="ml-2 block text-xs font-medium text-slate-500 cursor-pointer">
                  Keep me logged in for 30 days
                </label>
              </div>

              <button 
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    Log in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                New to hiredeck?{' '}
                <Link href="/register" className="font-semibold text-[#2563eb] hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Hero graphic */}
        <div className="hidden lg:flex flex-col justify-between bg-[image:var(--hd-gradient-hero)] text-white p-16 relative overflow-hidden">
          <div className="absolute inset-0 hd-dots-overlay opacity-60 pointer-events-none" />
          
          <div className="flex justify-end">
            <span className="px-4 py-1.5 bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-xs font-bold rounded-full text-blue-100 shadow-sm uppercase tracking-wider">
              42,500+ openings this week
            </span>
          </div>

          <div className="space-y-6 max-w-lg z-10">
            <h3 className="text-5xl font-extrabold tracking-tight leading-tight">
              Your next role is <br/>
              one login away.
            </h3>
            <p className="text-base text-blue-100/80 leading-relaxed">
              Pick up where you left off — saved jobs, applications, and recruiter messages all in one place.
            </p>
          </div>

          {/* Stats footer row */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8 z-10">
            <div>
              <div className="text-2xl font-extrabold">2M+</div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold mt-1">Job Seekers</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold">12k+</div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold mt-1">Companies</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold flex items-center gap-0.5">
                4.7<Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400 stroke-none" />
              </div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold mt-1">Avg Rating</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
