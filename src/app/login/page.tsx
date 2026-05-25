"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Sun, 
  Moon,
  ArrowLeft
} from 'lucide-react';
import { supabase, isSupabaseActive } from '@/lib/supabaseClient';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Theme setup
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);

    // Read success messages from query params (e.g. after signup)
    const registered = searchParams.get('registered');
    if (registered) {
      setSuccess('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanEmail = email.trim();

    if (isSupabaseActive()) {
      try {
        const { data, error: authError } = await supabase!.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError) throw authError;

        if (data.user) {
          sessionStorage.setItem('mkc_admin_auth_user', data.user.email || cleanEmail);
          router.push('/admin');
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed. Please check credentials.');
        setLoading(false);
      }
    } else {
      // LocalStorage Mock mode
      setTimeout(() => {
        try {
          const storedAdmins = localStorage.getItem('mkc_admins');
          let admins = [];
          if (storedAdmins) {
            try {
              admins = JSON.parse(storedAdmins);
            } catch (e) {
              admins = [{ username: 'admin', email: 'admin@mkc.com', fullName: 'System Admin', passwordHash: 'admin2026' }];
            }
          } else {
            admins = [{ username: 'admin', email: 'admin@mkc.com', fullName: 'System Admin', passwordHash: 'admin2026' }];
          }

          const found = admins.find(
            (a: any) => 
              ((a.username && a.username.toLowerCase() === cleanEmail.toLowerCase()) || 
               (a.email && a.email.toLowerCase() === cleanEmail.toLowerCase())) && 
              a.passwordHash === password
          );

          if (found) {
            sessionStorage.setItem('mkc_admin_auth_user', found.email || found.username || 'admin');
            router.push('/admin');
          } else {
            setError('Invalid administrator email or password.');
            setLoading(false);
          }
        } catch (err: any) {
          setError('Local storage error: ' + err.message);
          setLoading(false);
        }
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden animated-bg transition-colors duration-300">
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Theme Button & Back Button */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl glass-panel border border-slate-700/40 flex items-center justify-center hover:bg-slate-800 transition-all duration-200 text-slate-300 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      <div className="absolute top-6 left-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl glass-panel border border-slate-700/40 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel border border-slate-700/40 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-t-3xl" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white mb-1">
            Access Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage your campaigns, templates, and view student leads.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="admin@mkc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input placeholder-slate-600 border-slate-700/60 text-white font-semibold text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link 
                href="/forgot-password" 
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl glass-input placeholder-slate-600 border-slate-700/60 text-white font-semibold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-[0.98] disabled:opacity-70 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Access Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have an admin account?{' '}
            <Link 
              href="/signup" 
              className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Credentials guide in case database is empty */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Reviewer Demo Access: admin@mkc.com / admin2026
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING SIGN IN GATE...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
