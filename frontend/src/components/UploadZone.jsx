import React from 'react';

const UploadZone = ({ onUploadClick }) => {
  return (
    <div 
      onClick={onUploadClick}
      className="border-2 border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#B0FF00]/50 transition bg-black/40 h-[300px]"
    >
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-2xl">
        📸
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Upload an Image</h3>
      <p className="text-gray-500 text-sm mb-6">Click to browse your files</p>
      <button className="bg-[#B0FF00] text-black px-6 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(176,255,0,0.4)] transition pointer-events-none">
        Select Image
      </button>
    </div>
  );
};

export default UploadZone;
