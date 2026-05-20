import React from 'react';

const HeroSection = () => {
  const BADGES = ['⚡ AI Powered', '💎 HD Output', '⏱️ Fast Processing', '🛡️ No Watermark'];

  return (
    <div className="flex-1">
      <div className="inline-flex items-center gap-2 bg-[#B0FF00]/10 text-[#B0FF00] px-4 py-2 rounded-full text-xs font-bold mb-6 border border-[#B0FF00]/20">
        <div className="w-2 h-2 bg-[#B0FF00] rounded-full shadow-[0_0_8px_#B0FF00]"></div>
        Live · AI-Powered · 5 Neural Art Styles
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight text-white">
        Transform Your<br/>Photos<br/>Into <span className="text-[#B0FF00]">AI Artwork</span>
      </h1>
      
      <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
        The world's most advanced neural stylization engine. Turn any portrait, landscape, or pet photo into a stunning professional masterpiece in under 5 seconds using Advanced Deep Learning & OpenCV filters.
      </p>

      <div className="flex flex-wrap gap-3 mb-10">
        {BADGES.map(badge => (
          <span key={badge} className="bg-white/5 border border-gray-800 px-4 py-2 rounded-full text-sm font-semibold text-white">
            <span className="text-[#B0FF00] mr-1">{badge.split(' ')[0]}</span> 
            {badge.split(' ').slice(1).join(' ')}
          </span>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
