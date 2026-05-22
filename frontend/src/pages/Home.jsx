import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { HeroSection, UploadZone, ImagePreview } from '../components';

const Home = () => {
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const onRequestLogin = () => setIsAuthModalOpen(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const [style, setStyle] = useState('cartoon');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleProcessImage = async () => {
    if (!user) {
      onRequestLogin();
      return;
    }

    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = await api.uploadImage(selectedFile, style);
      setProcessedUrl(data.processed_url);
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        setError("Your session has expired. Please login again.");
        logout();
      } else {
        setError(err.message || 'Failed to process image');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-16 flex flex-col md:flex-row justify-between items-center gap-10">
      
      {/* Left Column */}
      <HeroSection />

      {/* Right Column / Image Upload Area */}
      <div className="flex-1 flex justify-center items-center w-full max-w-lg relative">
        <div className="w-full bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--pixit-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
          />

          {!previewUrl && !processedUrl && (
            <UploadZone onUploadClick={handleUploadClick} />
          )}

          {(previewUrl || processedUrl) && (
            <ImagePreview 
              previewUrl={previewUrl}
              processedUrl={processedUrl}
              isProcessing={isProcessing}
              error={error}
              style={style}
              setStyle={setStyle}
              onUploadClick={handleUploadClick}
              onProcessImage={handleProcessImage}
            />
          )}

        </div>
        
        {/* Floating decoration elements */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-[var(--pixit-primary)]/20 rounded-full blur-xl pointer-events-none z-[-1]"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-600/20 rounded-full blur-xl pointer-events-none z-[-1]"></div>
      </div>

    </div>
  );
};

export default Home;
