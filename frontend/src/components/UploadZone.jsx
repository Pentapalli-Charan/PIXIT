import React, { useState } from 'react';
import { Upload } from 'lucide-react';

const UploadZone = ({ onUploadClick, onFileSelect }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onUploadClick}
      className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 h-[340px] select-none ${
        isDragActive 
          ? 'bg-[var(--pixit-primary)]/5 border-[var(--pixit-primary)] shadow-[0_0_20px_rgba(182,255,0,0.15)] scale-[0.99]' 
          : 'bg-[#111115]/80 border-slate-800 hover:border-[var(--pixit-primary)]/50 hover:bg-[#15151a]'
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
        isDragActive ? 'scale-110 bg-[var(--pixit-primary)]/20 text-[var(--pixit-primary)]' : 'bg-slate-900 text-gray-400'
      }`}>
        <Upload className="w-7 h-7" />
      </div>
      <h3 className="text-white font-extrabold text-lg mb-2">Drag & Drop Image</h3>
      <p className="text-gray-500 text-xs mb-6 max-w-xs leading-relaxed">
        Supports JPEG, PNG, and WebP formats. <br />
        Maximum file size limit: 10MB.
      </p>
      <button 
        type="button"
        className="bg-[var(--pixit-primary)] text-black px-6 py-2.5 rounded-xl font-black hover:shadow-[0_4px_15px_rgba(182,255,0,0.3)] transition pointer-events-none"
      >
        Select Image
      </button>
    </div>
  );
};

export default UploadZone;
