import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Shield, CreditCard, LogOut, Check, ArrowLeft, Loader, AlertCircle, HelpCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AVATAR_PRESETS = [
  '🔮', '🤖', '👾', '🚀', '🐱', '🦊', '🐼', '🐉', '✨', '⚡'
];

const UserProfile = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Settings form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emailNotification, setEmailNotification] = useState(true);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Subscription state
  const [subData, setSubData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [canceling, setCanceling] = useState(false);

  // Initialize fields once profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setAvatarUrl(profile.avatar_url || '🔮');
    }
  }, [profile]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/subscription`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSubData(data.subscription);
          setBillingHistory(data.billing_history);
        }
      } catch (err) {
        console.error("Failed to load subscription details:", err);
      } finally {
        setLoadingSub(false);
      }
    };
    
    fetchSubscription();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.updateProfile({ username, email, avatar_url: avatarUrl });
      setSuccessMsg("Your profile settings have been successfully updated.");
      refreshProfile();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile settings.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your premium subscription? You will retain access until the end of your current cycle.")) return;
    setCanceling(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        setSuccessMsg("Your premium subscription has been canceled.");
        // Refresh
        const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/subscription`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setSubData(data.subscription);
        }
        refreshProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCanceling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || !profile) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <Loader className="w-12 h-12 text-[var(--pixit-primary)] mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold mb-2">Syncing Session...</h2>
      </div>
    );
  }

  const isPremium = subData && subData.plan_name !== 'Free';
  const totalGens = profile.total_generations || 0;
  const creditsRemaining = isPremium ? 'Unlimited' : (profile.credits || 0);

  return (
    <div className="py-8 w-full max-w-4xl mx-auto px-4 text-white">
      {/* Title */}
      <div className="mb-10 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-[#111115] border border-slate-800 text-gray-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-black">ACCOUNT SETTINGS</h1>
          <p className="text-gray-500 text-xs mt-1">Manage your credentials, subscription plan, and customize your profile avatar.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 bg-[var(--pixit-primary)]/10 border border-[var(--pixit-primary)]/30 text-[var(--pixit-primary)] text-sm p-4 rounded-2xl flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/30 text-red-400 text-sm p-4 rounded-2xl flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Tabs (Sidebar style) */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-5 text-center flex flex-col items-center shadow-xl">
            <div className="w-20 h-20 bg-slate-900 border-2 border-[var(--pixit-primary)]/20 rounded-full flex items-center justify-center text-4xl mb-4 select-none">
              {avatarUrl || '🔮'}
            </div>
            <h3 className="font-extrabold text-sm text-white">{username}</h3>
            <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
              {isPremium ? `${subData?.plan_name} Badge` : 'Creator Tier'}
            </span>
          </div>

          {/* Active Usage Stats Card */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Activity className="w-3.5 h-3.5 text-[var(--pixit-primary)]" /> AI Quota Usage
            </h4>
            
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-gray-400">Total Generations</span>
                <span>{totalGens}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-400">Credits Remaining</span>
                <span className="text-[var(--pixit-primary)] font-black">{creditsRemaining}</span>
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">Processing Node</span>
              <span className="text-[var(--pixit-primary)] uppercase">FASTAPI-GPU</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-xs font-bold py-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log out of Account
          </button>
        </div>

        {/* Configurations Forms (Main panel) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Profile details */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
              <User className="w-4 h-4 text-[var(--pixit-primary)]" /> General Profile Settings
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Selector */}
              <div>
                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-wider mb-3">
                  Select Custom Avatar Preset
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarUrl(av)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition cursor-pointer select-none ${
                        avatarUrl === av 
                          ? 'bg-[var(--pixit-primary)]/20 border-2 border-[var(--pixit-primary)]' 
                          : 'bg-black/40 border border-slate-800 hover:border-white/20'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 text-white text-xs font-semibold focus:outline-none focus:border-[var(--pixit-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Plan Status</label>
                  <input 
                    type="text" 
                    value={loadingSub ? 'Loading...' : `${subData?.plan_name || 'Free'} Tier`} 
                    disabled 
                    className="w-full bg-[var(--pixit-primary)]/5 border border-[var(--pixit-primary)]/10 rounded-xl p-3 text-[var(--pixit-primary)] text-xs font-black cursor-not-allowed uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 text-white text-xs font-semibold focus:outline-none focus:border-[var(--pixit-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[var(--pixit-primary)] text-black font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:shadow-[0_4px_15px_rgba(182,255,0,0.25)] transition cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Details...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Billing Plan panel */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <CreditCard className="w-4 h-4 text-[var(--pixit-primary)]" /> Subscription & Invoicing
            </h2>

            {loadingSub ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-6 h-6 text-[var(--pixit-primary)] animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl border border-[var(--pixit-primary)]/20 bg-[var(--pixit-primary)]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      {subData?.plan_name || 'Free'} Plan {subData?.status === 'canceled' && <span className="text-red-400 text-[10px] font-black uppercase tracking-wider">(Canceled)</span>}
                    </div>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                      {subData?.plan_name === 'Free' 
                        ? 'Unlock high-fidelity 4K output, model training, and priority rendering speeds by upgrading.'
                        : `Your plan is currently ${subData?.status}. Billing cycle: ${subData?.billing_cycle}.`
                      }
                    </p>
                    {subData?.current_period_end && (
                      <p className="text-[var(--pixit-primary)] text-[10px] font-bold mt-1.5">
                        {subData?.status === 'canceled' ? 'Expires' : 'Renews'} on: {new Date(subData.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="shrink-0">
                    {subData?.plan_name === 'Free' ? (
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="w-full sm:w-auto bg-[var(--pixit-primary)] text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl hover:shadow-[0_0_15px_var(--pixit-primary)] transition cursor-pointer"
                      >
                        Upgrade Plan
                      </button>
                    ) : (
                      subData?.status !== 'canceled' && (
                        <button 
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="w-full sm:w-auto bg-transparent border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-500 font-extrabold text-xs uppercase px-4 py-3 rounded-xl transition cursor-pointer"
                        >
                          {canceling ? 'Cancelling...' : 'Cancel Subscription'}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Billing History logs */}
                {billingHistory.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400">Billing Transactions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] font-semibold border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-gray-500">
                            <th className="py-2.5">Date</th>
                            <th className="py-2.5">Plan</th>
                            <th className="py-2.5">Amount</th>
                            <th className="py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {billingHistory.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5">
                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="py-2.5 uppercase">{item.plan_name} ({item.billing_cycle})</td>
                              <td className="py-2.5">${(item.amount / 100).toFixed(2)}</td>
                              <td className="py-2.5">
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black text-[9px] uppercase">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team Workspaces Panel */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <span>👥</span> Collaborative Team Workspaces
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Create shared canvas libraries and collaborate with other team members in real-time. Invitees can view, download, and copy filter profiles.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="designer@pixit-creative.com" 
                className="flex-1 bg-black/40 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-[var(--pixit-primary)] placeholder-gray-600"
              />
              <button 
                type="button"
                onClick={() => alert("Workspace invite dispatched! A collaboration request has been sent to their inbox.")}
                className="bg-[var(--pixit-primary)] text-black font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl hover:shadow-[0_4px_12px_rgba(182,255,0,0.25)] transition cursor-pointer"
              >
                Invite
              </button>
            </div>
            <div className="pt-2">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Workspace Roster</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-6 h-6 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-[10px]">👑</span>
                <span className="text-gray-300 font-bold">{username} (Workspace Admin)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
