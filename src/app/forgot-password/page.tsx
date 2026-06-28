'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate sending reset link
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
          <Link href="/login" className="text-sm font-semibold text-[#2563eb] hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </header>

      {/* Center Layout Container */}
      <div className="flex-grow flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white border border-[#e2e8f0] p-8 sm:p-10 rounded-3xl shadow-lg shadow-slate-100/50 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner mx-auto mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Reset password</h2>
            <p className="text-sm text-slate-500">
              We'll send you a secure link to reset your password.
            </p>
          </div>

          {isSent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-emerald-800 text-base">Check your inbox</h3>
              <p className="text-xs text-emerald-600 leading-relaxed">
                We've sent password reset instructions to <strong>{email}</strong>. Please check your email.
              </p>
              <button 
                onClick={() => setIsSent(false)}
                className="text-xs font-bold text-[#2563eb] hover:underline pt-2 block mx-auto"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Email address</label>
                <input 
                  type="email" 
                  placeholder="you@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm outline-none focus:border-[#2563eb] transition-all placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link href="/login" className="text-xs font-bold text-[#2563eb] hover:underline">
              Return to log in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
