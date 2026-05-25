"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { supabase, isSupabaseActive } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = email.trim();

    if (isSupabaseActive()) {
      try {
        const { error: resetError } = await supabase!.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setSent(true);
      } catch (err: any) {
        setError(err.message || 'Failed to send reset email.');
      }
    } else {
      // Mock mode – simulate sending
      setTimeout(() => {
        setSent(true);
      }, 800);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden animated-bg">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="absolute top-6 left-6">
        <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl glass-panel border border-slate-700/40 hover:bg-slate-800 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="w-full max-w-md glass-panel border border-slate-700/40 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-t-3xl" />

        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black text-white font-display">Check Your Email</h1>
            <p className="text-sm text-slate-400 max-w-xs">
              {isSupabaseActive()
                ? `A password reset link has been sent to ${email}. Click it to set a new password.`
                : `(Mock Mode) In production, a reset link would be sent to ${email}.`}
            </p>
            <Link href="/login" className="mt-2 py-3 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-all">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center mb-3 shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black font-display tracking-tight text-white mb-1">Forgot Password</h1>
              <p className="text-xs text-slate-400">Enter your email and we'll send a reset link.</p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-[0.98] disabled:opacity-70 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <span>Send Reset Link</span>}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Remembered your password?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
