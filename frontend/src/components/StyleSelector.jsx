import React from 'react';

const STYLES = [
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'pencil', label: 'B&W Pencil' },
  { id: 'pencil_color', label: 'Color Pencil' },
  { id: 'ghibli', label: 'Ghibli Vibe' },
  { id: 'aesthetic', label: 'Aesthetic' }
];

const StyleSelector = ({ style, setStyle, isProcessing }) => {
  return (
    <div className="w-full mb-4">
      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">Choose AI Filter</label>
      <div className="flex flex-wrap gap-2">
        {STYLES.map(s => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            disabled={isProcessing}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              style === s.id 
                ? 'bg-[#B0FF00] text-black shadow-[0_0_10px_rgba(176,255,0,0.3)]' 
                : 'bg-black/50 text-gray-400 border border-gray-700 hover:border-[#B0FF00]/50 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
