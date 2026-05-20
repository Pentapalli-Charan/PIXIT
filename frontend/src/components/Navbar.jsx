import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, setIsAuthModalOpen, logout } = useAuth();

  const handleLogoClick = (e) => {
    e.preventDefault();
    // In a routed app, this would navigate to "/"
  };

  const handleNavLinkClick = (e) => {
    e.preventDefault();
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-[#1A1A1A] rounded-xl px-6 py-3 border border-[#333] shadow-lg backdrop-blur-md bg-opacity-80">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <svg width="74" height="28" viewBox="0 0 105 40" style={{ verticalAlign: 'middle' }}>
              <text x="0" y="32" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="34" letterSpacing="-3">
                  <tspan fill="#B0FF00">PIX</tspan><tspan fill="#FFFFFF">IT</tspan>
              </text>
              <circle cx="86" cy="30" r="5" fill="#B0FF00"/>
          </svg>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex gap-6 items-center">
          <a href="#" onClick={handleNavLinkClick} className="text-gray-400 font-semibold hover:text-white transition flex items-center gap-2"><span>🚀</span> Home</a>
          <a href="#" onClick={handleNavLinkClick} className="text-gray-400 font-semibold hover:text-white transition flex items-center gap-2"><span>🪄</span> Neural Editor</a>
          <a href="#" onClick={handleNavLinkClick} className="text-gray-400 font-semibold hover:text-white transition flex items-center gap-2"><span>🎨</span> Gallery</a>
          <a href="#" onClick={handleNavLinkClick} className="text-gray-400 font-semibold hover:text-white transition flex items-center gap-2"><span>📚</span> AI Styles</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button 
                type="button"
                onClick={handleNavLinkClick}
                className="bg-transparent border-none text-gray-400 font-bold px-4 py-2 hover:text-white transition flex items-center gap-2 cursor-pointer"
              >
                👤 {user.username}
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); logout(); }}
                className="bg-transparent border border-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setIsAuthModalOpen(true); }}
                className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 py-2 rounded-lg font-bold hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(217,72,15,0.4)] transition cursor-pointer"
              >
                ➔ Login
              </button>
              <button 
                type="button"
                onClick={handleNavLinkClick}
                className="bg-[#1A1A1A] border border-[#444] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#222] hover:border-[#666] transition cursor-pointer"
              >
                ✨ Try Free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
