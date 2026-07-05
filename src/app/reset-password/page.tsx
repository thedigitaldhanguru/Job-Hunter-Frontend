'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Briefcase, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Missing reset token. Please request a new link.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white border border-[#e2e8f0] p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50">
      
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Set New Password</h2>
        <p className="text-sm text-slate-500">
          Please enter your new password below.
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <div>
            <h3 className="font-bold text-emerald-900 text-lg">Password Reset Successfully</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Redirecting you to login...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="At least 8 characters" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
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

          <button 
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                Update Password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="hiredeck min-h-screen bg-white text-[#0f172a] font-sans antialiased flex flex-col">
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
          <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900">Back to Login</Link>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center p-8">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-500" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
