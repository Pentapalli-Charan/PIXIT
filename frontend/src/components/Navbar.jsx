import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Image, History, User as UserIcon, LogOut, Sliders } from 'lucide-react';

const Navbar = () => {
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) => 
    `text-sm font-bold transition flex items-center gap-2 px-3 py-1.5 rounded-lg select-none ${
      isActive 
        ? 'text-[var(--pixit-primary)] bg-white/5' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="fixed top-0 left-0 w-full z-50 p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-[#111115]/80 rounded-2xl px-6 py-3 border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 select-none cursor-pointer">
          <svg width="74" height="28" viewBox="0 0 105 40" style={{ verticalAlign: 'middle' }}>
              <text x="0" y="32" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="34" letterSpacing="-3">
                  <tspan fill="var(--pixit-primary)">PIX</tspan><tspan fill="#FFFFFF">IT</tspan>
              </text>
              <circle cx="86" cy="30" r="5" fill="var(--pixit-primary)"/>
          </svg>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex gap-4 items-center">
          <NavLink to="/" className={linkClass}>
            <span>🚀</span> Home
          </NavLink>
          <NavLink to="/workspace" className={linkClass}>
            <Sliders className="w-4 h-4" /> Editor
          </NavLink>
          <NavLink to="/gallery" className={linkClass}>
            <Image className="w-4 h-4" /> Community
          </NavLink>
          <NavLink to="/pricing" className={linkClass}>
            <span>💎</span> Pricing
          </NavLink>
          {user && (
            <NavLink to="/history" className={linkClass}>
              <History className="w-4 h-4" /> Saved Library
            </NavLink>
          )}
        </div>

        {/* Actions / Auth States */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/profile"
                className="bg-transparent text-gray-400 font-bold px-3 py-2 hover:text-white transition flex items-center gap-2 cursor-pointer text-sm"
              >
                <UserIcon className="w-4 h-4 text-[var(--pixit-primary)]" /> {user.username}
              </Link>
              <button 
                type="button"
                onClick={handleLogout}
                className="bg-transparent border border-slate-800 text-gray-400 hover:text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-900 transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-5 py-2.5 rounded-xl font-black hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(217,72,15,0.4)] transition cursor-pointer text-xs uppercase"
              >
                Login
              </button>
              <Link 
                to="/workspace"
                className="bg-slate-900 border border-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition cursor-pointer text-xs"
              >
                ✨ Try Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
