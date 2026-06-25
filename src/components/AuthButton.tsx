'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { signIn } from "next-auth/react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        email,
        password,
        action: isLogin ? 'login' : 'register',
        redirect: false,
      });
      
      if (res?.error) {
        alert(res.error);
      } else if (res?.ok) {
        window.location.href = '/'; 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4 sm:mt-8 relative z-10">
      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--kindling-border)] p-8 sm:p-10 relative overflow-hidden transition-all duration-300">
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-4xl sm:text-5xl font-normal tracking-tight text-[var(--kindling-ink)] leading-none" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              {isLogin ? 'Welcome back' : 'Join us'}
            </h2>
            <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
              {isLogin ? 'Sign in to access your tailored job matches.' : 'Start discovering your next career move.'}
            </p>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-4 rounded-full shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-[11px] font-semibold tracking-wider uppercase text-slate-400">or with email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--kindling-ink)] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    required 
                    placeholder="name@company.com" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full py-3.5 pl-11 pr-4 outline-none focus:bg-white focus:border-[var(--kindling-ink)] focus:ring-1 focus:ring-[var(--kindling-ink)] transition-all placeholder:text-slate-400 text-[15px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-slate-700 block">Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-medium text-slate-500 hover:text-[var(--kindling-ink)] transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--kindling-ink)] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    required 
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-full py-3.5 pl-11 pr-4 outline-none focus:bg-white focus:border-[var(--kindling-ink)] focus:ring-1 focus:ring-[var(--kindling-ink)] transition-all placeholder:text-slate-400 text-[15px]"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--kindling-ink)] hover:bg-black text-white font-semibold py-3.5 px-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2 shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

        </div>
      </div>

      <div className="mt-8 text-center pb-8">
        <p className="text-slate-500 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--kindling-ink)] font-bold hover:underline transition-all"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}