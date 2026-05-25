"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Users, 
  MousePointer, 
  Percent, 
  GraduationCap, 
  Smartphone, 
  Calendar,
  Sun,
  Moon,
  Trash2,
  Database,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  ChevronRight,
  Check,
  Upload,
  Copy,
  Pencil,
  Layers,
  HelpCircle,
  CheckCircle,
  Share2
} from 'lucide-react';
import { 
  getCampaigns, 
  createCampaign, 
  updateCampaign,
  deleteCampaign, 
  duplicateCampaign,
  getSubmissions, 
  getClicks, 
  Campaign, 
  StudentSubmission 
} from '@/lib/db';

export default function AdminDashboard() {
  const router = useRouter();

  // Theme state
  const [isDark, setIsDark] = useState(false);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState('');

  // Directory and aggregate analytics states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [aggregateStats, setAggregateStats] = useState({
    totalCampaigns: 0,
    totalLeads: 0,
    totalClicks: 0,
    avgConversion: '0'
  });

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'list' | 'create' | 'details' | 'guide' | 'templates'>('list');

  // Edit campaign state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Campaign Form states
  const [campName, setCampName] = useState('');
  const [campTitle, setCampTitle] = useState('★ SCHOLAR LEAGUE ★');
  const [campSlogan, setCampSlogan] = useState('EMPOWER. LEAD. INSPIRE.');
  const [campSlug, setCampSlug] = useState('');
  const [campButtonText, setCampButtonText] = useState('Submit & Create Poster');
  const [collectName, setCollectName] = useState(true);
  const [collectPhone, setCollectPhone] = useState(true);
  const [collectCategory, setCollectCategory] = useState(true);
  const [templateStyle, setTemplateStyle] = useState<'cyberpunk' | 'eco' | 'classic' | 'custom'>('cyberpunk');
  const [customBackdropBase64, setCustomBackdropBase64] = useState<string>('');
  
  // Theme styling states
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [gradientStyle, setGradientStyle] = useState('from-indigo-500 via-purple-500 to-rose-500');

  // OTP Switch
  const [otpEnabled, setOtpEnabled] = useState(false);

  // Google Sheets Apps Script Web App URL state
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');

  // Selected Campaign Analytics states
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [clicksCount, setClicksCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Copy status
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom Template Builder states
  const [tempName, setTempName] = useState('');
  const [tempBase, setTempBase] = useState<'cyber-student-2026'|'eco-champion-2026'|'gold-academic-2026'>('cyber-student-2026');
  const [tempImageBase64, setTempImageBase64] = useState<string>('');
  const [tempImagePreview, setTempImagePreview] = useState<string>('');
  const [templateUploadError, setTemplateUploadError] = useState('');
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  
  // Custom Frame position/size inputs
  const [frameX, setFrameX] = useState(220);
  const [frameY, setFrameY] = useState(560);
  const [frameWidth, setFrameWidth] = useState(640);
  const [frameHeight, setFrameHeight] = useState(640);
  const [frameBorderRadius, setFrameBorderRadius] = useState(180);

  const templateImgInputRef = useRef<HTMLInputElement | null>(null);

  // Sync default frame positions when base layout changes
  useEffect(() => {
    if (tempBase === 'cyber-student-2026') {
      setFrameX(162);
      setFrameY(630);
      setFrameWidth(756);
      setFrameHeight(670);
      setFrameBorderRadius(80);
    } else if (tempBase === 'eco-champion-2026') {
      setFrameX(162);
      setFrameY(630);
      setFrameWidth(756);
      setFrameHeight(670);
      setFrameBorderRadius(80);
    } else if (tempBase === 'gold-academic-2026') {
      setFrameX(140);
      setFrameY(400);
      setFrameWidth(800);
      setFrameHeight(900);
      setFrameBorderRadius(16);
    }
  }, [tempBase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mkc_custom_templates');
      if (stored) {
        try { setCustomTemplates(JSON.parse(stored)); } catch {}
      }
    }
  }, [dashboardTab]);

  const handleTemplateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateUploadError('');

    // Accept PNG and JPG only
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setTemplateUploadError('Only PNG or JPG files are accepted.');
      return;
    }
    // Warn if file is very large (>4MB)
    if (file.size > 4 * 1024 * 1024) {
      setTemplateUploadError('Image is too large. Please use a file under 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setTempImageBase64(result);
      setTempImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempImageBase64) {
      setTemplateUploadError('Please upload a PNG or JPG background image.');
      return;
    }
    import('@/lib/templates').then(({ CAMPAIGN_TEMPLATES }) => {
      const baseTemp = CAMPAIGN_TEMPLATES.find(t => t.id === tempBase);
      if (!baseTemp) return;

      // Deep clone base template, override background with uploaded image & custom frame
      const newTemplate = JSON.parse(JSON.stringify(baseTemp));
      newTemplate.id = 'custom-' + Date.now();
      newTemplate.name = tempName.trim() || 'Custom Template';
      newTemplate.backgroundImage = tempImageBase64;  // PNG/JPG base64
      newTemplate.frame = {
        x: Number(frameX),
        y: Number(frameY),
        width: Number(frameWidth),
        height: Number(frameHeight),
        borderRadius: Number(frameBorderRadius),
        borderColor: '#ffffff',
        borderWidth: 0,
        shadowColor: 'transparent',
        shadowBlur: 0
      };

      const updated = [...customTemplates, newTemplate];
      setCustomTemplates(updated);
      localStorage.setItem('mkc_custom_templates', JSON.stringify(updated));

      // Reset form
      setTempName('');
      setTempImageBase64('');
      setTempImagePreview('');
      setTemplateUploadError('');
      if (templateImgInputRef.current) templateImgInputRef.current.value = '';
    });
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('mkc_custom_templates', JSON.stringify(updated));
  };

  // File input Ref
  const backdropInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize and check auth
  useEffect(() => {
    // Theme sync
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);

    // Session authentication check
    const authSession = sessionStorage.getItem('mkc_admin_auth_user');
    if (authSession) {
      setIsLoggedIn(true);
      setCurrentAdmin(authSession);
      loadCampaigns(authSession);
    } else {
      router.push('/login');
    }
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

  const loadCampaigns = async (adminName: string) => {
    try {
      const allCampaigns = await getCampaigns();
      const adminCampaigns = allCampaigns.filter(c => c.adminUsername === adminName || c.id === 'camp-default');
      setCampaigns(adminCampaigns);

      // Load all submissions and clicks for aggregate calculations
      const allSubs = await getSubmissions();
      const allClicks = await getClicks();

      let totalLeads = 0;
      let totalClicks = 0;

      adminCampaigns.forEach(c => {
        totalLeads += allSubs.filter(s => s.campaignId === c.id).length;
        totalClicks += allClicks.filter(cl => cl.campaignId === c.id).length;
      });

      setAggregateStats({
        totalCampaigns: adminCampaigns.length,
        totalLeads,
        totalClicks,
        avgConversion: totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : '0'
      });
    } catch (err) {
      console.error("Failed to load campaigns list:", err);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentAdmin('');
    sessionStorage.removeItem('mkc_admin_auth_user');
    router.push('/login');
  };

  // Campaign Detailed View Loader
  const handleViewCampaign = async (camp: Campaign) => {
    setSelectedCampaign(camp);
    
    try {
      // Load registrations and clicks for this campaign specifically
      const allSubs = await getSubmissions(camp.id);
      const allClicks = await getClicks(camp.id);
      
      const totalClicks = allClicks.length;
      const totalRegs = allSubs.length;
      const conversionRate = totalClicks > 0 ? ((totalRegs / totalClicks) * 100).toFixed(1) : '0';
      const totalShares = allSubs.reduce((acc, sub) => acc + (sub.sharesCount || 0), 0);

      const categorySplit = {
        'SSLC': allSubs.filter(s => s.category === 'SSLC').length,
        '+1': allSubs.filter(s => s.category === '+1').length,
        '+2': allSubs.filter(s => s.category === '+2').length,
      };

      const deviceSplit = {
        'Mobile': allSubs.filter(s => s.deviceType === 'Mobile').length,
        'Tablet': allSubs.filter(s => s.deviceType === 'Tablet').length,
        'Desktop': allSubs.filter(s => s.deviceType === 'Desktop').length,
      };

      setSubmissions(allSubs);
      setClicksCount(totalClicks);
      setStats({
        totalClicks,
        totalRegistrations: totalRegs,
        conversionRate,
        totalShares,
        categorySplit,
        deviceSplit
      });

      setDashboardTab('details');
    } catch (err) {
      console.error("Failed to load campaign statistics:", err);
    }
  };

  // Pre-fill form for Editing
  const handleStartEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setCampName(camp.name);
    setCampTitle(camp.title);
    setCampSlogan(camp.slogan);
    setCampSlug(camp.slug);
    setCampButtonText(camp.buttonText || 'Submit & Create Poster');
    setCollectName(camp.collectName);
    setCollectPhone(camp.collectPhone);
    setCollectCategory(camp.collectCategory);
    setTemplateStyle(camp.templateStyle);
    setCustomBackdropBase64(camp.templateUrl || '');
    setPrimaryColor(camp.themeColors?.primary || '#6366f1');
    setGradientStyle(camp.themeColors?.gradient || 'from-indigo-500 via-purple-500 to-rose-500');
    setOtpEnabled(camp.otpEnabled || false);
    setGoogleSheetsUrl(camp.googleSheetsUrl || '');
    setDashboardTab('create');
  };

  const handleDuplicateCampaign = async (camp: Campaign) => {
    const rawNewName = `${camp.name} (Copy)`;
    const newName = prompt("Enter Name for Duplicated Campaign:", rawNewName);
    if (!newName) return;

    const rawNewSlug = `${camp.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;
    const newSlug = prompt("Enter URL Slug for Duplicated Campaign:", rawNewSlug);
    if (!newSlug) return;

    const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    try {
      const result = await duplicateCampaign(camp.id, cleanSlug, newName.trim());
      if (result) {
        alert(`Successfully duplicated campaign "${camp.name}" as "${newName.trim()}"!`);
        await loadCampaigns(currentAdmin);
      } else {
        alert("Failed to duplicate campaign. Ensure slug is unique.");
      }
    } catch (err) {
      console.error("Error duplicating campaign:", err);
    }
  };

  // Custom Background file upload processor
  const handleBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Background image file is too large. Please upload an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomBackdropBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Create or Update Campaign submission
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campName.trim()) {
      alert("Please specify a campaign name.");
      return;
    }

    if (!campSlug.trim()) {
      alert("Please specify a URL slug.");
      return;
    }

    const cleanSlug = campSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    if (templateStyle === 'custom' && !customBackdropBase64) {
      alert("Please upload a custom background template image, or select one of our premium preset template styles.");
      return;
    }

    const campaignPayload = {
      adminUsername: currentAdmin,
      name: campName.trim(),
      title: campTitle.trim(),
      slogan: campSlogan.trim(),
      slug: cleanSlug,
      buttonText: campButtonText.trim(),
      collectName,
      collectPhone,
      collectCategory,
      templateStyle,
      templateUrl: templateStyle === 'custom' ? customBackdropBase64 : undefined,
      googleSheetsUrl: googleSheetsUrl.trim() || undefined,
      otpEnabled,
      themeColors: {
        primary: primaryColor,
        gradient: gradientStyle
      }
    };

    try {
      if (editingCampaign) {
        // Update Campaign
        const updated = await updateCampaign({
          ...campaignPayload,
          id: editingCampaign.id,
          createdAt: editingCampaign.createdAt
        });
        if (updated) {
          alert("Campaign updated successfully!");
        } else {
          alert("Failed to update campaign.");
        }
      } else {
        // Create Campaign
        const newCamp = await createCampaign(campaignPayload);
        if (newCamp) {
          alert("Campaign created successfully!");
        } else {
          alert("Failed to create campaign. Ensure slug is unique.");
        }
      }

      // Reset states
      setEditingCampaign(null);
      setCampName('');
      setCampTitle('★ SCHOLAR LEAGUE ★');
      setCampSlogan('EMPOWER. LEAD. INSPIRE.');
      setCampSlug('');
      setCampButtonText('Submit & Create Poster');
      setCollectName(true);
      setCollectPhone(true);
      setCollectCategory(true);
      setTemplateStyle('cyberpunk');
      setCustomBackdropBase64('');
      setPrimaryColor('#6366f1');
      setGradientStyle('from-indigo-500 via-purple-500 to-rose-500');
      setOtpEnabled(false);
      setGoogleSheetsUrl('');

      // Reload directory
      await loadCampaigns(currentAdmin);
      setDashboardTab('list');
    } catch (err) {
      console.error("Save campaign error:", err);
      alert("An error occurred during save. Check console for details.");
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (id === 'camp-default') {
      alert("The default demo campaign cannot be deleted.");
      return;
    }

    if (confirm(`Are you sure you want to delete the campaign "${name}"? This will permanently delete all associated registrations and clicks.`)) {
      try {
        const deleted = await deleteCampaign(id);
        if (deleted) {
          await loadCampaigns(currentAdmin);
          if (selectedCampaign?.id === id) {
            setSelectedCampaign(null);
            setDashboardTab('list');
          }
          alert("Campaign deleted successfully.");
        } else {
          alert("Failed to delete campaign.");
        }
      } catch (err) {
        console.error("Delete campaign error:", err);
      }
    }
  };

  // Campaign Detailed stats resetting
  const handleClearCampaignData = () => {
    if (!selectedCampaign) return;
    
    if (confirm(`Are you sure you want to clear all student records and referral logs for "${selectedCampaign.name}"? This operation is permanent.`)) {
      // Erase from submissions/clicks matching campaign ID in LocalStorage or mock implementation
      const allSubs = submissions.filter(s => s.campaignId !== selectedCampaign.id);
      localStorage.setItem('mkc_student_submissions', JSON.stringify(allSubs));

      const allClicks = clicksCount ? [] : []; // Reset local clicks
      localStorage.setItem('mkc_referral_clicks', JSON.stringify(allClicks));

      // Reload stats
      handleViewCampaign(selectedCampaign);
      alert("Campaign data cleared successfully!");
    }
  };

  // Client-Side Excel downloader specifically for the selected campaign
  const handleExportExcel = () => {
    if (!selectedCampaign || submissions.length === 0) {
      alert("No student registration records available to export for this campaign.");
      return;
    }

    import('xlsx').then((XLSX) => {
      const excelRows = filteredSubmissions.map((s, idx) => ({
        "Sl No": idx + 1,
        "Timestamp": new Date(s.timestamp).toLocaleString(),
        "Student ID": s.id,
        "Name": s.name || 'Anonymous',
        "Phone Number": s.phone || 'N/A',
        "Category": s.category || 'N/A',
        "Referrer Link": s.referrerLink || 'Direct',
        "Device Type": s.deviceType,
        "Shares": s.sharesCount || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

      // Auto-fit Columns
      worksheet["!cols"] = Object.keys(excelRows[0]).map(() => ({ wch: 22 }));

      XLSX.writeFile(workbook, `${selectedCampaign.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(err => {
      console.error('XLSX dynamic loading failed:', err);
      alert('Spreadsheet exporter failed to initialize.');
    });
  };

  // Apps Script helper code snippet
  const appsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", 
        "Campaign ID", 
        "Campaign Name", 
        "Student ID", 
        "Name", 
        "Phone Number", 
        "Category", 
        "Referrer Link", 
        "Device Type"
      ]);
    }
    
    sheet.appendRow([
      data.timestamp,
      data.campaignId,
      data.campaignName,
      data.studentId,
      data.name,
      data.phone,
      data.category,
      data.referrerLink,
      data.deviceType
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter dynamic registrations
  const filteredSubmissions = submissions.filter(sub => {
    const nameMatch = sub.name ? sub.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const phoneMatch = sub.phone ? sub.phone.includes(searchQuery) : false;
    const idMatch = sub.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSearch = nameMatch || phoneMatch || idMatch || searchQuery === '';
    
    const matchesCategory = 
      selectedCategory === 'ALL' || 
      sub.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden">
      {/* Animated Neomorphic Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_8s_ease-in-out_infinite] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-500/20 dark:bg-fuchsia-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-teal-500/15 dark:bg-teal-500/10 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_2s] pointer-events-none" />


      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          <span className="font-extrabold text-sm md:text-base tracking-tight text-slate-950 dark:text-white font-display">
            MKC CAMPAIGN HUB
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 text-slate-700 dark:text-slate-300 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all duration-150 cursor-pointer"
          >
            Logout ({currentAdmin.split('@')[0]})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 relative z-10">
        
        {/* Navigation Tabs (Only if not viewing campaign details) */}
        {dashboardTab !== 'details' && (
          <div className="flex flex-wrap justify-center md:justify-start items-center border-b border-slate-200/60 dark:border-slate-800/60 gap-2 md:gap-6 mb-4 px-2">
            <button
              onClick={() => {
                setDashboardTab('list');
                setEditingCampaign(null);
              }}
              className={`pb-3 px-2 text-sm md:text-base font-bold border-b-2 transition-all duration-300 cursor-pointer ${
                dashboardTab === 'list' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black scale-105' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:scale-105'
              }`}
            >
              My Campaigns <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">{campaigns.length}</span>
            </button>
            <button
              onClick={() => {
                setEditingCampaign(null);
                // Clear fields
                setCampName('');
                setCampTitle('★ SCHOLAR LEAGUE ★');
                setCampSlogan('EMPOWER. LEAD. INSPIRE.');
                setCampSlug('');
                setCampButtonText('Submit & Create Poster');
                setCollectName(true);
                setCollectPhone(true);
                setCollectCategory(true);
                setTemplateStyle('cyberpunk');
                setCustomBackdropBase64('');
                setPrimaryColor('#6366f1');
                setGradientStyle('from-indigo-500 via-purple-500 to-rose-500');
                setOtpEnabled(false);
                setGoogleSheetsUrl('');
                setDashboardTab('create');
              }}
              className={`pb-3 px-2 text-sm md:text-base font-bold border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                dashboardTab === 'create' && !editingCampaign
                  ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 font-black scale-105' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 hover:scale-105'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
            <button
              onClick={() => {
                setDashboardTab('templates');
                setEditingCampaign(null);
              }}
              className={`pb-3 px-2 text-sm md:text-base font-bold border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                dashboardTab === 'templates' 
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-black scale-105' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:scale-105'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setDashboardTab('guide')}
              className={`pb-3 px-2 text-sm md:text-base font-bold border-b-2 transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                dashboardTab === 'guide' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-black scale-105' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 hover:scale-105'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Guide</span>
            </button>
          </div>
        )}

        {/* Tab 1: Campaigns List */}
        {dashboardTab === 'list' && (
          <div className="flex flex-col gap-6">
            
            {/* Aggregate Stats Bar */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)]">
              <div className="flex flex-col group">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-indigo-500 transition-colors">Total Campaigns</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white font-mono mt-1 drop-shadow-sm">{aggregateStats.totalCampaigns}</span>
              </div>
              <div className="flex flex-col group">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-fuchsia-500 transition-colors">Total Leads Collected</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-rose-500 font-mono mt-1 drop-shadow-sm">{aggregateStats.totalLeads}</span>
              </div>
              <div className="flex flex-col group">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-teal-500 transition-colors">Link Clicks</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white font-mono mt-1 drop-shadow-sm">{aggregateStats.totalClicks}</span>
              </div>
              <div className="flex flex-col group">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-500 transition-colors">Avg Conversion Rate</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white font-mono mt-1 drop-shadow-sm">{aggregateStats.avgConversion}%</span>
              </div>
            </section>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => {
                // simple stats calculation
                const liveUrl = `${window.location.protocol}//${window.location.host}/campaign/${camp.slug}`;

                return (
                  <div 
                    key={camp.id} 
                    className="group bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl p-5 border border-white/40 dark:border-slate-700/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] relative overflow-hidden flex flex-col justify-between hover:-translate-y-2 hover:shadow-[0_12px_30px_rgb(99,102,241,0.15)] transition-all duration-300"
                  >
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {camp.templateStyle} Template
                        </span>
                        {camp.otpEnabled && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                            OTP Active
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-snug truncate">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4 truncate">
                        "{camp.slogan}"
                      </p>

                      <div className="text-[11px] text-slate-400 font-mono mb-4 flex flex-col gap-1 bg-slate-100/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                        <span className="truncate">URL: /campaign/{camp.slug}</span>
                        <span className="truncate">
                          Sheets: {camp.googleSheetsUrl ? 'Connected' : 'Local Storage Only'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCampaign(camp)}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <span>Analytics</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleStartEdit(camp)}
                          title="Edit Settings"
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicateCampaign(camp)}
                          title="Duplicate Config"
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                          disabled={camp.id === 'camp-default'}
                          title="Delete Campaign"
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <a
                        href={`/campaign/${camp.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Launch Form</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create / Edit Campaign Form */}
        {dashboardTab === 'create' && (
          <div className="w-full max-w-2xl mx-auto glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-rose-500" />
            
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6">
              {editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'Create New Campaign'}
            </h2>

            <form onSubmit={handleSaveCampaign} className="flex flex-col gap-5">
              
              {/* Campaign Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MKC Student Council Election 2026"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="px-4 py-3 rounded-xl glass-input placeholder-slate-400 text-sm font-semibold"
                />
              </div>

              {/* Grid for Logo & Slogan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Header / Logo Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ★ SCHOLAR LEAGUE ★"
                    value={campTitle}
                    onChange={(e) => setCampTitle(e.target.value)}
                    className="px-4 py-3 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Campaign Slogan Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMPOWER. LEAD. INSPIRE."
                    value={campSlogan}
                    onChange={(e) => setCampSlogan(e.target.value)}
                    className="px-4 py-3 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>
              </div>

              {/* URL Slug & Submit Button custom text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Unique URL Slug</span>
                    <span className="text-[10px] text-indigo-500 font-mono">(lowercase letters & numbers only)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mkc2026"
                    value={campSlug}
                    onChange={(e) => setCampSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    className="px-4 py-3 rounded-xl glass-input text-sm font-semibold font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Custom Button Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Submit & Create Poster"
                    value={campButtonText}
                    onChange={(e) => setCampButtonText(e.target.value)}
                    className="px-4 py-3 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Theme customizer */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Theme Customization
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Primary Color (Hex)</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-800"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#6366f1"
                        className="flex-1 px-3 py-2 rounded-lg glass-input text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Gradient Palette</span>
                    <select
                      value={gradientStyle}
                      onChange={(e) => setGradientStyle(e.target.value)}
                      className="px-3 py-2.5 rounded-lg glass-input text-xs font-bold cursor-pointer"
                    >
                      <option value="from-indigo-500 via-purple-500 to-rose-500">Cyber Gradient (Indigo-Purple-Rose)</option>
                      <option value="from-purple-600 via-indigo-500 to-blue-500">Cool Gradient (Purple-Indigo-Blue)</option>
                      <option value="from-emerald-500 via-teal-500 to-cyan-500">Eco-Nature Gradient (Emerald-Teal-Cyan)</option>
                      <option value="from-rose-500 via-pink-500 to-orange-500">Sunset Flare (Rose-Pink-Orange)</option>
                      <option value="from-slate-900 to-slate-700">Dark Minimalist (Slate Dark)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Information to collect toggle */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Information to collect from students
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={collectName}
                      onChange={(e) => setCollectName(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Collect Full Name</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={collectPhone}
                      onChange={(e) => setCollectPhone(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Collect Phone Number</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={collectCategory}
                      onChange={(e) => setCollectCategory(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Collect Class Category</span>
                  </label>
                </div>
              </div>

              {/* Template Style Selector */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Poster Backdrop template style
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateStyle('cyberpunk')}
                    className={`py-3 px-2 rounded-xl text-center font-bold text-xs border transition-all duration-300 cursor-pointer ${
                      templateStyle === 'cyberpunk'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm scale-105'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-400/50 hover:text-indigo-500'
                    }`}
                  >
                    SUCCESS STORY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateStyle('eco')}
                    className={`py-3 px-2 rounded-xl text-center font-bold text-xs border transition-all duration-300 cursor-pointer ${
                      templateStyle === 'eco'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm scale-105'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-400/50 hover:text-emerald-500'
                    }`}
                  >
                    WINNER
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateStyle('classic')}
                    className={`py-3 px-2 rounded-xl text-center font-bold text-xs border transition-all duration-300 cursor-pointer ${
                      templateStyle === 'classic'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold shadow-sm scale-105'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-400/50 hover:text-amber-500'
                    }`}
                  >
                    CLASSIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateStyle('custom')}
                    className={`py-3 px-2 rounded-xl text-center font-bold text-xs border transition-all duration-300 cursor-pointer ${
                      templateStyle === 'custom'
                        ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 font-extrabold shadow-sm scale-105'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30 hover:border-fuchsia-400/50 hover:text-fuchsia-500'
                    }`}
                  >
                    CUSTOM
                  </button>
                </div>

                {/* Custom Backdrop File Uploader */}
                {templateStyle === 'custom' && (
                  <div className="mt-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-100/20 dark:bg-slate-900/20 text-center flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-indigo-500 animate-pulse" />
                    
                    <button
                      type="button"
                      onClick={() => backdropInputRef.current?.click()}
                      className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Choose Backdrop File
                    </button>
                    
                    <input
                      type="file"
                      ref={backdropInputRef}
                      accept="image/*"
                      onChange={handleBackdropUpload}
                      className="hidden"
                    />

                    {customBackdropBase64 ? (
                      <div className="mt-2 text-center">
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">✓ File uploaded successfully</span>
                        <img 
                          src={customBackdropBase64} 
                          alt="Custom Background Backdrop Preview" 
                          className="w-24 h-40 object-cover rounded-md border border-slate-200 dark:border-slate-800 shadow-md mx-auto mt-2"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Upload portrait backdrop (1080x1920 recommended, max 2MB)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* OTP Switch & Google Sheets url */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={otpEnabled}
                    onChange={(e) => setOtpEnabled(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Enable OTP Validation</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Verifies mobile numbers with a simulated OTP dialog code.</span>
                  </div>
                </label>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Google Sheets Apps Script URL (Optional)</span>
                    <button
                      type="button"
                      onClick={() => setDashboardTab('guide')}
                      title="Learn how to deploy spreadsheet Apps Script link"
                      className="cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    className="px-4 py-3 rounded-xl glass-input text-xs font-mono font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 italic block leading-tight">
                    Forward student registration submissions to your sheet web app. Leave blank to log data locally.
                  </span>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-4 pt-2">
                {editingCampaign && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCampaign(null);
                      setDashboardTab('list');
                    }}
                    className="flex-1 py-4 rounded-2xl font-bold border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm active:scale-[0.98] transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                )}
                
                <button
                  type="submit"
                  className="flex-2 py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 to-rose-500 text-white shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>{editingCampaign ? 'Save Campaign Changes' : 'Generate Campaign'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Tab: Templates */}
        {dashboardTab === 'templates' && (
          <div className="w-full max-w-3xl mx-auto glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-xl relative animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Pencil className="w-6 h-6 text-purple-500" />
              <span>Upload Custom Template</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Upload a <span className="font-bold text-purple-400">PNG or JPG</span> poster background image (1080 × 1920 px recommended). It will be used as the full poster background in the Poster Studio.
            </p>

            <form onSubmit={handleSaveTemplate} className="flex flex-col gap-6">

              {/* Template Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Marble Edition"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="px-4 py-3 rounded-xl glass-input text-sm font-semibold"
                />
              </div>

              {/* Base Layout */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Text Layout Overlay
                  <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">(Controls where name, badge & slogan text appear on top of your image)</span>
                </label>
                <select
                  value={tempBase}
                  onChange={(e: any) => setTempBase(e.target.value)}
                  className="px-4 py-3 rounded-xl glass-input text-sm font-semibold cursor-pointer"
                >
                  <option value="cyber-student-2026">Layout A — Square frame, center-bottom name</option>
                  <option value="eco-champion-2026">Layout B — Oval frame, center-bottom name</option>
                  <option value="gold-academic-2026">Layout C — Sharp-corner frame, formal name</option>
                </select>
              </div>

              {/* Photo Box Editing Option */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Photo Upload Frame Settings (1080x1920 scale)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">X Position (px)</span>
                    <input
                      type="number"
                      value={frameX}
                      onChange={(e) => setFrameX(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl glass-input text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Y Position (px)</span>
                    <input
                      type="number"
                      value={frameY}
                      onChange={(e) => setFrameY(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl glass-input text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Width (px)</span>
                    <input
                      type="number"
                      value={frameWidth}
                      onChange={(e) => setFrameWidth(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl glass-input text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Height (px)</span>
                    <input
                      type="number"
                      value={frameHeight}
                      onChange={(e) => setFrameHeight(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl glass-input text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <span className="text-[10px] font-bold text-slate-500">Radius (px)</span>
                    <input
                      type="number"
                      value={frameBorderRadius}
                      onChange={(e) => setFrameBorderRadius(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl glass-input text-xs font-bold font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Tip: Adjust these numbers to shift or resize the white box placeholder where the student's photo will be uploaded. (Layout defaults are pre-filled).
                </p>
              </div>

              {/* PNG/JPG Upload Area */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Background Image
                  <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">(PNG or JPG, max 4 MB, 1080 × 1920 px recommended)</span>
                </label>

                {/* Drop zone */}
                <div
                  onClick={() => templateImgInputRef.current?.click()}
                  className="relative cursor-pointer border-2 border-dashed border-purple-400/50 hover:border-purple-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] overflow-hidden"
                >
                  {tempImagePreview ? (
                    <>
                      <img
                        src={tempImagePreview}
                        alt="Template preview"
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      />
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">Image loaded — click to replace</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-purple-400" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to upload PNG or JPG</span>
                      <span className="text-xs text-slate-400">Poster background image</span>
                    </>
                  )}
                </div>

                <input
                  ref={templateImgInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleTemplateImageSelect}
                  className="hidden"
                />

                {templateUploadError && (
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                    <span>⚠</span> {templateUploadError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="py-4 rounded-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-5 h-5" />
                <span>Save Template</span>
              </button>
            </form>

            {/* Saved Custom Templates Gallery */}
            <div className="mt-10">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                Saved Custom Templates ({customTemplates.length})
              </h3>
              {customTemplates.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 opacity-30" />
                  <p className="text-xs italic">No custom templates uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {customTemplates.map(t => (
                    <div key={t.id} className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 group">
                      {/* Thumbnail */}
                      {t.backgroundImage ? (
                        <img
                          src={t.backgroundImage}
                          alt={t.name}
                          className="w-full aspect-[9/16] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[9/16] bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                          <Pencil className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      {/* Overlay label */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
                        <p className="text-xs font-bold text-white truncate">{t.name}</p>
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteCustomTemplate(t.id)}
                        title="Delete template"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-rose-600 text-white cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Google Sheets Apps Script Setup Guide */}
        {dashboardTab === 'guide' && (
          <div className="w-full max-w-3xl mx-auto glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-xl relative animate-fadeIn">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              <span>Google Sheets Integration Guide</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Link student registration leads collected on live campaign web links directly to Google Sheets using a Google Apps Script Web App URL.
            </p>

            <div className="flex flex-col gap-6 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <span className="font-extrabold text-indigo-500 block mb-1">Step 1: Open Your Spreadsheet</span>
                <p>Create or open the Google Sheets document where you want campaign leads to accumulate.</p>
              </div>

              <div>
                <span className="font-extrabold text-indigo-500 block mb-1">Step 2: Add Apps Script Code</span>
                <p>Click on <span className="font-bold underline">Extensions</span> &gt; <span className="font-bold underline">Apps Script</span>. Erase any default code in the editor, and paste the code snippet below:</p>
                
                {/* Code Block Container */}
                <div className="relative mt-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-150 dark:bg-slate-900/60 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 leading-normal no-scrollbar max-h-60 overflow-y-auto">
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre className="no-scrollbar">{appsScriptCode}</pre>
                </div>
              </div>

              <div>
                <span className="font-extrabold text-indigo-500 block mb-1">Step 3: Save and Deploy Web App</span>
                <ol className="list-decimal pl-5 flex flex-col gap-1">
                  <li>Click the save icon (floppy disk) at the top of Apps Script editor.</li>
                  <li>Click <span className="font-extrabold text-emerald-500">Deploy</span> button &gt; Select <span className="font-bold text-indigo-500">New Deployment</span>.</li>
                  <li>Click the configuration gear icon next to "Select type" and choose <span className="font-bold">Web app</span>.</li>
                  <li>Under **Execute as**, select <span className="font-bold">Me (your email)</span>.</li>
                  <li>Under **Who has access**, select <span className="font-bold text-rose-500">Anyone</span> (crucial to permit Next.js servers to relay rows).</li>
                  <li>Click **Deploy**. Grant access permissions if prompted.</li>
                </ol>
              </div>

              <div>
                <span className="font-extrabold text-indigo-500 block mb-1">Step 4: Copy & Paste URL Link</span>
                <p>Copy the generated **Web App URL** (ends in `/exec`). Paste this link inside the "Google Sheets Apps Script URL" setting field during campaign creation or editing.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 mt-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>That's it! Registration leads will sync directly to your Google Sheets document instantly in the background.</span>
              </div>
            </div>

            <button
              onClick={() => setDashboardTab('list')}
              className="mt-8 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Return to Directory
            </button>
          </div>
        )}

        {/* Tab 4: Detailed Analytics View */}
        {dashboardTab === 'details' && selectedCampaign && stats && (
          <div className="flex flex-col gap-6">
            
            {/* Back button header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDashboardTab('list')}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all text-slate-700 dark:text-slate-300"
              >
                ← Back to Campaigns
              </button>
              <h2 className="text-sm font-extrabold text-slate-400 font-mono block">
                ID: {selectedCampaign.id}
              </h2>
            </div>

            {/* Campaign Header banner */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-rose-500" />
              <div>
                <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {selectedCampaign.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Slogan: <span className="font-bold text-indigo-500">"{selectedCampaign.slogan}"</span> • Template style: <span className="uppercase font-bold">{selectedCampaign.templateStyle}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(selectedCampaign)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Edit Configuration
                </button>

                <a
                  href={`/campaign/${selectedCampaign.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Launch Live Link</span>
                </a>
              </div>
            </div>

            {/* Row 1: KPI Statistics Cards */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Clicks */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <MousePointer className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Link Clicks</span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{clicksCount}</span>
                </div>
              </div>

              {/* Total Registrations */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Registrations</span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{submissions.length}</span>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Conversion Rate</span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{stats.conversionRate}%</span>
                </div>
              </div>

              {/* Poster Shares */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Poster Shares</span>
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{stats.totalShares}</span>
                </div>
              </div>
            </section>

            {/* Row 2: Charts and distributions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category split metrics */}
              <div className={`glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 ${!selectedCampaign.collectCategory ? 'opacity-40' : ''}`}>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>Category Split</span>
                  {!selectedCampaign.collectCategory && <span className="text-[9px] text-amber-500 uppercase font-semibold block">(Disabled for this campaign)</span>}
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(stats.categorySplit).map(([cat, val]: any) => {
                    const pct = submissions.length > 0 ? (val / submissions.length) * 100 : 0;
                    return (
                      <div key={cat} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{cat}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">{val} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device breakdown metrics */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-rose-500" />
                  Registrant Device Profiles
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(stats.deviceSplit).map(([dev, val]: any) => {
                    const pct = submissions.length > 0 ? (val / submissions.length) * 100 : 0;
                    return (
                      <div key={dev} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{dev}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">{val} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </section>

            {/* Row 3: Submissions Table */}
            <section className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, or student ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input placeholder-slate-400 text-xs md:text-sm font-semibold"
                  />
                </div>

                {/* Filter & download */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  
                  {selectedCampaign.collectCategory && (
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-9 pr-8 py-2.5 rounded-xl glass-input text-xs font-bold cursor-pointer appearance-none"
                      >
                        <option value="ALL">ALL CATEGORIES</option>
                        <option value="SSLC">SSLC</option>
                        <option value="+1">+1</option>
                        <option value="+2">+2</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  )}

                  {/* Excel Exporter */}
                  <button
                    onClick={handleExportExcel}
                    className="py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>

                  {/* Wipe Campaign Data */}
                  <button
                    onClick={handleClearCampaignData}
                    title="Clear Registrants Data"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-slate-800/80 rounded-2xl bg-white/30 dark:bg-slate-900/10">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4 font-extrabold">Student ID</th>
                      <th className="py-3 px-4 font-extrabold">Full Name</th>
                      <th className="py-3 px-4 font-extrabold">Phone Number</th>
                      <th className="py-3 px-4 font-extrabold">Category</th>
                      <th className="py-3 px-4 font-extrabold">Device</th>
                      <th className="py-3 px-4 font-extrabold">Poster Shares</th>
                      <th className="py-3 px-4 font-extrabold">Invited By</th>
                      <th className="py-3 px-4 font-extrabold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-xs md:text-sm">
                    {filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map(sub => (
                        <tr 
                          key={sub.id} 
                          className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 text-slate-800 dark:text-slate-200 font-semibold"
                        >
                          <td className="py-3 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                            {sub.id}
                          </td>
                          <td className="py-3 px-4">
                            {sub.name || 'Anonymous'}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {sub.phone || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            {sub.category ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                sub.category === 'SSLC' 
                                  ? 'bg-rose-500/10 text-rose-500' 
                                  : sub.category === '+1'
                                  ? 'bg-purple-500/10 text-purple-500'
                                  : 'bg-indigo-500/10 text-indigo-500'
                              }`}>
                                {sub.category}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            {sub.deviceType}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-center text-slate-800 dark:text-white">
                            {sub.sharesCount || 0}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 text-xs">
                            {sub.referrerId || 'Direct'}
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-400 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{new Date(sub.timestamp).toLocaleDateString()} {new Date(sub.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 px-4 text-center font-medium text-slate-500 dark:text-slate-400">
                          No registrants found for this search/filter setting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </section>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-200/50 dark:border-slate-800/50 py-4 px-4 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          MKC Administration Hub • Active Session ({currentAdmin.split('@')[0]})
        </p>
      </footer>
    </div>
  );
}
