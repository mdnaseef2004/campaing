"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  UserCheck, 
  Sun, 
  Moon, 
  QrCode,
  CheckCircle,
  FileImage
} from 'lucide-react';
import { getSubmissionById, StudentSubmission } from '@/lib/db';
import { getCampaignTemplates, CAMPAIGN_TEMPLATES, PosterTemplate } from '@/lib/templates';

function EditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Theme state
  const [isDark, setIsDark] = useState(false);

  // Student Profile states
  const [student, setStudent] = useState<StudentSubmission | null>(null);
  
  // Custom name state (so user can edit spelling or format dynamically on poster!)
  const [displayName, setDisplayName] = useState('');

  // Selected Template
  const [allTemplates, setAllTemplates] = useState<PosterTemplate[]>(CAMPAIGN_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate>(CAMPAIGN_TEMPLATES[0]);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (selectedTemplate?.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        setTemplateImage(img);
      };
      img.src = selectedTemplate.backgroundImage;
    } else {
      setTemplateImage(null);
    }
  }, [selectedTemplate?.backgroundImage]);

  // Image manipulation states
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  
  // Editor status
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Canvas Refs
  const workspaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load theme and retrieve student profile
  useEffect(() => {
    // Load custom templates
    getCampaignTemplates().then(templates => {
      setAllTemplates(templates);
      setSelectedTemplate(templates[0]);
    });
    
    // Theme sync
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);

    // Retrieve student ID from query parameter
    const id = searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('mkc_registered_id') : '');
    
    if (id) {
      (async () => {
        const profile = await getSubmissionById(id);
        if (profile) {
          setStudent(profile);
          setDisplayName(profile.name || '');
          
          // Generate QR Code of referral link
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
      })();
    }
    
    // Fallback if no ID is found (e.g. redirect back to landing so they don't break)
    console.warn('No valid student registration session found.');
  }, [searchParams]);

  // Render/Draw Canvas Workspace
  useEffect(() => {
    drawWorkspace();
  }, [selectedTemplate, templateImage, userImage, zoom, offsetX, offsetY, displayName, student]);

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

  // Image loader helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        
        // Reset transform values on new image upload
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

  // Core Canvas Drawing Engine
  const drawWorkspace = (highRes: boolean = false): HTMLCanvasElement | null => {
    const canvas = workspaceCanvasRef.current;
    if (!canvas && !highRes) return null;

    // We can generate a high-res version dynamically, or draw the local workspace
    const drawCanvas = highRes ? document.createElement('canvas') : canvas!;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return null;

    const t = selectedTemplate;
    
    // Scale parameters
    if (highRes) {
      drawCanvas.width = t.width;
      drawCanvas.height = t.height;
    } else {
      // Workspace display resolution (e.g. scaled for UI display)
      drawCanvas.width = 450;
      drawCanvas.height = 800;
    }

    const scale = drawCanvas.width / t.width;

    // 1. Draw Background
    if (t.backgroundImage && templateImage) {
      ctx.drawImage(templateImage, 0, 0, drawCanvas.width, drawCanvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, drawCanvas.height);
      gradient.addColorStop(0, t.backgroundGradient.from);
      if (t.backgroundGradient.via) {
        gradient.addColorStop(0.5, t.backgroundGradient.via);
      }
      gradient.addColorStop(1, t.backgroundGradient.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    // 2. Draw Decorative Shapes
    t.shapes.forEach(shape => {
      ctx.save();
      ctx.globalAlpha = shape.opacity;
      ctx.fillStyle = shape.fillColor;
      
      // Apply shadow if defined
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

    // 3. Draw User Uploaded Image inside Bounding Frame with Clipping Mask
    const fx = t.frame.x * scale;
    const fy = t.frame.y * scale;
    const fw = t.frame.width * scale;
    const fh = t.frame.height * scale;
    const fRadius = t.frame.borderRadius * scale;
    // Determine shape from raw template values (resolution-independent)
    const isCircular = t.frame.borderRadius >= Math.min(t.frame.width, t.frame.height) / 2;

    const drawFramePath = (ctx2: CanvasRenderingContext2D) => {
      ctx2.beginPath();
      if (isCircular) {
        ctx2.arc(fx + fw / 2, fy + fh / 2, fw / 2, 0, Math.PI * 2);
      } else {
        ctx2.roundRect ? ctx2.roundRect(fx, fy, fw, fh, fRadius) : ctx2.rect(fx, fy, fw, fh);
      }
    };

    ctx.save();
    drawFramePath(ctx);
    ctx.clip();

    // Draw user photo if provided, otherwise draw clean placeholder
    if (userImage) {
      // Bounding box mapping + custom zoom & offsets
      const imgWidth = userImage.width;
      const imgHeight = userImage.height;
      
      // Calculate aspect fill ratios
      const scaleX = fw / imgWidth;
      const scaleY = fh / imgHeight;
      const baseScale = Math.max(scaleX, scaleY);
      
      // Compute final draw sizes
      const dw = imgWidth * baseScale * zoom;
      const dh = imgHeight * baseScale * zoom;
      
      // Compute centered position plus custom drag offsets
      const dx = fx + (fw - dw) / 2 + (offsetX * scale);
      const dy = fy + (fh - dh) / 2 + (offsetY * scale);

      ctx.drawImage(userImage, dx, dy, dw, dh);
    } else {
      // Transparent placeholder — the background image (or white box in template) shows through
      // If the template has a background image, show NO overlay at all — the white box in the image guides the user
      if (!t.backgroundImage) {
        // Gradient-based template: show a subtle dashed outline + hint text
        ctx.setLineDash([8 * scale, 6 * scale]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5 * scale;
        drawFramePath(ctx);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.arc(fx + fw / 2, fy + fh / 2, 28 * scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `600 ${14 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Tap to upload photo', fx + fw / 2, fy + fh / 2 + 52 * scale);
      }
      // If backgroundImage: completely transparent — the white box in the design is the natural guide
    }
    ctx.restore();

    // 4. Draw Poster Frame Stroke Border (Overlayed on top of image edge)
    ctx.save();
    ctx.strokeStyle = t.frame.borderColor;
    ctx.lineWidth = t.frame.borderWidth * scale;
    ctx.shadowColor = t.frame.shadowColor;
    ctx.shadowBlur = t.frame.shadowBlur * scale;
    drawFramePath(ctx);
    ctx.stroke();
    ctx.restore();

    // 5. Draw Badge Header Text
    ctx.save();
    ctx.fillStyle = t.badge.fillColor;
    const bX = t.badge.x * scale;
    const bY = t.badge.y * scale;
    const bFS = t.badge.fontSize * scale;
    const bPX = t.badge.paddingX * scale;
    const bPY = t.badge.paddingY * scale;
    
    ctx.font = `bold ${bFS}px sans-serif`;
    const textWidth = ctx.measureText(t.badge.text).width;
    
    // Draw badge capsule pill
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bX - textWidth / 2 - bPX, bY - bFS / 2 - bPY, textWidth + bPX * 2, bFS + bPY * 2, t.badge.borderRadius * scale) : ctx.rect(bX - textWidth / 2 - bPX, bY - bFS / 2 - bPY, textWidth + bPX * 2, bFS + bPY * 2);
    ctx.fill();

    // Draw badge text
    ctx.fillStyle = t.badge.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.badge.text, bX, bY + 1 * scale);
    ctx.restore();

    // 6. Draw Typography Text Elements (Logo, Slogans, Name, Student ID)
    t.textElements.forEach(el => {
      ctx.save();
      ctx.fillStyle = el.textColor;
      ctx.textAlign = el.align;

      const fontWt = el.fontWeight || 'bold';
      const elFS = el.fontSize * scale;
      ctx.font = `${fontWt} ${elFS}px ${el.fontFamily || 'sans-serif'}`;

      // Swap variables like {NAME}, {ID}, {CATEGORY} dynamically!
      let contentText = el.text;
      if (el.type === 'name') {
        contentText = displayName.toUpperCase() || 'STUDENT NAME';
      } else if (el.type === 'id-tag') {
        const idStr = student ? student.id : 'STU-XXXXXX';
        const catStr = student?.category || 'SSLC';
        contentText = el.text.replace('{ID}', idStr).replace('{CATEGORY}', catStr);
      }

      const tx = el.x * scale;
      const ty = el.y * scale;

      // Draw text glow if defined
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

  // High Resolution HD Image Exporter
  const handleDownload = () => {
    setExporting(true);
    
    // Run composite renderer on high-res canvas (1080x1920)
    setTimeout(() => {
      const highResCanvas = drawWorkspace(true);
      if (!highResCanvas) {
        setExporting(false);
        return;
      }

      // Convert canvas target to high-quality png file stream
      const fileUrl = highResCanvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.download = `MKC_Campaign_${displayName.replace(/\s+/g, '_') || 'Student'}_1080x1920.png`;
      link.href = fileUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
      setExportSuccess(true);
      
      // Auto close success alert after 4 seconds
      setTimeout(() => setExportSuccess(false), 4000);
    }, 500);
  };

  // Pre-filled WhatsApp Status Sized Sharing
  const handleShareWhatsApp = () => {
    const textMsg = `Hey! I just designed my custom election poster for the *MKC Student Campaign 2026*! 🌟 \n\nClick on my unique link below to register, design yours, and help me top the campaign leaderboards! 🤝👇\n\n🔗 ${student?.referrerLink || ''}`;
    const encMsg = encodeURIComponent(textMsg);
    window.open(`https://api.whatsapp.com/send?text=${encMsg}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      
      {/* Dynamic Background Grid */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Editor Header Navigation */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold text-xs md:text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <span className="font-extrabold text-sm md:text-base tracking-tight text-slate-950 dark:text-white">
          POSTER CREATOR
        </span>

        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 text-slate-700 dark:text-slate-300 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Workspace Panel Split Grid */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Side: Visual Interactive Canvas Preview Container */}
        <section className="lg:col-span-6 flex flex-col items-center justify-center gap-4">
          
          {/* Notification Alerts */}
          {exportSuccess && (
            <div className="w-full max-w-[450px] p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold animate-pulse">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Poster exported in high resolution (1080x1920) successfully! Check your downloads.</span>
            </div>
          )}

          {/* Glowing Neon Display Card */}
          <div className="w-full max-w-[450px] aspect-[9/16] rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center p-2.5">
            <div className="absolute inset-0 bg-slate-950 opacity-10 pointer-events-none" />
            
            {/* Real Canvas Context */}
            <canvas 
              ref={workspaceCanvasRef} 
              onClick={triggerUpload}
              className="w-full h-full rounded-2xl shadow-inner cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all bg-slate-900 duration-200"
              style={{ maxHeight: 'calc(100vh - 220px)', aspectRatio: '9/16' }}
            />


            {/* Quick Loading Indicator */}
            {loading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-sm font-semibold tracking-wider">Processing image...</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold text-center italic">
            💡 Tap inside the poster frame to upload or change your photo.
          </p>
        </section>

        {/* Right Side: Interactive Controls and Customizer Tools */}
        <section className="lg:col-span-6 flex flex-col gap-6 w-full max-w-[480px] mx-auto lg:max-w-none">
          
          {/* Header Description */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              Customize Campaign Poster
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Personalize your registration name, try on different aesthetic layout designs, position your face exactly, and download the finished status size frame.
            </p>
          </div>

          {/* Form and Image Transform Sliders */}
          <div className="glass-panel rounded-3xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-5">
            
            {/* Display Name Input */}
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
                className="px-4 py-3 rounded-xl glass-input font-bold"
              />
            </div>

            {/* Template Selector Grid — Poster Backdrop Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Poster Template
              </label>
              <div className="grid grid-cols-3 gap-3">
                {allTemplates.map((template) => {
                  const isActive = selectedTemplate.id === template.id;
                  const isCustom = !!template.backgroundImage;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                        isActive
                          ? 'border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:scale-[1.01]'
                      }`}
                      title={template.name}
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-[9/16] relative overflow-hidden">
                        {isCustom ? (
                          <img
                            src={template.backgroundImage}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              background: `linear-gradient(to bottom, ${template.backgroundGradient.from}, ${template.backgroundGradient.via || template.backgroundGradient.to}, ${template.backgroundGradient.to})`
                            }}
                          />
                        )}
                        {/* Active check badge */}
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {/* Custom badge */}
                        {isCustom && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white text-[8px] font-bold uppercase tracking-wider">
                            Custom
                          </div>
                        )}
                      </div>
                      {/* Name label */}
                      <div className="w-full bg-slate-900/90 dark:bg-slate-950/90 px-1.5 py-1.5 text-center">
                        <span className={`text-[9px] font-bold leading-tight block truncate ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {template.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Image Placement Sliders (Only active if image is uploaded!) */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Photo Positioning Controls
                </span>
                {!userImage && (
                  <span className="text-[10px] text-amber-500 font-semibold uppercase animate-pulse">
                    Upload photo first to activate
                  </span>
                )}
              </div>

              {/* Sliders Container */}
              <div className={`flex flex-col gap-3.5 ${!userImage ? 'opacity-40 pointer-events-none' : ''}`}>
                
                {/* Scale (Zoom) Slider */}
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

                {/* Horizontal Offset Slider */}
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

                {/* Vertical Offset Slider */}
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

            {/* Hidden native input file trigger */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Multi Image Upload / Camera Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={triggerUpload}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <FileImage className="w-4 h-4 text-indigo-500" />
                <span>Choose File</span>
              </button>
              
              {/* Native mobile camera picker trigger */}
              <button
                onClick={() => {
                  const camInput = document.createElement('input');
                  camInput.type = 'file';
                  camInput.accept = 'image/*';
                  camInput.setAttribute('capture', 'user'); // Triggers front camera natively
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
                <span>Open Camera</span>
              </button>
            </div>

          </div>

          {/* Output and Distribution Actions */}
          <div className="flex flex-col gap-3">
            
            {/* HD Download Button */}
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

            {/* Social Share grid */}
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
                onClick={() => {
                  alert("To share on Instagram Story: \n1. Download the HD Poster. \n2. Open Instagram > Create Story. \n3. Select downloaded WhatsApp status size (1080x1920) image. \n4. Add your unique link: " + (student?.referrerLink || '') + " using the 'Link Sticker'!");
                }}
                disabled={!student}
                className="py-3 px-4 rounded-xl font-bold text-xs md:text-sm bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 hover:brightness-105 text-white flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Instagram Story</span>
              </button>
            </div>

          </div>

          {/* Referral Invites QR Code Capsule */}
          {qrCodeUrl && student && (
            <div className="glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/80 flex flex-col items-center justify-center gap-4 text-center">
              
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                Your Referral Scan Card
              </div>
              
              <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="My Unique Referral QR Code Link" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Scan to register with {displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs break-all font-mono select-all">
                  {student.referrerLink}
                </span>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* Editor Footer */}
      <footer className="w-full glass-panel border-t border-slate-200/50 dark:border-slate-800/50 py-4 px-4 text-center mt-auto">
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
          Campaign Canvas Renderer v2.0 • Double tap poster to reset zoom offsets
        </p>
      </footer>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING POSTER STUDIO...</p>
      </div>
    }>
      <EditPageContent />
    </Suspense>
  );
}
