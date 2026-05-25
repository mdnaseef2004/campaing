import { supabase, isSupabaseActive } from './supabaseClient';

export interface Campaign {
  id: string; // camp-xxx
  adminUsername: string; // Stores administrator email or ID
  name: string;
  title: string;
  slogan: string;
  collectName: boolean;
  collectPhone: boolean;
  collectCategory: boolean;
  templateStyle: 'cyberpunk' | 'eco' | 'classic' | 'custom';
  templateUrl?: string; // Base64 uploaded image if templateStyle is 'custom' or Supabase Storage URL
  googleSheetsUrl?: string; // Google Sheets Apps Script Web App URL
  buttonText: string; // Customized submit button text
  themeColors?: {
    primary: string; // e.g. Hex code like #6366f1
    gradient: string; // Tailwind gradient description e.g. 'from-indigo-500 to-rose-500'
  };
  slug: string; // Unique URL slug
  otpEnabled: boolean; // Toggle for registration OTP check
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  campaignId: string;
  name?: string;
  phone?: string;
  category?: 'SSLC' | '+1' | '+2';
  referrerId?: string;
  referrerLink?: string;
  deviceType: string;
  sharesCount: number; // Share click tracker
  timestamp: string;
}

export interface ClickLog {
  campaignId: string;
  referrerId: string;
  timestamp: string;
  deviceType: string;
}

// Local Storage Keys for Mock Mode
const ADMINS_KEY = 'mkc_admins';
const CAMPAIGNS_KEY = 'mkc_campaigns';
const SUBMISSIONS_KEY = 'mkc_student_submissions';
const CLICKS_KEY = 'mkc_referral_clicks';

function isClient() {
  return typeof window !== 'undefined';
}

// --- MOCK DATABASE HELPER METHODS (LOCALSTORAGE) ---

function getLocalAdmins(): any[] {
  if (!isClient()) return [];
  const stored = localStorage.getItem(ADMINS_KEY);
  if (!stored) {
    const defaultAdmins = [
      { username: 'admin', email: 'admin@mkc.com', fullName: 'System Admin', passwordHash: 'admin2026', createdAt: new Date().toISOString() }
    ];
    localStorage.setItem(ADMINS_KEY, JSON.stringify(defaultAdmins));
    return defaultAdmins;
  }
  try { return JSON.parse(stored); } catch { return []; }
}

function getLocalCampaigns(): Campaign[] {
  if (!isClient()) return [];
  const stored = localStorage.getItem(CAMPAIGNS_KEY);
  if (!stored) {
    const defaultCampaigns: Campaign[] = [
      {
        id: 'camp-default',
        adminUsername: 'admin@mkc.com',
        name: 'MKC Student Campaign 2026',
        title: '★ SCHOLAR LEAGUE ★',
        slogan: 'EMPOWER. LEAD. INSPIRE.',
        collectName: true,
        collectPhone: true,
        collectCategory: true,
        templateStyle: 'cyberpunk',
        buttonText: 'Submit & Create Poster',
        slug: 'mkc2026',
        otpEnabled: false,
        themeColors: {
          primary: '#6366f1',
          gradient: 'from-indigo-600 to-rose-500'
        },
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(defaultCampaigns));
    return defaultCampaigns;
  }
  try { return JSON.parse(stored); } catch { return []; }
}

function getLocalSubmissions(): StudentSubmission[] {
  if (!isClient()) return [];
  const stored = localStorage.getItem(SUBMISSIONS_KEY);
  if (!stored) {
    const mockData: StudentSubmission[] = [
      {
        id: 'STU-B4A1D9',
        campaignId: 'camp-default',
        name: 'Arjun Mehta',
        phone: '9876543210',
        category: '+2',
        referrerId: 'STU-ADMIN',
        referrerLink: 'http://localhost:3000/campaign/mkc2026?ref=STU-ADMIN',
        deviceType: 'Mobile',
        sharesCount: 3,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'STU-7C3F8E',
        campaignId: 'camp-default',
        name: 'Anjali Sharma',
        phone: '9123456789',
        category: '+1',
        referrerId: 'STU-B4A1D9',
        referrerLink: 'http://localhost:3000/campaign/mkc2026?ref=STU-B4A1D9',
        deviceType: 'Mobile',
        sharesCount: 1,
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'STU-E5D2A4',
        campaignId: 'camp-default',
        name: 'Rahul Nair',
        phone: '9812763450',
        category: 'SSLC',
        referrerId: 'STU-B4A1D9',
        referrerLink: 'http://localhost:3000/campaign/mkc2026?ref=STU-B4A1D9',
        deviceType: 'Desktop',
        sharesCount: 0,
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'STU-D9F4B2',
        campaignId: 'camp-default',
        name: 'Sneha Roy',
        phone: '9008007006',
        category: '+2',
        deviceType: 'Desktop',
        sharesCount: 4,
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      }
    ];
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(mockData));
    return mockData;
  }
  try { return JSON.parse(stored); } catch { return []; }
}

