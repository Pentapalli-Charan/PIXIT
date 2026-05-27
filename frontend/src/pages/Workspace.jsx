import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UploadZone, StyleSelector, BeforeAfterSlider } from '../components';
import { Sliders, Download, Share2, RefreshCw, AlertCircle, Sparkles, Check, Trash2, ArrowLeft, MessageSquare, Send, X, Layers, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Workspace = () => {
  const { user, profile, refreshProfile, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Core state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [stylizationId, setStylizationId] = useState(null);
  
  // Settings & Filter states
  const [style, setStyle] = useState('cartoon');
  const [intensity, setIntensity] = useState(0.5);
  const [contrast, setContrast] = useState(1.0);
  const [brightness, setBrightness] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [exportFormat, setExportFormat] = useState('png');

  // Batch states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchUrls, setBatchUrls] = useState([]);
  const [batchResults, setBatchResults] = useState([]);

  // Status states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [progress, setProgress] = useState(0);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const showToast = (text, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // AI Chat Assistant state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I am your PIXIT AI Stylization Assistant. How can I help you customize your canvas today?" }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Auto load state from location (if user clicked "Try Style" from gallery/marketplace)
  useEffect(() => {
    if (location.state) {
      if (location.state.tryStyle) {
        setStyle(location.state.tryStyle);
        showToast(`Preselected filter style: ${location.state.tryStyle}`, 'success');
      }
      if (location.state.originalUrl) {
        setPreviewUrl(location.state.originalUrl);
        setSelectedFile("remote");
      }
      if (location.state.projectId) {
        setProjectId(location.state.projectId);
      }
    }
  }, [location.state]);

  // Simulate progress bar on processing
  useEffect(() => {
    let interval;
    if (isProcessing) {
      setProgress(5);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
      setProjectId(null);
      setStylizationId(null);
      setError(null);
      setSuccessMsg(null);
      setIsPublic(false);
      showToast("Original image loaded successfully.", "success");
    }
  };

  const handleFileSelectEvent = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Batch Mode uploads
  const handleBatchFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + batchFiles.length > 5) {
      setError("Maximum batch size is 5 images.");
      showToast("Batch limit exceeded (Max 5)", "error");
      return;
    }
    const newFiles = [...batchFiles, ...files];
    setBatchFiles(newFiles);
    setBatchUrls(newFiles.map(f => URL.createObjectURL(f)));
    showToast(`Added ${files.length} images to batch queue.`, 'success');
  };

  const handleClearBatch = () => {
    setBatchFiles([]);
    setBatchUrls([]);
    setBatchResults([]);
    setError(null);
    showToast("Batch queue cleared.", "success");
  };

  const handleProcessImage = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedFile) {
      setError("Please choose or drag an image first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const settings = { intensity, contrast, brightness };

    try {
      let data;
      if (projectId && selectedFile === "remote") {
        data = await api.restylizeProject(projectId, style, settings, prompt, tags);
      } else {
        data = await api.uploadImage(selectedFile, style, settings, prompt, tags);
      }

      setProcessedUrl(data.processed_url);
      setProjectId(data.project_id);
      setStylizationId(data.stylization_id);
      setIsPublic(data.is_public);
      setStyle(data.style); // Update style if prompt mapping shifted it
      setSuccessMsg("OpenCV canvas matrix stylization completed!");
      showToast("Stylization successfully completed!", "success");
      
      // Update global context profile for credits count
      refreshProfile();
    } catch (err) {
      console.error(err);
      setError(err.message || "Stylization failed. Please verify connection.");
      showToast(err.message || "Failed to process image.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessBatch = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (batchFiles.length === 0) {
      setError("Please select files to process.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setBatchResults([]);

    const settings = { intensity, contrast, brightness };

    try {
      const data = await api.uploadBatch(batchFiles, style, settings);
      setBatchResults(data.results);
      setSuccessMsg(`Successfully processed ${data.results.length} images in batch!`);
      showToast("Batch process completed!", "success");
      refreshProfile();
    } catch (err) {
      setError(err.message || "Batch process failed.");
      showToast("Batch processing encountered errors.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleShare = async () => {
    if (!stylizationId) return;
    setIsSaving(true);
    try {
      const data = await api.togglePublicVisibility(stylizationId, !isPublic, tags);
      setIsPublic(data.is_public);
      const msg = data.is_public ? "Added to public community showcase!" : "Removed from community showcase!";
      setSuccessMsg(msg);
      showToast(msg, "success");
    } catch (err) {
      setError("Failed to update visibility settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setProjectId(null);
    setStylizationId(null);
    setError(null);
    setSuccessMsg(null);
    setIsPublic(false);
    setIntensity(0.5);
    setContrast(1.0);
    setBrightness(0);
    setPrompt('');
    setTags('');
    showToast("Workspace canvas reset.", "success");
  };

  // AI Chat Assistant suggestion trigger
  const handleChatSuggest = (text, targetStyle) => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text },
      { sender: 'bot', text: `Got it! I have set the filter style to **${targetStyle}**. Feel free to customize fine-tuning sliders or click Apply to start.` }
    ]);
    setStyle(targetStyle);
    showToast(`Assistant loaded: ${targetStyle}`, 'success');
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Check user text against keywords for mock response
    setTimeout(() => {
      const textLower = userText.toLowerCase();
      if (textLower.includes('cyberpunk') || textLower.includes('neon')) {
        setStyle('cyberpunk');
        setChatMessages(prev => [...prev, { sender: 'bot', text: "Cyberpunk Neon pre-selected! This applies bright cyan/pink highlights." }]);
      } else if (textLower.includes('pixar') || textLower.includes('cartoon')) {
        setStyle('pixar');
        setChatMessages(prev => [...prev, { sender: 'bot', text: "Toy Claymation cartoon pre-selected! Enjoy the soft 3D highlights." }]);
      } else if (textLower.includes('face') || textLower.includes('portrait')) {
        setStyle('face_enhance');
        setChatMessages(prev => [...prev, { sender: 'bot', text: "Skin smoothing and portrait enhancer selected! Excellent for avatars." }]);
      } else if (textLower.includes('remove') || textLower.includes('bg')) {
        setStyle('background_removal');
        setChatMessages(prev => [...prev, { sender: 'bot', text: "GrabCut background cutout selected. Transparent PNG output ready." }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: "I recommend checking our Marketplace tab to preview all matrix transformations!" }]);
      }
    }, 450);
  };

  const isProUser = profile?.subscription?.plan_name && profile?.subscription?.plan_name !== 'Free';

  return (
    <div className="py-8 w-full max-w-6xl mx-auto px-4 text-white relative">
      {/* Toast Overlay */}
      <div className="fixed top-24 right-6 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`p-4 rounded-xl border shadow-xl flex items-center gap-2 pointer-events-auto transition duration-300 animate-slide-in ${
              t.type === 'error' 
                ? 'bg-red-950/90 border-red-500/40 text-red-400' 
                : 'bg-black/90 border-[var(--pixit-primary)]/40 text-[var(--pixit-primary)]'
            }`}
          >
            {t.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span className="text-xs font-black tracking-wide">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Sparkles className="text-[var(--pixit-primary)] w-7 h-7" /> PIXIT NEURAL EDITOR
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Enhance and stylize images using customizable OpenCV filters.
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider border px-4 py-2.5 rounded-xl transition cursor-pointer ${
              isBatchMode
                ? 'bg-[var(--pixit-primary)] text-black border-transparent'
                : 'bg-transparent border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> {isBatchMode ? "Single Mode" : "Batch Mode"}
          </button>
          
          {(previewUrl || batchFiles.length > 0) && (
            <button 
              onClick={isBatchMode ? handleClearBatch : handleReset}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider bg-transparent border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT SIDE: Canvas / Files Preview */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-[var(--pixit-primary)] h-full transition-all duration-300 shadow-[0_0_8px_var(--pixit-primary)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {!isBatchMode ? (
            /* SINGLE IMAGE MODE */
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelectEvent} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />

              {!previewUrl ? (
                <UploadZone onUploadClick={handleUploadClick} onFileSelect={handleFileSelect} />
              ) : (
                <div className="flex flex-col">
                  <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-4 flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden relative shadow-2xl">
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        <div className="w-14 h-14 border-4 border-[var(--pixit-primary)]/30 border-t-[var(--pixit-primary)] rounded-full animate-spin mb-4"></div>
                        <span className="text-[var(--pixit-primary)] font-black text-sm uppercase tracking-widest animate-pulse">
                          Processing Canvas ({progress}%)
                        </span>
                        <span className="text-gray-500 text-xs mt-1">Applying OpenCV matrix algorithms...</span>
                      </div>
                    )}

                    {processedUrl ? (
                      <BeforeAfterSlider 
                        beforeImage={previewUrl} 
                        afterImage={processedUrl} 
                        height="h-[300px] md:h-[450px]"
                      />
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Source Preview" 
                        className="w-full h-full max-h-[450px] object-contain rounded-2xl"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BATCH PROCESSING MODE */
            <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-2xl min-h-[300px] flex flex-col justify-between">
              <input
                type="file"
                multiple
                ref={batchFileInputRef}
                onChange={handleBatchFileSelect}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />

              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                  <h3 className="font-black text-sm uppercase tracking-widest text-gray-300">Batch Processing Queue</h3>
                  <span className="text-xs bg-[var(--pixit-primary)]/10 text-[var(--pixit-primary)] px-2.5 py-1 rounded-lg border border-[var(--pixit-primary)]/20 font-black">
                    {batchFiles.length} / 5 Images
                  </span>
                </div>

                {batchFiles.length === 0 ? (
                  <div 
                    onClick={() => batchFileInputRef.current.click()}
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center hover:border-[var(--pixit-primary)]/30 transition cursor-pointer"
                  >
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                    <p className="font-bold text-sm text-gray-400">Click to import batch images</p>
                    <p className="text-[10px] text-gray-600 mt-1">Supports up to 5 JPG/PNG photos simultaneously</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {batchUrls.map((url, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden aspect-square border border-slate-800 group">
                        <img src={url} alt="Batch thumbnail" className="w-full h-full object-cover" />
                        
                        {batchResults[i] && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                            <a 
                              href={batchResults[i].processed_url} 
                              download={`pixit_batch_${i}.png`}
                              className="p-2 bg-[var(--pixit-primary)] rounded-full text-black hover:scale-105 transition"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    {batchFiles.length < 5 && (
                      <div 
                        onClick={() => batchFileInputRef.current.click()}
                        className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center aspect-square text-gray-500 hover:border-white/20 transition cursor-pointer"
                      >
                        <span className="text-xl font-bold">+</span>
                        <span className="text-[10px]">Add More</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {batchFiles.length > 0 && (
                <div className="mt-8 pt-4 border-t border-white/5 flex justify-end gap-3">
                  <button
                    onClick={handleClearBatch}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleProcessBatch}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-[var(--pixit-primary)] text-black rounded-xl text-xs font-black uppercase tracking-wider hover:shadow-[0_4px_15px_rgba(182,255,0,0.2)] transition cursor-pointer disabled:opacity-50"
                  >
                    Process Batch
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status & Error Logs */}
          {error && (
            <div className="flex items-center gap-3 bg-red-950/20 border border-red-500/30 text-red-500 text-sm p-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="flex items-center gap-3 bg-[var(--pixit-primary)]/10 border border-[var(--pixit-primary)]/30 text-[var(--pixit-primary)] text-sm p-4 rounded-2xl">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="font-extrabold">{successMsg}</span>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Parameters / Controls */}
        <div className="lg:col-span-5 bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
          
          {/* User Credits Widget */}
          {user && profile && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div>
                <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Generation Tokens</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white font-black text-sm">{isProUser ? 'Unlimited' : profile.credits} left</span>
                  <span className="px-2 py-0.5 bg-orange-600/10 border border-orange-500/20 text-orange-500 rounded-md text-[9px] font-black uppercase">
                    {profile.subscription?.plan_name || 'Free'}
                  </span>
                </div>
              </div>
              
              {!isProUser && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-[var(--pixit-primary)]/10 border border-[var(--pixit-primary)]/30 text-[var(--pixit-primary)] px-3 py-1.5 rounded-xl font-bold hover:bg-[var(--pixit-primary)] hover:text-black transition text-[10px] cursor-pointer"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}

          <h2 className="text-lg font-black pb-4 border-b border-white/5 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--pixit-primary)]" /> Fine-Tuning Panel
          </h2>

          <StyleSelector style={style} setStyle={setStyle} isProcessing={isProcessing} />

          {/* Prompt input for custom stylizations */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Prompt-Based AI Stylization (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. 'Make it cyberpunk with high contrast' or 'soft anime illustration'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-black/60 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[var(--pixit-primary)] placeholder-gray-600"
            />
          </div>

          {/* Tagging field */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Community Gallery Tags (Comma separated)
            </label>
            <input 
              type="text"
              placeholder="e.g. 'sunset, retro, character'"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-black/60 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[var(--pixit-primary)] placeholder-gray-600"
            />
          </div>

          {/* Configuration Sliders */}
          <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Parameter Calibration</h3>
            
            {/* Slider 1: Filter Intensity */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Filter Intensity</span>
                <span className="text-[var(--pixit-primary)] font-black">{(intensity * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                disabled={isProcessing || style === "background_removal"}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--pixit-primary)] disabled:opacity-30"
              />
            </div>

            {/* Slider 2: Contrast */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Contrast Multiplier</span>
                <span className="text-[var(--pixit-primary)] font-black">{contrast.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="1.8"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--pixit-primary)]"
              />
            </div>

            {/* Slider 3: Brightness Offset */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Brightness Bias</span>
                <span className="text-[var(--pixit-primary)] font-black">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input 
                type="range"
                min="-60"
                max="60"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--pixit-primary)]"
              />
            </div>
          </div>

          {/* Export Options & Actions */}
          <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-6">
            {!processedUrl ? (
              <button 
                type="button"
                onClick={handleProcessImage}
                disabled={isProcessing || !previewUrl || isBatchMode}
                className="w-full bg-[var(--pixit-primary)] text-black font-black py-4.5 rounded-2xl hover:shadow-[0_4px_25px_rgba(182,255,0,0.3)] transition duration-200 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                APPLY RENDER STYLIZATION
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Export format picker */}
                <div className="flex items-center justify-between text-xs px-2.5 pb-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold">Export Format</span>
                  <div className="flex gap-2">
                    {['png', 'jpg'].map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`px-2 py-0.5 rounded-md font-black uppercase text-[10px] ${
                          exportFormat === fmt 
                            ? 'bg-[var(--pixit-primary)] text-black' 
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <a 
                    href={processedUrl}
                    download={`pixit_artwork_${style}.${exportFormat}`}
                    onClick={() => {
                      if (!isProUser) {
                        showToast("Exported with watermarks (Upgrade to remove)", "error");
                      } else {
                        showToast("HD watermark-free raw design downloaded!", "success");
                      }
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[var(--pixit-primary)] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(182,255,0,0.3)] transition cursor-pointer text-center text-sm"
                  >
                    <Download className="w-4 h-4" /> Download {exportFormat.toUpperCase()}
                  </a>
                  
                  <button 
                    type="button"
                    onClick={handleToggleShare}
                    disabled={isSaving}
                    className={`flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border transition cursor-pointer text-sm ${
                      isPublic 
                        ? 'bg-orange-600/20 border-orange-500 text-orange-500 hover:bg-orange-600/35' 
                        : 'bg-[#111115] border-white/10 text-white hover:bg-white/5'
                    }`}
                  >
                    <Share2 className="w-4 h-4" /> {isPublic ? "Unshare Design" : "Share Design"}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  className="w-full bg-[#111115] border border-white/10 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition cursor-pointer text-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Re-apply Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING AI CHAT ASSISTANT DRAWER */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 transition duration-200 cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </button>
        ) : (
          <div className="w-80 h-96 bg-[#111115] border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900/60 p-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--pixit-primary)]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">AI Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-[var(--pixit-primary)]/10 text-[var(--pixit-primary)] border border-[var(--pixit-primary)]/20' 
                      : 'bg-black/60 text-gray-300 border border-slate-800/50'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Suggestions buttons */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
              <button 
                onClick={() => handleChatSuggest("Portrait enhancement recommendations", "face_enhance")}
                className="bg-black/40 hover:bg-black/80 border border-white/5 text-[9px] text-gray-400 hover:text-white px-2 py-1 rounded-lg cursor-pointer"
              >
                Portrait Smooth
              </button>
              <button 
                onClick={() => handleChatSuggest("Cut out background please", "background_removal")}
                className="bg-black/40 hover:bg-black/80 border border-white/5 text-[9px] text-gray-400 hover:text-white px-2 py-1 rounded-lg cursor-pointer"
              >
                BG Cutout
              </button>
              <button 
                onClick={() => handleChatSuggest("Make it cyberpunk", "cyberpunk")}
                className="bg-black/40 hover:bg-black/80 border border-white/5 text-[9px] text-gray-400 hover:text-white px-2 py-1 rounded-lg cursor-pointer"
              >
                Cyberpunk FX
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSubmit} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Ask assistant to select a filter style..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--pixit-primary)] placeholder-gray-600"
              />
              <button type="submit" className="p-2 bg-[var(--pixit-primary)] rounded-xl text-black hover:scale-105 transition cursor-pointer">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};

export default Workspace;
