import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Heart, Zap, ArrowRight, Eye } from 'lucide-react';

const FILTERS = [
  {
    id: 'anime',
    name: '🌸 Anime Illustration',
    category: 'Artistic',
    desc: 'Soft cel shading, high saturation highlights, and black outline accents mimicking modern anime style.',
    intensityLabel: 'Hue & saturation boost scale',
    premium: false,
    likes: 245
  },
  {
    id: 'cartoon',
    name: '🎨 Classic Cartoon',
    category: 'Artistic',
    desc: 'Crisp borders, flat color zones, and hand-drawn line boundaries using adaptive bilateral threshing.',
    intensityLabel: 'Bilateral color pooling passes',
    premium: false,
    likes: 189
  },
  {
    id: 'cyberpunk',
    name: '🏙️ Cyberpunk Neon',
    category: 'Styling',
    desc: 'Transforms photos into a neon cityscape using hot pink and deep cyan color grading and glow highlights.',
    intensityLabel: 'Neon shift intensity',
    premium: true,
    likes: 412
  },
  {
    id: 'pixar',
    name: '🧸 Pixar claymation',
    category: 'Styling',
    desc: 'Clay-like skin smoothing and high 3D ambient saturation to emulate classic animated characters.',
    intensityLabel: 'Smoothing factor',
    premium: true,
    likes: 382
  },
  {
    id: 'pencil',
    name: '✏️ Pencil Sketch',
    category: 'Artistic',
    desc: 'Classical black and white pencil sketch drawing effect created via division of inverted gaussian blurs.',
    intensityLabel: 'Pencil shading density',
    premium: false,
    likes: 153
  },
  {
    id: 'watercolor',
    name: '💧 Watercolor Ink',
    category: 'Artistic',
    desc: 'Simulates bleeding watercolor pigments and dark damp margins blended with light pencil strokes.',
    intensityLabel: 'Pigment bleed range',
    premium: false,
    likes: 198
  },
  {
    id: 'oil',
    name: '🖌️ Oil Painting',
    category: 'Artistic',
    desc: 'Simulates traditional oil paint brushstrokes and light impasto details using fast styling matrices.',
    intensityLabel: 'Stroke length & coarseness',
    premium: true,
    likes: 264
  },
  {
    id: 'vintage',
    name: '🎞️ Vintage Vignette',
    category: 'Styling',
    desc: 'Warm sepia toning, simulated film grain noise, and soft radial vignette shadows.',
    intensityLabel: 'Vignette shadow radius',
    premium: false,
    likes: 120
  },
  {
    id: 'cinematic',
    name: '🎬 Dramatic Cinematic',
    category: 'Styling',
    desc: 'Applies a dramatic movie-like S-curve color lut with cold shadows and warm skin tones.',
    intensityLabel: 'Contrast curve depth',
    premium: false,
    likes: 310
  },
  {
    id: 'neon',
    name: '⚡ Glowing Edges',
    category: 'Styling',
    desc: 'Extracts lines using Canny edge filters and applies a glowing colorful outline overlay.',
    intensityLabel: 'Glow blur radius',
    premium: true,
    likes: 289
  },
  {
    id: 'enhance',
    name: '⚡ CLAHE HD Enhance',
    category: 'Enhance',
    desc: 'Performs Adaptive Histogram Equalization to restore local lighting details and boost highlights.',
    intensityLabel: 'Contrast clip limit scale',
    premium: false,
    likes: 541
  },
  {
    id: 'sharpen',
    name: '🎯 Intelligent Sharpening',
    category: 'Enhance',
    desc: 'Restores soft edges using Laplacian high-frequency kernels to boost sharpness.',
    intensityLabel: 'Kernel sharpening scale',
    premium: false,
    likes: 177
  },
  {
    id: 'denoise',
    name: '🧹 Bilateral Denoising',
    category: 'Enhance',
    desc: 'Clean low-light sensor noise and compression artifacts without blurring edge boundaries.',
    intensityLabel: 'Denoising threshold scale',
    premium: true,
    likes: 204
  },
  {
    id: 'upscale',
    name: '🔎 Lanczos 2x Upscaler',
    category: 'Enhance',
    desc: 'Double your output size using Lanczos-4 high-fidelity interpolation to prevent pixelation.',
    intensityLabel: 'Upscale aspect multiplier',
    premium: true,
    likes: 495
  },
  {
    id: 'face_enhance',
    name: '👩 Portrait Smooth',
    category: 'Enhance',
    desc: 'Bilateral portrait skin smoothing and minor shadow lift for high quality headshots.',
    intensityLabel: 'Skin smoothing weight',
    premium: false,
    likes: 356
  },
  {
    id: 'background_removal',
    name: '✂️ GrabCut BG Removal',
    category: 'Styling',
    desc: 'Iterative foreground subject segmenter to output a transparent PNG canvas cutout.',
    intensityLabel: 'Fixed segment iterations',
    premium: true,
    likes: 622
  }
];

const FilterMarketplace = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [likedFilters, setLikedFilters] = useState({});

  const handleToggleLike = (id, e) => {
    e.stopPropagation();
    setLikedFilters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTryFilter = (id) => {
    navigate('/workspace', { state: { tryStyle: id } });
  };

  const filtered = FILTERS.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || f.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-8 w-full max-w-6xl mx-auto px-4 text-white">
      {/* Hero Banner */}
      <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--pixit-primary)]/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black tracking-widest text-[var(--pixit-primary)] uppercase mb-4 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> AI Filter Directory
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
          DISCOVER NEURAL EFFECTS
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Browse and test our production-ready OpenCV matrix kernels. Instantly apply these artistic filters to your images directly in our neural editor.
        </p>

        {/* Search and Filters row */}
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search neural filters, upscalers, styling effects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:border-[var(--pixit-primary)] text-white transition placeholder-gray-600"
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            {['All', 'Artistic', 'Styling', 'Enhance'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase transition cursor-pointer select-none ${
                  category === cat
                    ? 'bg-[var(--pixit-primary)] text-black'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(filter => {
          const isLiked = !!likedFilters[filter.id];
          return (
            <div
              key={filter.id}
              onClick={() => handleTryFilter(filter.id)}
              className="group bg-[#111115]/80 border border-slate-800 rounded-3xl p-5 hover:border-[var(--pixit-primary)]/40 hover:-translate-y-1 transition duration-300 shadow-xl flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-400 uppercase tracking-wider">
                    {filter.category}
                  </span>
                  
                  {filter.premium && (
                    <span className="text-[10px] font-black px-2 py-1 bg-orange-600/20 border border-orange-500 text-orange-500 rounded-lg uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-current" /> PRO
                    </span>
                  )}
                </div>

                {/* Filter info */}
                <h3 className="text-lg font-black group-hover:text-[var(--pixit-primary)] transition mb-2">
                  {filter.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-6">
                  {filter.desc}
                </p>
              </div>

              {/* Bottom statistics and button */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={(e) => handleToggleLike(filter.id, e)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                  <span>{filter.likes + (isLiked ? 1 : 0)}</span>
                </button>

                <div className="text-xs font-black uppercase text-gray-400 group-hover:text-[var(--pixit-primary)] transition flex items-center gap-1">
                  <span>Try Style</span> <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-12 text-center text-gray-500 shadow-2xl">
          <Search className="w-12 h-12 mx-auto mb-4 text-slate-700" />
          <h3 className="text-lg font-black text-white mb-1">No neural filters matched your search</h3>
          <p className="text-sm">Try typing different search keywords or select another filter category pill.</p>
        </div>
      )}
    </div>
  );
};

export default FilterMarketplace;