function getLocalClicks(): ClickLog[] {
  if (!isClient()) return [];
  const stored = localStorage.getItem(CLICKS_KEY);
  if (!stored) {
    const mockClicks = [
      { campaignId: 'camp-default', referrerId: 'STU-ADMIN', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), deviceType: 'Mobile' },
      { campaignId: 'camp-default', referrerId: 'STU-ADMIN', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), deviceType: 'Mobile' },
      { campaignId: 'camp-default', referrerId: 'STU-B4A1D9', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), deviceType: 'Mobile' },
      { campaignId: 'camp-default', referrerId: 'STU-B4A1D9', timestamp: new Date(Date.now() - 3600000 * 7).toISOString(), deviceType: 'Tablet' },
      { campaignId: 'camp-default', referrerId: 'STU-B4A1D9', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), deviceType: 'Desktop' },
    ];
    localStorage.setItem(CLICKS_KEY, JSON.stringify(mockClicks));
    return mockClicks;
  }
  try { return JSON.parse(stored); } catch { return []; }
}


// --- HYBRID DATA LAYER APIs ---

// 1. Campaigns DB Layer
export async function getCampaigns(adminEmail?: string): Promise<Campaign[]> {
  if (isSupabaseActive()) {
    try {
      let query = supabase!.from('campaigns').select('*');
      if (adminEmail) {
        // First resolve user UUID from user email (profiles table)
        const { data: userProfile } = await supabase!.from('users').select('id').eq('email', adminEmail).single();
        if (userProfile) {
          query = query.eq('admin_id', userProfile.id);
        }
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      return (data || []).map(c => ({
        id: c.id,
        adminUsername: c.admin_id,
        name: c.name,
        title: c.title,
        slogan: c.slogan,
        collectName: c.collect_name,
        collectPhone: c.collect_phone,
        collectCategory: c.collect_category,
        templateStyle: c.template_style,
        templateUrl: c.template_url,
        googleSheetsUrl: c.google_sheet_url,
        buttonText: c.button_text,
        themeColors: c.theme_colors,
        slug: c.slug,
        otpEnabled: c.otp_enabled,
        createdAt: c.created_at
      }));
    } catch (err) {
      console.error('Supabase fetch campaigns failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  if (adminEmail) {
    return campaigns.filter(c => c.adminUsername === adminEmail || c.id === 'camp-default');
  }
  return campaigns;
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase!.from('campaigns').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return {
        id: data.id,
        adminUsername: data.admin_id,
        name: data.name,
        title: data.title,
        slogan: data.slogan,
        collectName: data.collect_name,
        collectPhone: data.collect_phone,
        collectCategory: data.collect_category,
        templateStyle: data.template_style,
        templateUrl: data.template_url,
        googleSheetsUrl: data.google_sheet_url,
        buttonText: data.button_text,
        themeColors: data.theme_colors,
        slug: data.slug,
        otpEnabled: data.otp_enabled,
        createdAt: data.created_at
      };
    } catch (err) {
      console.error('Supabase getCampaignById failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase!.from('campaigns').select('*').eq('slug', slug).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return {
        id: data.id,
        adminUsername: data.admin_id,
        name: data.name,
        title: data.title,
        slogan: data.slogan,
        collectName: data.collect_name,
        collectPhone: data.collect_phone,
        collectCategory: data.collect_category,
        templateStyle: data.template_style,
        templateUrl: data.template_url,
        googleSheetsUrl: data.google_sheet_url,
        buttonText: data.button_text,
        themeColors: data.theme_colors,
        slug: data.slug,
        otpEnabled: data.otp_enabled,
        createdAt: data.created_at
      };
    } catch (err) {
      console.error('Supabase getCampaignBySlug failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  return campaigns.find(c => c.slug === slug) || null;
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign | null> {
  const generatedId = 'camp-' + Math.random().toString(36).substring(2, 8);
  const createdAt = new Date().toISOString();

  if (isSupabaseActive()) {
    try {
      // Find admin ID based on email
      const { data: userProfile } = await supabase!.from('users').select('id').eq('email', campaign.adminUsername).single();
      const adminId = userProfile ? userProfile.id : null;
      if (!adminId) throw new Error("Admin email profile not registered.");

      const payload = {
        id: generatedId,
        admin_id: adminId,
        name: campaign.name,
        title: campaign.title,
        slogan: campaign.slogan,
        collect_name: campaign.collectName,
        collect_phone: campaign.collectPhone,
        collect_category: campaign.collectCategory,
        template_style: campaign.templateStyle,
        template_url: campaign.templateUrl,
        google_sheet_url: campaign.googleSheetsUrl,
        button_text: campaign.buttonText,
        theme_colors: campaign.themeColors,
        slug: campaign.slug,
        otp_enabled: campaign.otpEnabled,
        created_at: createdAt
      };

      const { error } = await supabase!.from('campaigns').insert([payload]);
      if (error) throw error;

      return {
        ...campaign,
        id: generatedId,
        createdAt
      };
    } catch (err) {
      console.error('Supabase createCampaign failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  const newCampaign: Campaign = {
    ...campaign,
    id: generatedId,
    createdAt
  };
  campaigns.unshift(newCampaign);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  return newCampaign;
}

export async function updateCampaign(campaign: Campaign): Promise<boolean> {
  if (isSupabaseActive()) {
    try {
      // Find admin ID based on email
      const { data: userProfile } = await supabase!.from('users').select('id').eq('email', campaign.adminUsername).single();
      const adminId = userProfile ? userProfile.id : null;

      const payload = {
        name: campaign.name,
        title: campaign.title,
        slogan: campaign.slogan,
        collect_name: campaign.collectName,
        collect_phone: campaign.collectPhone,
        collect_category: campaign.collectCategory,
        template_style: campaign.templateStyle,
        template_url: campaign.templateUrl,
        google_sheet_url: campaign.googleSheetsUrl,
        button_text: campaign.buttonText,
        theme_colors: campaign.themeColors,
        slug: campaign.slug,
        otp_enabled: campaign.otpEnabled,
        admin_id: adminId || undefined
      };

      const { error } = await supabase!.from('campaigns').update(payload).eq('id', campaign.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase updateCampaign failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  const idx = campaigns.findIndex(c => c.id === campaign.id);
  if (idx === -1) return false;
  campaigns[idx] = campaign;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  return true;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  if (isSupabaseActive()) {
    try {
      const { error } = await supabase!.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase deleteCampaign failed, falling back:', err);
    }
  }

  const campaigns = getLocalCampaigns();
  const filtered = campaigns.filter(c => c.id !== id);
  if (filtered.length === campaigns.length) return false;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(filtered));

  // Also clean up submissions & clicks associated with this campaign
  const subs = getLocalSubmissions().filter(s => s.campaignId !== id);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));

  const clicks = getLocalClicks().filter(c => c.campaignId !== id);
  localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks));

  return true;
}

export async function duplicateCampaign(id: string, newSlug: string, newName: string): Promise<Campaign | null> {
  const origin = await getCampaignById(id);
  if (!origin) return null;

  const duplicated: Omit<Campaign, 'id' | 'createdAt'> = {
    adminUsername: origin.adminUsername,
    name: newName,
    title: origin.title,
    slogan: origin.slogan,
    collectName: origin.collectName,
    collectPhone: origin.collectPhone,
    collectCategory: origin.collectCategory,
    templateStyle: origin.templateStyle,
    templateUrl: origin.templateUrl,
    googleSheetsUrl: origin.googleSheetsUrl,
    buttonText: origin.buttonText,
    themeColors: origin.themeColors,
    slug: newSlug,
    otpEnabled: origin.otpEnabled
  };

  return await createCampaign(duplicated);
}

// 2. Submissions / Leads Layer
export async function getSubmissions(campaignId?: string): Promise<StudentSubmission[]> {
  if (isSupabaseActive()) {
    try {
      let query = supabase!.from('submissions').select('*');
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        campaignId: s.campaign_id,
        name: s.name,
        phone: s.phone,
        category: s.category,
        referrerId: s.referrer_id,
        referrerLink: s.referrer_link,
        deviceType: s.device_type,
        sharesCount: s.shares_count,
        timestamp: s.timestamp
      }));
    } catch (err) {
      console.error('Supabase getSubmissions failed, falling back:', err);
    }
  }

  const submissions = getLocalSubmissions();
  if (campaignId) {
    return submissions.filter(s => s.campaignId === campaignId);
  }
  return submissions;
}

export async function getSubmissionById(id: string): Promise<StudentSubmission | null> {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase!.from('submissions').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return {
        id: data.id,
        campaignId: data.campaign_id,
        name: data.name,
        phone: data.phone,
        category: data.category,
        referrerId: data.referrer_id,
        referrerLink: data.referrer_link,
        deviceType: data.device_type,
        sharesCount: data.shares_count,
        timestamp: data.timestamp
      };
    } catch (err) {
      console.error('Supabase getSubmissionById failed, falling back:', err);
    }
  }

  const submissions = getLocalSubmissions();
  return submissions.find(s => s.id === id) || null;
}

