import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, CreditCard, LogOut, Check, ArrowLeft, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Settings state
  const [emailNotification, setEmailNotification] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6">Please log in to view your profile and account settings.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-[#B0FF00] text-black font-extrabold px-6 py-2 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 w-full max-w-4xl mx-auto px-4 text-white">
      {/* Title */}
      <div className="mb-10 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-[#111115] border border-white/5 text-gray-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-black">ACCOUNT SETTINGS</h1>
          <p className="text-gray-500 text-xs mt-1">Manage your credentials, subscription plan, and privacy options.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 bg-[#B0FF00]/10 border border-[#B0FF00]/30 text-[#B0FF00] text-sm p-4 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs (Sidebar style) */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl font-black text-[#B0FF00] mb-4 uppercase">
              {user.username[0]}
            </div>
            <h3 className="font-extrabold text-sm text-white">{user.username}</h3>
            <span className="text-gray-500 text-xs mt-0.5 uppercase tracking-wider font-semibold">Creator Account</span>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-xs font-bold py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log out of Account
          </button>
        </div>

        {/* Configurations Forms (Main panel) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Profile details */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-[#B0FF00]" /> General Profile Information
            </h2>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 text-xs font-bold mb-1.5 uppercase">Username</label>
                  <input 
                    type="text" 
                    value={user.username} 
                    disabled 
                    className="w-full bg-black/40 border border-slate-800 rounded-lg p-2.5 text-gray-400 text-xs font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs font-bold mb-1.5 uppercase">Plan Status</label>
                  <input 
                    type="text" 
                    value="Free Canvas Starter" 
                    disabled 
                    className="w-full bg-[#B0FF00]/5 border border-[#B0FF00]/10 rounded-lg p-2.5 text-[#B0FF00] text-xs font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1.5 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={user.email || `${user.username}@pixit-editor.com`} 
                  disabled
                  className="w-full bg-black/40 border border-slate-800 rounded-lg p-2.5 text-gray-400 text-xs font-medium cursor-not-allowed"
                />
              </div>

              {/* Checkboxes */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="rounded border-slate-800 text-[#B0FF00] focus:ring-[#B0FF00]"
                  />
                  <span className="text-gray-300 text-xs font-semibold">Notify me about processing updates and server status.</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={marketingEmail}
                    onChange={(e) => setMarketingEmail(e.target.checked)}
                    className="rounded border-slate-800 text-[#B0FF00] focus:ring-[#B0FF00]"
                  />
                  <span className="text-gray-300 text-xs font-semibold">Receive emails on trending styles and gallery highlights.</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-[#B0FF00] text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl hover:shadow-[0_4px_15px_rgba(176,255,0,0.25)] transition cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Billing Plan upgrade mockup */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#B0FF00]" /> Subscription Tiers
            </h2>
            <div className="p-4 rounded-xl border border-[#B0FF00]/20 bg-[#B0FF00]/5 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-sm text-white">Free Starter Tier</div>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">You are currently using the free model playground. Limits: 5 saved projects maximum.</p>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#B0FF00] text-black font-black text-[10px] uppercase px-4 py-2 rounded-lg hover:shadow-[0_0_10px_#B0FF00] transition cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
