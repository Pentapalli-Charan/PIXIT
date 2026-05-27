import React from 'react';

const CATEGORIES = {
  Artistic: [
    { id: 'cartoon', label: '🎨 Cartoon', desc: 'Crisp borders & flat colors' },
    { id: 'anime', label: '🌸 Anime', desc: 'Soft shading & vibrant tones' },
    { id: 'pencil', label: '✏️ Pencil Sketch', desc: 'Classic black & white drawing' },
    { id: 'watercolor', label: '💧 Watercolor', desc: 'Artistic pigment bleeds' },
    { id: 'oil', label: '🖌️ Oil Painting', desc: 'Thick canvas oil textures' }
  ],
  Styling: [
    { id: 'cyberpunk', label: '🏙️ Cyberpunk', desc: 'Vibrant neon teal & pink grading' },
    { id: 'pixar', label: '🧸 Pixar Clay', desc: 'Claymation smoothing & highlights' },
    { id: 'vintage', label: '🎞️ Vintage Film', desc: 'Sepia tone & vignette shadow' },
    { id: 'cinematic', label: '🎬 Cinematic', desc: 'Dramatic shadows & high contrast' },
    { id: 'neon', label: '⚡ Glowing Edges', desc: 'Bright glowing contour outline' },
    { id: 'background_removal', label: '✂️ BG Remove', desc: 'Subject cutout transparent PNG' }
  ],
  Enhance: [
    { id: 'enhance', label: '⚡ HD Enhance', desc: 'Denoise, sharpen & boost lighting' },
    { id: 'sharpen', label: '🎯 Sharp Detail', desc: 'High frequency edge sharpening' },
    { id: 'denoise', label: '🧹 Clean Denoise', desc: 'Low light sensor noise cleanup' },
    { id: 'upscale', label: '🔎 Lanczos 2x', desc: 'Double dimensions interpolation' },
    { id: 'face_enhance', label: '👩 Face Smooth', desc: 'Bilateral portrait skin smooth' }
  ]
};

const StyleSelector = ({ style, setStyle, isProcessing }) => {
  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {Object.entries(CATEGORIES).map(([catName, list]) => (
        <div key={catName} className="flex flex-col gap-3">
          <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-1">
            {catName} Styles
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {list.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                disabled={isProcessing}
                className={`flex flex-col text-left p-3 rounded-2xl border transition cursor-pointer select-none ${
                  style === s.id 
                    ? 'bg-[var(--pixit-primary)]/10 border-[var(--pixit-primary)] shadow-[0_0_15px_rgba(182,255,0,0.15)]' 
                    : 'bg-black/40 border-white/10 hover:border-[var(--pixit-primary)]/40 text-gray-300 hover:text-white'
                }`}
              >
                <span className={`font-black text-xs mb-1 ${style === s.id ? 'text-[var(--pixit-primary)]' : ''}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-gray-500 line-clamp-1 leading-normal">
                  {s.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StyleSelector;