export async function addSubmission(
  campaignId: string,
  name: string,
  phone: string,
  category: 'SSLC' | '+1' | '+2',
  referrerId?: string
): Promise<{ success: boolean; data?: StudentSubmission; error?: string }> {
  // Check for duplicate phone inside the same campaign
  const cleanPhone = phone.trim().replace(/\D/g, '');
  
  if (isSupabaseActive()) {
    try {
      // Check phone uniqueness inside campaign
      if (cleanPhone) {
        const { data: existRecords } = await supabase!
          .from('submissions')
          .select('phone')
          .eq('campaign_id', campaignId)
          .eq('phone', phone.trim());
        
        if (existRecords && existRecords.length > 0) {
          return { success: false, error: 'A student with this phone number has already registered for this campaign!' };
        }
      }

      const generatedId = generateShortId();
      const baseLink = `${window.location.protocol}//${window.location.host}`;
      const campaignObj = await getCampaignById(campaignId);
      const slugSegment = campaignObj ? campaignObj.slug : campaignId;
      const referrerLink = `${baseLink}/campaign/${slugSegment}?ref=${generatedId}`;

      const payload = {
        id: generatedId,
        campaign_id: campaignId,
        name: name.trim() || 'Anonymous',
        phone: phone.trim() || null,
        category: category || null,
        referrer_id: referrerId || null,
        referrer_link: referrerLink,
        device_type: detectDeviceType(),
        shares_count: 0,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase!.from('submissions').insert([payload]);
      if (error) throw error;

      const submissionData: StudentSubmission = {
        id: generatedId,
        campaignId,
        name: payload.name,
        phone: payload.phone || undefined,
        category: payload.category || undefined,
        referrerId: payload.referrer_id || undefined,
        referrerLink: payload.referrer_link,
        deviceType: payload.device_type,
        sharesCount: payload.shares_count,
        timestamp: payload.timestamp
      };

      // Trigger Sheets sync relay in background
      if (campaignObj) {
        triggerSheetsSync(campaignObj, submissionData);
      }

      return { success: true, data: submissionData };
    } catch (err: any) {
      console.error('Supabase addSubmission failed, falling back:', err);
      return { success: false, error: err.message || 'Supabase submission error' };
    }
  }

  const submissions = getLocalSubmissions();
  const campSubmissions = submissions.filter(s => s.campaignId === campaignId);
  
  if (cleanPhone) {
    const exists = campSubmissions.some(s => s.phone && s.phone.replace(/\D/g, '') === cleanPhone);
    if (exists) {
      return { success: false, error: 'A student with this phone number has already registered for this campaign!' };
    }
  }

  const generatedId = generateShortId();
  const baseLink = `${window.location.protocol}//${window.location.host}`;
  const campaignObj = getLocalCampaigns().find(c => c.id === campaignId) || null;
  const slugSegment = campaignObj ? campaignObj.slug : campaignId;
  const referrerLink = `${baseLink}/campaign/${slugSegment}?ref=${generatedId}`;
  
  const newSubmission: StudentSubmission = {
    id: generatedId,
    campaignId,
    name: name.trim() || 'Anonymous',
    phone: phone.trim() || undefined,
    category: category || undefined,
    referrerId: referrerId || undefined,
    referrerLink,
    deviceType: detectDeviceType(),
    sharesCount: 0,
    timestamp: new Date().toISOString()
  };

  submissions.unshift(newSubmission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

  if (campaignObj) {
    triggerSheetsSync(campaignObj, newSubmission);
  }

  return { success: true, data: newSubmission };
}

function triggerSheetsSync(campaign: Campaign, submission: StudentSubmission) {
  const syncData = {
    timestamp: submission.timestamp,
    campaignId: campaign.id,
    campaignName: campaign.name,
    studentId: submission.id,
    name: submission.name,
    phone: submission.phone || 'N/A',
    category: submission.category || 'N/A',
    referrerLink: submission.referrerLink || 'Direct',
    deviceType: submission.deviceType,
    // Google Sheets apps script details
    googleSheetsUrl: campaign.googleSheetsUrl
  };

  fetch('/api/sync-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(syncData)
  }).catch(err => console.warn('Background Apps Script Sheet sync failed:', err));
}

export async function incrementShareCount(id: string): Promise<boolean> {
  if (isSupabaseActive()) {
    try {
      // First get current share count
      const { data } = await supabase!.from('submissions').select('shares_count').eq('id', id).single();
      const current = data ? data.shares_count : 0;
      
      const { error } = await supabase!
        .from('submissions')
        .update({ shares_count: current + 1 })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase incrementShareCount failed:', err);
    }
  }

  const submissions = getLocalSubmissions();
  const idx = submissions.findIndex(s => s.id === id);
  if (idx === -1) return false;
  
  submissions[idx].sharesCount = (submissions[idx].sharesCount || 0) + 1;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  return true;
}

// 3. Referral Click Tracker Layer
export async function getClicks(campaignId?: string): Promise<ClickLog[]> {
  if (isSupabaseActive()) {
    try {
      let query = supabase!.from('clicks').select('*');
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(c => ({
        campaignId: c.campaign_id,
        referrerId: c.referrer_id,
        timestamp: c.timestamp,
        deviceType: c.device_type
      }));
    } catch (err) {
      console.error('Supabase getClicks failed, falling back:', err);
    }
  }

  const clicks = getLocalClicks();
  if (campaignId) {
    return clicks.filter(c => c.campaignId === campaignId);
  }
  return clicks;
}

export async function logClick(campaignId: string, referrerId: string): Promise<void> {
  const deviceType = detectDeviceType();
  const timestamp = new Date().toISOString();

  if (isSupabaseActive()) {
    try {
      const payload = {
        campaign_id: campaignId,
        referrer_id: referrerId,
        device_type: deviceType,
        timestamp
      };
      await supabase!.from('clicks').insert([payload]);
      return;
    } catch (err) {
      console.error('Supabase logClick failed, falling back:', err);
    }
  }

  const clicks = getLocalClicks();
  clicks.push({
    campaignId,
    referrerId,
    timestamp,
    deviceType
  });
  localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks));
}


