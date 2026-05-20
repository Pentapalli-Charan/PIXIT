import React from 'react';
import StyleSelector from './StyleSelector';

const ImagePreview = ({
  previewUrl,
  processedUrl,
  isProcessing,
  error,
  style,
  setStyle,
  onUploadClick,
  onProcessImage
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-gray-700 bg-black/40 mb-4">
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-[#B0FF00]/30 border-t-[#B0FF00] rounded-full animate-spin mb-4"></div>
            <span className="text-white font-bold animate-pulse">Running Neural Engine...</span>
          </div>
        )}
        <img 
          src={processedUrl || previewUrl} 
          alt="Preview" 
          className="w-full h-full object-contain"
        />
        {processedUrl && (
          <div className="absolute top-3 right-3 bg-[#B0FF00] text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ✨ AI Styled
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm font-semibold mb-4 bg-red-500/10 p-2 rounded w-full text-center border border-red-500/20">
          {error}
        </div>
      )}

      {/* Filter Selection */}
      {!processedUrl && (
        <StyleSelector 
          style={style} 
          setStyle={setStyle} 
          isProcessing={isProcessing} 
        />
      )}

      <div className="flex gap-3 w-full">
        <button 
          onClick={onUploadClick}
          className="flex-1 bg-transparent border border-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
          disabled={isProcessing}
        >
          Change Image
        </button>
        {!processedUrl && (
          <button 
            onClick={onProcessImage}
            className="flex-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 px-6 rounded-lg font-bold hover:shadow-[0_4px_12px_rgba(217,72,15,0.4)] transition disabled:opacity-50"
            disabled={isProcessing}
          >
            Apply Filter 🚀
          </button>
        )}
        {processedUrl && (
          <a 
            href={processedUrl}
            download="pixit_ai_artwork.jpg"
            target="_blank"
            className="flex-2 flex justify-center items-center bg-[#B0FF00] text-black py-3 px-6 rounded-lg font-bold hover:shadow-[0_4px_15px_rgba(176,255,0,0.4)] transition text-center"
          >
            Download Output
          </a>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
