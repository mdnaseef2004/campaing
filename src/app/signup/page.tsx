"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { supabase, isSupabaseActive } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);
  }, []);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (isSupabaseActive()) {
      try {
        const { data, error: authError } = await supabase!.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        });

        if (authError) throw authError;

        if (data.user) {
          router.push('/login?registered=true');
        } else {
          // If user is null but no error, might be rate limited or email already exists
          setError('Registration successful. Please check your email to confirm.');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
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

          if (admins.some((a: any) => a.email && a.email.toLowerCase() === cleanEmail.toLowerCase())) {
            setError('An account with this email address already exists.');
            setLoading(false);
            return;
          }

          const newAdmin = {
            username: cleanEmail.split('@')[0],
            email: cleanEmail,
            fullName: cleanName,
            passwordHash: password,
            createdAt: new Date().toISOString()
          };

          admins.push(newAdmin);
          localStorage.setItem('mkc_admins', JSON.stringify(admins));
          router.push('/login?registered=true');
        } catch (err: any) {
          setError('Local storage error: ' + err.message);
          setLoading(false);
        }
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden animated-bg transition-colors duration-300">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header controls */}
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
          href="/login" 
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl glass-panel border border-slate-700/40 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md glass-panel border border-slate-700/40 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-t-3xl" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white mb-1">
            Create Admin Account
          </h1>
          <p className="text-xs text-slate-400">
            Register as a campaign coordinator to design template cards and sync leads.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input placeholder-slate-600 border-slate-700/60 text-white font-semibold text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="coordinator@mkc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input placeholder-slate-600 border-slate-700/60 text-white font-semibold text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
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

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl glass-input placeholder-slate-600 border-slate-700/60 text-white font-semibold text-sm"
              />
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
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already have an admin account?{' '}
            <Link 
              href="/login" 
              className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