// --- OTHER SYNC UTILITIES ---

export function generateShortId(): string {
  return 'STU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function detectDeviceType(userAgent?: string): string {
  if (!userAgent && typeof navigator !== 'undefined') {
    userAgent = navigator.userAgent;
  }
  if (!userAgent) return 'Desktop';
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

export async function getReferralStats(campaignId: string, id: string) {
  const clicks = await getClicks(campaignId);
  const submissions = await getSubmissions(campaignId);
  
  const myClicks = clicks.filter(c => c.referrerId === id);
  const myRegs = submissions.filter(s => s.referrerId === id);
  
  return {
    totalClicks: myClicks.length,
    totalRegistrations: myRegs.length,
    registrations: myRegs,
  };
}

export async function getDashboardStats(campaignId: string) {
  const clicks = await getClicks(campaignId);
  const submissions = await getSubmissions(campaignId);
  
  const totalClicks = clicks.length;
  const totalRegs = submissions.length;
  const conversionRate = totalClicks > 0 ? ((totalRegs / totalClicks) * 100).toFixed(1) : '0';
  
  const totalShares = submissions.reduce((sum, s) => sum + (s.sharesCount || 0), 0);
  
  const categorySplit = {
    'SSLC': submissions.filter(s => s.category === 'SSLC').length,
    '+1': submissions.filter(s => s.category === '+1').length,
    '+2': submissions.filter(s => s.category === '+2').length,
  };

  const deviceSplit = {
    'Mobile': submissions.filter(s => s.deviceType === 'Mobile').length,
    'Tablet': submissions.filter(s => s.deviceType === 'Tablet').length,
    'Desktop': submissions.filter(s => s.deviceType === 'Desktop').length,
  };

  return {
    totalClicks,
    totalRegistrations: totalRegs,
    conversionRate,
    totalShares,
    categorySplit,
    deviceSplit,
  };
}
