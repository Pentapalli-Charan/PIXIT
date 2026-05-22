import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UploadZone, StyleSelector, BeforeAfterSlider } from '../components';
import { Sliders, Download, Share2, RefreshCw, AlertCircle, Sparkles, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Workspace = () => {
  const { user, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

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

  // Status states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isPublic, setIsPublic] = useState(false);

  // Auto load state from location (if user clicked "Try Style" from gallery or history)
  useEffect(() => {
    if (location.state) {
      if (location.state.tryStyle) {
        setStyle(location.state.tryStyle);
      }
      if (location.state.originalUrl) {
        setPreviewUrl(location.state.originalUrl);
        // We set selectedFile as a placeholder string to indicate we have an original image
        setSelectedFile("remote");
      }
      if (location.state.projectId) {
        setProjectId(location.state.projectId);
      }
    }
  }, [location.state]);

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
    }
  };

  const handleFileSelectEvent = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
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

    const settings = {
      intensity,
      contrast,
      brightness
    };

    try {
      let data;
      if (projectId && selectedFile === "remote") {
        // Re-stylizing an existing project
        data = await api.restylizeProject(projectId, style, settings);
      } else {
        // New upload stylization
        data = await api.uploadImage(selectedFile, style, settings);
      }

      setProcessedUrl(data.processed_url);
      setProjectId(data.project_id);
      setStylizationId(data.stylization_id);
      setIsPublic(data.is_public);
      setSuccessMsg("Filter applied successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Stylization failed. Please verify connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleShare = async () => {
    if (!stylizationId) return;
    setIsSaving(true);
    try {
      const data = await api.togglePublicVisibility(stylizationId, !isPublic);
      setIsPublic(data.is_public);
      setSuccessMsg(data.is_public ? "Added to public gallery!" : "Removed from public gallery!");
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
  };

  return (
    <div className="py-8 w-full max-w-6xl mx-auto px-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Sparkles className="text-[#B0FF00] w-7 h-7" /> PIXIT NEURAL EDITOR
          </h1>
          <p className="text-gray-500 text-xs mt-1">Enhance and stylize your images in seconds using OpenCV.</p>
        </div>
        {previewUrl && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider bg-transparent border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Start New
          </button>
        )}
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Upload & Image Canvas (8 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
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
              {/* Canvas Container */}
              <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-4 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden relative shadow-2xl">
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <div className="w-14 h-14 border-4 border-[#B0FF00]/30 border-t-[#B0FF00] rounded-full animate-spin mb-4"></div>
                    <span className="text-[#B0FF00] font-black text-sm uppercase tracking-widest animate-pulse">
                      Processing AI Canvas
                    </span>
                    <span className="text-gray-500 text-xs mt-1">Applying OpenCV matrix transformations...</span>
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

              {/* Status messages */}
              {error && (
                <div className="mt-4 flex items-center gap-3 bg-red-950/20 border border-red-500/30 text-red-500 text-sm p-4 rounded-2xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}
              
              {successMsg && (
                <div className="mt-4 flex items-center gap-3 bg-[#B0FF00]/10 border border-[#B0FF00]/30 text-[#B0FF00] text-sm p-4 rounded-2xl">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="font-extrabold">{successMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Options & Configurations (5 cols) */}
        <div className="lg:col-span-5 bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
          <h2 className="text-lg font-black pb-4 border-b border-white/5 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#B0FF00]" /> Filter Adjustment Panel
          </h2>

          <StyleSelector style={style} setStyle={setStyle} isProcessing={isProcessing} />

          {/* Configuration Sliders */}
          <div className="flex flex-col gap-5 border-t border-white/5 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Parameter Fine-Tuning</h3>
            
            {/* Slider 1: Filter Intensity */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Filter Intensity</span>
                <span className="text-[#B0FF00] font-black">{(intensity * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                disabled={isProcessing || style === "background_removal"}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B0FF00] disabled:opacity-30"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Controls bilateral iterations or blur radii.</span>
            </div>

            {/* Slider 2: Contrast */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Contrast Multiplier</span>
                <span className="text-[#B0FF00] font-black">{contrast.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="1.8"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B0FF00]"
              />
            </div>

            {/* Slider 3: Brightness Offset */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-gray-300">Brightness Bias</span>
                <span className="text-[#B0FF00] font-black">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input 
                type="range"
                min="-60"
                max="60"
                step="5"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B0FF00]"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-6">
            {!processedUrl ? (
              <button 
                type="button"
                onClick={handleProcessImage}
                disabled={isProcessing || !previewUrl}
                className="w-full bg-[#B0FF00] text-black font-black py-4.5 rounded-2xl hover:shadow-[0_4px_25px_rgba(176,255,0,0.3)] transition duration-200 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                APPLY RENDER STYLIZATION
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <a 
                    href={processedUrl}
                    download={`pixit_artwork_${style}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#B0FF00] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_4px_20px_rgba(176,255,0,0.3)] transition cursor-pointer text-center text-sm"
                  >
                    <Download className="w-4 h-4" /> Download HD
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
                    <Share2 className="w-4 h-4" /> {isPublic ? "Unshare Design" : "Share to Gallery"}
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
    </div>
  );
};

export default Workspace;
