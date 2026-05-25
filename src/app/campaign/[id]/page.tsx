"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  User, 
  Phone, 
  GraduationCap, 
  Sun, 
  Moon, 
  Sparkles, 
  Share2, 
  CheckCircle, 
  Award, 
  ChevronRight,
  TrendingUp,
  Users,
  AlertCircle,
  ShieldCheck,
  Crown,
  Trophy
} from 'lucide-react';
import { 
  getCampaignById, 
  getCampaignBySlug,
  addSubmission, 
  getSubmissions,
  logClick, 
  getSubmissionById, 
  Campaign,
  StudentSubmission
} from '@/lib/db';

interface LeaderboardEntry {
  id: string;
  name: string;
  referrals: number;
}

function CampaignLandingContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  // Theme state
  const [isDark, setIsDark] = useState(false);
  
  // Campaign configuration
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignError, setCampaignError] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'SSLC' | '+1' | '+2'>('SSLC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Referral states
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // OTP Validation states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Load campaign config, leaderboard & log clicks
  useEffect(() => {
    // Theme sync
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);

    if (!id) return;

    const loadCampaignData = async () => {
      try {
        let camp = await getCampaignById(id);
        if (!camp) {
          camp = await getCampaignBySlug(id);
        }
        
        if (!camp) {
          setCampaignError(true);
          return;
        }
        
        setCampaign(camp);

        // Fetch submissions to calculate leaderboard
        const subs = await getSubmissions(camp.id);
        calculateLeaderboard(subs);

        // Referral link checking
        const ref = searchParams.get('ref');
        if (ref) {
          setReferrerId(ref);
          await logClick(camp.id, ref);
          
          // Look up referrer's name to show a personalized invite
          const referrer = await getSubmissionById(ref);
          if (referrer) {
            setReferrerName(referrer.name || null);
          }
        }
      } catch (err) {
        console.error("Failed to load campaign data:", err);
        setCampaignError(true);
      }
    };

    loadCampaignData();
  }, [id, searchParams]);

  const calculateLeaderboard = (allSubs: StudentSubmission[]) => {
    const referralCounts: { [key: string]: number } = {};
    const studentNames: { [key: string]: string } = {};

    allSubs.forEach(sub => {
      // Cache student name by ID
      studentNames[sub.id] = sub.name || 'Anonymous';
      
      // If student was referred, increment referrer's count
      if (sub.referrerId) {
        referralCounts[sub.referrerId] = (referralCounts[sub.referrerId] || 0) + 1;
      }
    });

    const entries: LeaderboardEntry[] = Object.keys(referralCounts).map(refId => ({
      id: refId,
      name: studentNames[refId] || 'Anonymous Participant',
      referrals: referralCounts[refId]
    }));

    // Sort by referrals descending
    entries.sort((a, b) => b.referrals - a.referrals);
    
    // Take top 5
    setLeaderboard(entries.slice(0, 5));
  };

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Numeric only
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  const handleSubmitStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!campaign) return;

    if (campaign.collectName && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (campaign.collectPhone && phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (campaign.otpEnabled) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpError('');
      setOtpCode('');
      setShowOtpModal(true);
    } else {
      performRegistration();
    }
  };

  const performRegistration = async () => {
    setLoading(true);
    try {
      const result = await addSubmission(
        campaign!.id, 
        campaign!.collectName ? name : 'Anonymous', 
        campaign!.collectPhone ? phone : '', 
        campaign!.collectCategory ? category : 'SSLC', 
        referrerId || undefined
      );

      if (result.success && result.data) {
        setSuccessData(result.data);
        
        // Trigger canvas confetti explosion
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899', '#fbbf24']
          });
        }).catch(err => console.log('Confetti failed:', err));
        
        // Save registration session locally
        localStorage.setItem(`mkc_registered_id_${campaign!.id}`, result.data.id);

        // Reload leaderboard
        const subs = await getSubmissions(campaign!.id);
        calculateLeaderboard(subs);
      } else {
        setError(result.error || 'Failed to register student record.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode === generatedOtp) {
      setShowOtpModal(false);
      performRegistration();
    } else {
      setOtpError('Incorrect verification code. Please try again.');
    }
  };

  const navigateToEditor = () => {
    if (successData) {
      router.push(`/campaign/${campaign!.id}/edit?sid=${successData.id}`);
    }
  };

  // Error page if campaign is not found
  if (campaignError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white font-display mb-2">Campaign Not Found</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          The election campaign link you followed does not exist or has been disabled by the administrator.
        </p>
        <button
          onClick={() => router.push('/')}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING CAMPAIGN...</p>
      </div>
    );
  }

  // Check if form has any fields at all
  const hasFields = campaign.collectName || campaign.collectPhone || campaign.collectCategory;

  // Custom colors and gradients mapping
  const primaryColor = campaign.themeColors?.primary || '#6366f1';
  const customGradClass = campaign.themeColors?.gradient || 'from-indigo-500 via-purple-500 to-rose-500';

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent font-display uppercase">
            {campaign.name.split(' ')[0]} CAMPAIGN
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin')} 
            className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200"
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

      {/* Main Campaign Hero */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center gap-8 relative z-10">
        
        {/* Referral invitation notification */}
        {referrerName && !successData && (
          <div className="w-full max-w-lg glass-panel rounded-2xl p-4 flex items-center gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 float-animation">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">Campaign Invitation</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                You have been invited by <span className="font-bold text-indigo-600 dark:text-indigo-400">{referrerName}</span> to join the campaign!
              </p>
            </div>
          </div>
        )}

        {/* Brand Banner */}
        <div className="text-center max-w-xl">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-4 text-xs font-semibold"
            style={{ borderColor: primaryColor + '40', color: primaryColor, backgroundColor: primaryColor + '10' }}
          >
            <Award className="w-3.5 h-3.5" />
            {campaign.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4 uppercase">
            {campaign.name}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {campaign.slogan} • Enter registration details below and generate your custom campaign poster card.
          </p>
        </div>

        {/* Success registration view */}
        {successData ? (
          <div className="w-full max-w-lg glass-panel rounded-3xl p-8 border border-emerald-500/20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Registration Successful!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Welcome to the campaign team! Your unique registration ID has been generated successfully.
            </p>

            <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 mb-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold mb-1">Your Campaign ID</span>
              <span className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                {successData.id}
              </span>
            </div>

            <button
              onClick={navigateToEditor}
              className={`w-full py-4 px-6 rounded-2xl font-bold bg-gradient-to-r ${customGradClass} text-white shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2`}
            >
              <span>Design Your Campaign Poster</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Form View */
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
            
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {hasFields ? 'Enter Registration Details' : 'Join Campaign Team'}
            </h2>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs md:text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitStart} className="flex flex-col gap-5">
              
              {/* Name */}
              {campaign.collectName && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input placeholder-slate-400 text-sm md:text-base font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              {campaign.collectPhone && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input placeholder-slate-400 text-sm md:text-base font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              {campaign.collectCategory && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Category
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full pl-12 pr-10 py-3.5 rounded-2xl glass-input appearance-none text-sm md:text-base font-semibold cursor-pointer"
                    >
                      <option value="SSLC" className="dark:bg-slate-900 dark:text-white font-semibold">SSLC (Class 10)</option>
                      <option value="+1" className="dark:bg-slate-900 dark:text-white font-semibold">Plus One (+1)</option>
                      <option value="+2" className="dark:bg-slate-900 dark:text-white font-semibold">Plus Two (+2)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 mt-2 rounded-2xl font-bold bg-gradient-to-r ${customGradClass} text-white shadow-lg active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer`}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span>{campaign.buttonText || (hasFields ? 'Submit & Create Poster' : 'Create Campaign Poster Now')}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          </div>
        )}

        {/* Viral Leaderboard section */}
        <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-lg mt-4">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Campaign Promoters</span>
          </h3>

          {leaderboard.length > 0 ? (
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    index === 0 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                      : index === 1 
                      ? 'bg-slate-300/10 border-slate-300/20 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm w-5 text-center">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[180px] md:max-w-[240px]">
                        {entry.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-mono">
                        {entry.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{entry.referrals} {entry.referrals === 1 ? 'invite' : 'invites'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4 italic">
              No promoters listed yet. Be the first to share your referral code and claim the top spot! 🚀
            </p>
          )}
        </div>

        {/* Feature Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Custom Templates</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
              Use custom graphics, neon gradients, and premium layouts specified by the administrator.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Unique Referrals</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
              Get an individual invite code link, trace clicks, and see your leaderboard status.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">HD Poster Exports</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm">
              Download clean 1080x1920 Status images with overlayed text and share directly.
            </p>
          </div>
        </div>

      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel border border-slate-800 rounded-3xl p-6 md:p-8 relative shadow-2xl animate-scaleIn">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-t-3xl" />
            
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Phone Verification</h2>
              <p className="text-xs text-slate-400">
                To prevent fake registrations, a verification OTP code is required for phone verification.
              </p>
            </div>

            {/* Premium Mock OTP Alert */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex flex-col items-center gap-1 text-center mb-6">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Mock SMS Dispatched</span>
              <span className="text-sm font-mono font-black tracking-widest text-white mt-1">
                OTP Code: {generatedOtp}
              </span>
              <span className="text-[9px] text-slate-400 italic mt-0.5">
                (In demo mode, use the code above to proceed. Real SMS API triggers in production.)
              </span>
            </div>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center">
                  Enter 4-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3.5 text-center text-xl font-black tracking-widest rounded-2xl glass-input placeholder-slate-600 text-white font-mono"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/50 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  Verify & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-200/50 dark:border-slate-800/50 py-6 px-4 text-center mt-auto">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
          © 2026 {campaign.name.toUpperCase()} • POWERED BY ANTIGRAVITY.
        </p>
      </footer>
    </div>
  );
}

export default function CampaignLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING CAMPAIGN GATEWAY...</p>
      </div>
    }>
      <CampaignLandingContent />
    </Suspense>
  );
}
