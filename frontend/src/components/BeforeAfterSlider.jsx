import React, { useState, useRef, useEffect } from 'react';

const BeforeAfterSlider = ({ beforeImage, afterImage, height = "h-[450px]" }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${height} rounded-3xl overflow-hidden shadow-2xl border border-white/10 select-none group cursor-ew-resize`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Full background) */}
      <img 
        src={afterImage} 
        alt="Stylized Output" 
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
      />

      {/* Before Image (Clipped overlay) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img 
          src={beforeImage} 
          alt="Original Input" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current?.getBoundingClientRect().width || '100%' }}
          draggable="false"
        />
      </div>

      {/* Slider Line Divider */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-[#B0FF00] shadow-[0_0_10px_#B0FF00] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-[#B0FF00] text-black border-4 border-black rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-4 left-4 bg-black/60 text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
        Original
      </span>
      <span className="absolute bottom-4 right-4 bg-[#B0FF00]/80 text-black font-extrabold text-xs px-3 py-1.5 rounded-full border border-[#B0FF00]/10 pointer-events-none">
        PIXIT Stylized
      </span>
    </div>
  );
};

export default BeforeAfterSlider;
