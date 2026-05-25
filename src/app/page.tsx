"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  Database, 
  Smartphone, 
  Award,
  Layers,
  Settings,
  Share2,
  Lock,
  Sun,
  Moon
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent font-display">
            MKC HUB
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin')} 
            className="text-xs md:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-200"
          >
            Admin Panel
          </button>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 text-slate-700 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-24 flex flex-col items-center justify-center gap-10 relative z-10 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-rose-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <Award className="w-3.5 h-3.5" />
          MULTI-CAMPAIGN POSTER GENERATOR
        </div>

        {/* Title */}
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-4">
            Deploy Beautiful Custom <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">
              Campaign Portals
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Create independent student election campaigns, customize registration form fields, upload your own backdrop graphics templates, and sync entries directly to Google Sheets.
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <button
            onClick={() => router.push('/campaign/camp-default')}
            className="flex-1 py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Demo Campaign</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push('/admin')}
            className="flex-1 py-4 px-6 rounded-2xl font-bold border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>Go to Admin Panel</span>
          </button>
        </div>

        {/* Marketing Feature highlights */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Campaign Builder</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Create campaigns on the fly, choose preset poster overlay formats or upload custom backgrounds.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Configurable Forms</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Collect only what you need. Toggle Name, Phone, and Class Category fields as optional or required.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Cloud Sheets Sync</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Sync user registration data immediately to custom Google Sheets specified inside the admin panel.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-200/50 dark:border-slate-800/50 py-6 px-4 text-center mt-auto">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
          © 2026 MKC CAMPAIGN MANAGER HUB • POWERED BY ANTIGRAVITY.
        </p>
      </footer>
    </div>
  );
}
