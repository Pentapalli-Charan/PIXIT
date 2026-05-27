import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, CreditCard, LogOut, Check, ArrowLeft, Loader, AlertCircle, HelpCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Settings state
  const [emailNotification, setEmailNotification] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Subscription state
  const [subData, setSubData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [canceling, setCanceling] = useState(false);

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

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
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

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6">Please log in to view your profile and account settings.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-[var(--pixit-primary)] text-black font-extrabold px-6 py-2 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Quota usage simulation
  const isPremium = subData && subData.plan_name !== 'Free';
  const stylizationsUsed = isPremium ? 142 : 12;
  const stylizationsLimit = isPremium ? 'Unlimited' : 15;
  const resolutionLimit = isPremium ? (subData.plan_name === 'Enterprise' ? 'Lossless RAW' : '4K UHD') : '1080p';

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
        <div className="mb-6 bg-[var(--pixit-primary)]/10 border border-[var(--pixit-primary)]/30 text-[var(--pixit-primary)] text-sm p-4 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Tabs (Sidebar style) */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl font-black text-[var(--pixit-primary)] mb-4 uppercase">
              {user.username[0]}
            </div>
            <h3 className="font-extrabold text-sm text-white">{user.username}</h3>
            <span className="text-gray-500 text-xs mt-0.5 uppercase tracking-wider font-semibold">
              {isPremium ? `${subData?.plan_name} Developer` : 'Creator Account'}
            </span>
          </div>

          {/* Simulated Usage Stats Card */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[var(--pixit-primary)]" /> AI Quota Usage
            </h4>
            
            {/* Limit 1 */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-gray-400">Stylizations</span>
                <span>{stylizationsUsed} / {stylizationsLimit}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--pixit-primary)]" 
                  style={{ width: isPremium ? '70%' : `${(stylizationsUsed / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Limit 2 */}
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">Resolution Max</span>
              <span className="text-[var(--pixit-primary)]">{resolutionLimit}</span>
            </div>
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
              <User className="w-4 h-4 text-[var(--pixit-primary)]" /> General Profile Information
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
                    value={loadingSub ? 'Loading...' : `${subData?.plan_name || 'Free'} Tier`} 
                    disabled 
                    className="w-full bg-[var(--pixit-primary)]/5 border border-[var(--pixit-primary)]/10 rounded-lg p-2.5 text-[var(--pixit-primary)] text-xs font-bold cursor-not-allowed"
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

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-[var(--pixit-primary)] text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl hover:shadow-[0_4px_15px_rgba(182,255,0,0.25)] transition cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Billing Plan panel */}
          <div className="bg-[#111115]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--pixit-primary)]" /> Subscription & Invoicing
            </h2>

            {loadingSub ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-6 h-6 text-[var(--pixit-primary)] animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-[var(--pixit-primary)]/20 bg-[var(--pixit-primary)]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-sm text-white">
                      {subData?.plan_name || 'Free'} Tier {subData?.status === 'canceled' && <span className="text-red-400 text-[10px] font-black uppercase">(Cancelled)</span>}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                      {subData?.plan_name === 'Free' 
                        ? 'Unlock high-fidelity 4K output, model training, and priority rendering speeds by upgrading.'
                        : `Your plan is currently ${subData?.status}. Billing cycle: ${subData?.billing_cycle}.`
                      }
                    </p>
                    {subData?.current_period_end && (
                      <p className="text-[var(--pixit-primary)] text-[10px] font-bold mt-1">
                        {subData?.status === 'canceled' ? 'Expires' : 'Renews'} on: {new Date(subData.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="shrink-0">
                    {subData?.plan_name === 'Free' ? (
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="w-full sm:w-auto bg-[var(--pixit-primary)] text-black font-black text-xs uppercase px-5 py-2.5 rounded-xl hover:shadow-[0_0_15px_var(--pixit-primary)] transition cursor-pointer"
                      >
                        Upgrade Plan
                      </button>
                    ) : (
                      subData?.status !== 'canceled' && (
                        <button 
                          onClick={handleCancelSubscription}
                          disabled={canceling}
                          className="w-full sm:w-auto bg-transparent border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-500 font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition cursor-pointer"
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

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
