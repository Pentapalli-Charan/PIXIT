import React from 'react';

const STYLES = [
  { id: 'cartoon', label: '🎨 Cartoon', desc: 'Crisp borders & flat colors' },
  { id: 'anime', label: '🌸 Anime', desc: 'Soft shading & vibrant tones' },
  { id: 'pencil', label: '✏️ Pencil Sketch', desc: 'Classic black & white sketch' },
  { id: 'watercolor', label: '💧 Watercolor', desc: 'Artistic pigment & edge bleed' },
  { id: 'oil', label: '🖌️ Oil Painting', desc: 'Thick oil brush textures' },
  { id: 'enhance', label: '⚡ HD Enhance', desc: 'Denoise, sharpen & boost lighting' },
  { id: 'background_removal', label: '✂️ BG Remove', desc: 'Subject cutout via GrabCut' }
];

const StyleSelector = ({ style, setStyle, isProcessing }) => {
  return (
    <div className="w-full mb-6">
      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 block">
        Select Stylization Filter
      </label>
      <div className="grid grid-cols-2 gap-3">
        {STYLES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStyle(s.id)}
            disabled={isProcessing}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition cursor-pointer select-none ${
              style === s.id 
                ? 'bg-[#B0FF00]/10 border-[#B0FF00] shadow-[0_0_15px_rgba(176,255,0,0.1)]' 
                : 'bg-black/40 border-white/10 hover:border-[#B0FF00]/40 text-gray-300 hover:text-white'
            }`}
          >
            <span className={`font-bold text-sm mb-1 ${style === s.id ? 'text-[#B0FF00]' : ''}`}>
              {s.label}
            </span>
            <span className="text-[11px] text-gray-500 line-clamp-1 leading-normal">
              {s.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
