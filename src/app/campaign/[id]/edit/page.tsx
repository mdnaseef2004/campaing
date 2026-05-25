"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Download, 
  Share2, 
  Sparkles, 
  RefreshCw, 
  ZoomIn, 
  Move, 
  QrCode,
  CheckCircle,
  FileImage,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { 
  getCampaignById, 
  getCampaignBySlug,
  getSubmissionById, 
  incrementShareCount,
  Campaign, 
  StudentSubmission 
} from '@/lib/db';
import { CAMPAIGN_TEMPLATES, PosterTemplate } from '@/lib/templates';

function CampaignEditContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  // Theme state
  const [isDark, setIsDark] = useState(false);

  // Campaign & Student states
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [student, setStudent] = useState<StudentSubmission | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [campaignBgImage, setCampaignBgImage] = useState<HTMLImageElement | null>(null);
  const [campaignError, setCampaignError] = useState(false);

  // Preset Template states
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate | null>(null);

  // User photo transformation states
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Processing states
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Refs
  const workspaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial load
  useEffect(() => {
    // Theme sync
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);

    if (!id) return;

    const loadStudioData = async () => {
      try {
        setLoading(true);
        // Load campaign supporting both UUID and slug
        let camp = await getCampaignById(id);
        if (!camp) {
          camp = await getCampaignBySlug(id);
        }
        
        if (!camp) {
          setCampaignError(true);
          return;
        }
        setCampaign(camp);

        // Resolve template style
        if (camp.templateStyle === 'custom') {
          if (camp.templateUrl) {
            const bgImg = new Image();
            bgImg.onload = () => {
              setCampaignBgImage(bgImg);
              setLoading(false);
            };
            bgImg.src = camp.templateUrl;
          }
        } else {
          // Find matching preset template
          const preset = CAMPAIGN_TEMPLATES.find(t => t.id.includes(camp!.templateStyle)) || CAMPAIGN_TEMPLATES[0];
          setSelectedTemplate(preset);
        }

        // Load student profile
        const sid = searchParams.get('sid') || (typeof window !== 'undefined' ? localStorage.getItem(`mkc_registered_id_${camp.id}`) : '');
        if (sid) {
          const profile = await getSubmissionById(sid);
          if (profile && profile.campaignId === camp.id) {
            setStudent(profile);
            setDisplayName(profile.name || 'VOLUNTEER');
            
            // Generate QR code link
            import('qrcode').then((QRCode) => {
              QRCode.toDataURL(profile.referrerLink || '', {
                width: 250,
                margin: 2,
                color: {
                  dark: '#0f172a',
                  light: '#ffffff'
                }
              })
              .then(url => setQrCodeUrl(url))
              .catch(err => console.error('QR code generation error:', err));
            });
          }
        }
      } catch (err) {
        console.error("Failed to load studio data:", err);
        setCampaignError(true);
      } finally {
        setLoading(false);
      }
    };

    loadStudioData();
  }, [id, searchParams]);

  // Redraw canvas on dependencies change
  useEffect(() => {
    drawWorkspace();
  }, [campaign, selectedTemplate, campaignBgImage, userImage, zoom, offsetX, offsetY, displayName, student]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
        setLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Canvas Drawing
  const drawWorkspace = (highRes: boolean = false): HTMLCanvasElement | null => {
    const canvas = workspaceCanvasRef.current;
    if (!canvas && !highRes) return null;
    if (!campaign) return null;

    const drawCanvas = highRes ? document.createElement('canvas') : canvas!;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return null;

    // Dimensions
    const baseWidth = 1080;
    const baseHeight = 1920;
    
    if (highRes) {
      drawCanvas.width = baseWidth;
      drawCanvas.height = baseHeight;
    } else {
      drawCanvas.width = 450;
      drawCanvas.height = 800;
    }

    const scale = drawCanvas.width / baseWidth;

    // 1. Draw Background
    if (campaign.templateStyle === 'custom' && campaignBgImage) {
      ctx.drawImage(campaignBgImage, 0, 0, drawCanvas.width, drawCanvas.height);
    } else if (selectedTemplate) {
      const t = selectedTemplate;
      const gradient = ctx.createLinearGradient(0, 0, 0, drawCanvas.height);
      gradient.addColorStop(0, t.backgroundGradient.from);
      if (t.backgroundGradient.via) {
        gradient.addColorStop(0.5, t.backgroundGradient.via);
      }
      gradient.addColorStop(1, t.backgroundGradient.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

      // Shapes
      t.shapes.forEach(shape => {
        ctx.save();
        ctx.globalAlpha = shape.opacity;
        ctx.fillStyle = shape.fillColor;
        
        const anyShape = shape as any;
        if (anyShape.shadowColor) {
          ctx.shadowColor = anyShape.shadowColor;
          ctx.shadowBlur = (anyShape.shadowBlur || 10) * scale;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        const sX = shape.x * scale;
        const sY = shape.y * scale;
        const sSize = shape.size * scale;

        if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(sX, sY, sSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape.type === 'ring') {
          ctx.strokeStyle = shape.fillColor;
          ctx.lineWidth = 4 * scale;
          ctx.beginPath();
          ctx.arc(sX, sY, sSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 'rect' && shape.width && shape.height) {
          ctx.fillRect(sX, sY, shape.width * scale, shape.height * scale);
        }
        ctx.restore();
      });
    } else {
      const fallbackGrad = ctx.createLinearGradient(0, 0, 0, drawCanvas.height);
      fallbackGrad.addColorStop(0, '#0f172a');
      fallbackGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = fallbackGrad;
      ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    // Bounding Frame details
    const frame = selectedTemplate ? selectedTemplate.frame : {
      x: 140,
      y: 400,
      width: 800,
      height: 900,
      borderRadius: 30,
      borderColor: '#ffffff',
      borderWidth: 8,
      shadowColor: 'rgba(255, 255, 255, 0.3)',
      shadowBlur: 20
    };

    const fx = frame.x * scale;
    const fy = frame.y * scale;
    const fw = frame.width * scale;
    const fh = frame.height * scale;
    const fRadius = frame.borderRadius * scale;

    // 2. Draw User Photo inside clipping mask
    ctx.save();
    ctx.beginPath();
    if (fRadius > 100) {
      ctx.arc(fx + fw / 2, fy + fh / 2, fw / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect ? ctx.roundRect(fx, fy, fw, fh, fRadius) : ctx.rect(fx, fy, fw, fh);
    }
    ctx.clip();

    if (userImage) {
      const imgWidth = userImage.width;
      const imgHeight = userImage.height;
      
      const scaleX = fw / imgWidth;
      const scaleY = fh / imgHeight;
      const baseScale = Math.max(scaleX, scaleY);
      
      const dw = imgWidth * baseScale * zoom;
      const dh = imgHeight * baseScale * zoom;
      
      const dx = fx + (fw - dw) / 2 + (offsetX * scale);
      const dy = fy + (fh - dh) / 2 + (offsetY * scale);

      ctx.drawImage(userImage, dx, dy, dw, dh);
    } else {
      const placeholderGrad = ctx.createRadialGradient(
        fx + fw / 2, fy + fh / 2, 50 * scale,
        fx + fw / 2, fy + fh / 2, fw / 2
      );
      placeholderGrad.addColorStop(0, '#1e293b');
      placeholderGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = placeholderGrad;
      ctx.fillRect(fx - 10, fy - 10, fw + 20, fh + 20);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(fx + fw / 2, fy + fh / 2 - 30 * scale, 40 * scale, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(fx + fw / 2, fy + fh / 2 + 100 * scale, 80 * scale, Math.PI, 0);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${16 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO CHOOSE PHOTO', fx + fw / 2, fy + fh / 2 + 160 * scale);
    }
    ctx.restore();

    // 3. Draw Bounding Frame Border Stroke
    ctx.save();
    ctx.strokeStyle = frame.borderColor;
    ctx.lineWidth = frame.borderWidth * scale;
    ctx.shadowColor = frame.shadowColor;
    ctx.shadowBlur = frame.shadowBlur * scale;

    ctx.beginPath();
    if (fRadius > 100) {
      ctx.arc(fx + fw / 2, fy + fh / 2, fw / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect ? ctx.roundRect(fx, fy, fw, fh, fRadius) : ctx.rect(fx, fy, fw, fh);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Draw badge header capsule
    if (selectedTemplate || campaign.templateStyle === 'custom') {
      ctx.save();
      const badge = selectedTemplate ? selectedTemplate.badge : {
        text: 'CAMPAIGN TEAM',
        x: 540,
        y: 330,
        fontSize: 24,
        textColor: '#0f172a',
        fillColor: '#ffffff',
        borderRadius: 12,
        paddingX: 30,
        paddingY: 12
      };

      ctx.fillStyle = badge.fillColor;
      const bX = badge.x * scale;
      const bY = badge.y * scale;
      const bFS = badge.fontSize * scale;
      const bPX = badge.paddingX * scale;
      const bPY = badge.paddingY * scale;

      ctx.font = `bold ${bFS}px sans-serif`;
      const textWidth = ctx.measureText(badge.text).width;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bX - textWidth / 2 - bPX, bY - bFS / 2 - bPY, textWidth + bPX * 2, bFS + bPY * 2, badge.borderRadius * scale) : ctx.rect(bX - textWidth / 2 - bPX, bY - bFS / 2 - bPY, textWidth + bPX * 2, bFS + bPY * 2);
      ctx.fill();

      ctx.fillStyle = badge.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge.text, bX, bY + 1 * scale);
      ctx.restore();
    }

    // 5. Draw Typography overlays
    const textElements = selectedTemplate ? selectedTemplate.textElements : [
      {
        type: 'logo-text',
        text: campaign.title,
        x: 540,
        y: 120,
        fontSize: 32,
        fontWeight: 'bold',
        textColor: '#ffffff',
        align: 'center' as const
      },
      {
        type: 'slogan',
        text: campaign.slogan,
        x: 540,
        y: 1390,
        fontSize: 48,
        fontWeight: '900',
        textColor: '#ffffff',
        align: 'center' as const,
        shadow: { color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 0, offsetY: 0 }
      },
      {
        type: 'name',
        text: '{NAME}',
        x: 540,
        y: 1500,
        fontSize: 76,
        fontWeight: 'bold',
        textColor: '#ffffff',
        align: 'center' as const
      },
      {
        type: 'id-tag',
        text: 'ID: {ID}',
        x: 540,
        y: 1610,
        fontSize: 30,
        fontWeight: '600',
        textColor: '#fbbf24',
        align: 'center' as const
      }
    ];

    textElements.forEach(el => {
      ctx.save();
      ctx.fillStyle = el.textColor;
      ctx.textAlign = el.align;

      const fontWt = el.fontWeight || 'bold';
      const elFS = el.fontSize * scale;
      ctx.font = `${fontWt} ${elFS}px ${(el as any).fontFamily || 'sans-serif'}`;

      let contentText = el.text;
      if (el.type === 'name') {
        contentText = displayName.toUpperCase();
      } else if (el.type === 'id-tag') {
        const idStr = student ? student.id : 'STU-XXXXXX';
        const catStr = student && student.category ? student.category : '';
        
        if (catStr) {
          contentText = `ID: ${idStr} | ${catStr}`;
        } else {
          contentText = `ID: ${idStr}`;
        }
      } else if (el.type === 'logo-text' && el.text === '{TITLE}') {
        contentText = campaign.title;
      } else if (el.type === 'slogan' && el.text === '{SLOGAN}') {
        contentText = campaign.slogan;
      }

      const tx = el.x * scale;
      const ty = el.y * scale;

      if (el.shadow) {
        ctx.shadowColor = el.shadow.color;
        ctx.shadowBlur = el.shadow.blur * scale;
        ctx.shadowOffsetX = el.shadow.offsetX * scale;
        ctx.shadowOffsetY = el.shadow.offsetY * scale;
      }

      ctx.fillText(contentText, tx, ty);
      ctx.restore();
    });

    return drawCanvas;
  };

  // Download
  const handleDownload = () => {
    setExporting(true);
    setTimeout(() => {
      const highResCanvas = drawWorkspace(true);
      if (!highResCanvas) {
        setExporting(false);
        return;
      }

      const fileUrl = highResCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${campaign?.name.replace(/\s+/g, '_')}_Poster_${displayName.replace(/\s+/g, '_')}.png`;
      link.href = fileUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 500);
  };

  // WhatsApp Share and Increment metric
  const handleShareWhatsApp = async () => {
    if (!student || !campaign) return;
    
    // Increment share counter in DB asynchronously
    await incrementShareCount(student.id);

    const textMsg = `Hey! I just created my custom election card for *${campaign.name}*! 🌟 \n\nClick my link below to join, design your customized poster, and support us! 👇\n\n🔗 ${student.referrerLink || ''}`;
    const encMsg = encodeURIComponent(textMsg);
    window.open(`https://api.whatsapp.com/send?text=${encMsg}`, '_blank');
  };

  // Instagram Story Guide and Increment metric
  const handleInstagramShare = async () => {
    if (!student) return;

    // Increment share counter in DB
    await incrementShareCount(student.id);

    alert("To share on Instagram Story: \n1. Download the HD Poster. \n2. Open Instagram > Create Story. \n3. Select downloaded image. \n4. Add your unique referral link: " + (student.referrerLink || '') + " using the 'Link Sticker'!");
  };

  if (campaignError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white font-display mb-2">Campaign Error</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Unable to load the editor because the requested campaign does not exist.
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
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING STUDIO...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(`/campaign/${id}`)}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Register Page</span>
        </button>

        <span className="font-extrabold text-xs md:text-sm tracking-tight text-slate-950 dark:text-white">
          POSTER CREATION STUDIO
        </span>

        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 text-slate-700 dark:text-slate-300 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Editor Split Panel */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Side: Canvas Preview */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center gap-4">
          
          {exportSuccess && (
            <div className="w-full max-w-[450px] p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Poster exported in HD (1080x1920) successfully! Check your downloads directory.</span>
            </div>
          )}

          <div className="w-full max-w-[450px] aspect-[9/16] rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center p-2.5">
            <div className="absolute inset-0 bg-slate-950 opacity-10 pointer-events-none" />
            
            <canvas 
              ref={workspaceCanvasRef} 
              onClick={triggerUpload}
              className="w-full h-full rounded-2xl shadow-inner cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all bg-slate-900 duration-200 animate-fadeIn"
              style={{ maxHeight: 'calc(100vh - 220px)', aspectRatio: '9/16' }}
            />

            {!userImage && (
              <div onClick={triggerUpload} className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2 cursor-pointer pointer-events-none animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-white flex items-center justify-center shadow-lg">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-white font-extrabold text-sm tracking-wider uppercase drop-shadow-md">
                  Upload Your Photo
                </span>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-sm font-semibold tracking-wider">Processing...</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold text-center italic">
            💡 Click on the poster photo frame to upload your campaign picture.
          </p>
        </section>

        {/* Right Side: Customizer Controls */}
        <section className="lg:col-span-6 flex flex-col gap-6 w-full max-w-[480px] mx-auto lg:max-w-none">
          
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
              Poster Customization Studio
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personalize the display name shown on your campaign poster, adjust photo zoom/X/Y coordinates, and export the finished card.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-5">
            
            {/* Display Name */}
            {campaign.collectName && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Display Name on Poster
                </label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="Enter campaign name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="px-4 py-3 rounded-xl glass-input font-bold animate-fadeIn"
                />
              </div>
            )}

            {/* Photo Adjustments Sliders */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Photo Fit Adjustments
                </span>
                {!userImage && (
                  <span className="text-[10px] text-amber-500 font-semibold uppercase animate-pulse">
                    Upload image to enable sliders
                  </span>
                )}
              </div>

              <div className={`flex flex-col gap-3.5 ${!userImage ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Scale (Zoom)</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    disabled={!userImage}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" /> Horizontal (X) Shift</span>
                    <span>{offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="1"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseInt(e.target.value))}
                    disabled={!userImage}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" /> Vertical (Y) Shift</span>
                    <span>{offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="1"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseInt(e.target.value))}
                    disabled={!userImage}
                  />
                </div>
              </div>
            </div>

            {/* Hidden Input file picker */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={triggerUpload}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <FileImage className="w-4 h-4 text-indigo-500" />
                <span>Upload File</span>
              </button>
              
              <button
                onClick={() => {
                  const camInput = document.createElement('input');
                  camInput.type = 'file';
                  camInput.accept = 'image/*';
                  camInput.setAttribute('capture', 'user');
                  camInput.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLoading(true);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                          setUserImage(img);
                          setZoom(1);
                          setOffsetX(0);
                          setOffsetY(0);
                          setLoading(false);
                        };
                        img.src = event.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  camInput.click();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Camera Pick</span>
              </button>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              disabled={exporting || !userImage}
              className="w-full py-4 px-6 rounded-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating HD Resolution (1080x1920)...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Campaign Poster (HD)</span>
                </>
              )}
            </button>

            {/* Social Share Grid */}
            <div className={`grid grid-cols-2 gap-3 ${!student ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                onClick={handleShareWhatsApp}
                disabled={!student}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Share</span>
              </button>
              
              <button
                onClick={handleInstagramShare}
                disabled={!student}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 hover:brightness-105 text-white flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Instagram Story</span>
              </button>
            </div>
          </div>

          {/* Referral Invitations QR code */}
          {qrCodeUrl && student && (
            <div className="glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                Your Referral Scan Card
              </div>
              
              <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="Referral Link QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Scan code to register under {displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs break-all font-mono select-all">
                  {student.referrerLink}
                </span>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-slate-200/50 dark:border-slate-800/50 py-4 px-4 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Campaign Canvas Renderer v2.0 • Double tap canvas to reset positioning
        </p>
      </footer>
    </div>
  );
}

export default function CampaignEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING STUDIO EDITING ROOM...</p>
      </div>
    }>
      <CampaignEditContent />
    </Suspense>
  );
}
