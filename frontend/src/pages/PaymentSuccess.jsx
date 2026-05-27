import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);

  // Parse params
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id') || 'mock_success';
  const plan = params.get('plan') || 'Pro';
  const cycle = params.get('cycle') || 'monthly';

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            session_id: sessionId,
            plan_name: plan,
            billing_cycle: cycle
          })
        });

        if (!response.ok) throw new Error("Verification failed");
        const data = await response.json();
        setSuccessInfo(data);
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setVerifying(false);
      }
    };

    verifyTransaction();
  }, [user, sessionId, plan, cycle]);

  if (verifying) {
    return (
      <div className="py-24 text-center max-w-md mx-auto text-white flex flex-col items-center justify-center gap-4">
        <Loader className="w-10 h-10 text-[var(--pixit-primary)] animate-spin" />
        <h2 className="text-lg font-black uppercase tracking-wider">Verifying Transaction...</h2>
        <p className="text-gray-500 text-xs">Please do not refresh or close this browser window.</p>
      </div>
    );
  }

  return (
    <div className="py-16 max-w-md mx-auto px-4 text-center text-white">
      {/* Pulse Check Icon */}
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-[var(--pixit-primary)]/10 rounded-full animate-ping"></div>
        <CheckCircle className="w-20 h-20 text-[var(--pixit-primary)] relative z-10" />
      </div>

      <h1 className="text-3xl font-black tracking-tight uppercase">CREATIVE ENGINE ACTIVE</h1>
      <p className="text-[var(--pixit-primary)] text-xs font-bold uppercase mt-2 tracking-widest">
        Transaction Confirmed
      </p>

      <div className="my-8 p-6 rounded-2xl border border-white/5 bg-[#111115]/50 text-left space-y-4 text-xs font-semibold">
        <div className="flex justify-between">
          <span className="text-gray-500">Plan Tier</span>
          <span className="text-white font-extrabold uppercase">{plan}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Billing Interval</span>
          <span className="text-white capitalize">{cycle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className="text-[var(--pixit-primary)]">Active</span>
        </div>
        {successInfo?.current_period_end && (
          <div className="flex justify-between">
            <span className="text-gray-500">Renewal Date</span>
            <span className="text-white">
              {new Date(successInfo.current_period_end).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/workspace')}
          className="w-full py-4 bg-[var(--pixit-primary)] text-black font-black text-xs uppercase rounded-xl hover:shadow-[0_0_15px_var(--pixit-primary)] transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          Launch Workspace <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="w-full py-3.5 bg-slate-900 border border-slate-800 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
