'use client';

import { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, UserPlus, LogIn } from 'lucide-react';
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
        redirect: false, // Handle redirect manually to catch errors
      });
      
      if (res?.error) {
        // Show error message instead of failing silently
        alert(res.error);
      } else if (res?.ok) {
        // Successful login/signup, redirect to main landing page
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
    // Redirect to home page upon successful Google sign in instead of /profile
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/20 p-8 sm:p-10 relative overflow-hidden transition-all duration-500">
        
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-2">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your details to access your account' : 'Sign up to start building your profile'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  required 
                  placeholder="name@example.com" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                  Forgot password?
                </a>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span className="text-lg">{isLogin ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700 font-bold py-4 px-4 rounded-2xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span className="text-lg">Google</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center pb-8">
        <p className="text-slate-600 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
          >
            {isLogin ? 'Create one now' : 'Sign in instead'}
          </button>
        </p>
      </div>
    </div>
  );
}