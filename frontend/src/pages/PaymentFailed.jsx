import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="py-16 max-w-md mx-auto px-4 text-center text-white">
      {/* Alert Icon */}
      <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
        <AlertTriangle className="w-20 h-20 text-red-500 relative z-10" />
      </div>

      <h1 className="text-2xl font-black tracking-tight uppercase">TRANSACTION REJECTED</h1>
      <p className="text-red-400 text-xs font-bold uppercase mt-2 tracking-widest">
        Gateway Authorization Failed
      </p>

      <div className="my-8 p-6 rounded-2xl border border-red-500/10 bg-red-500/5 text-left text-xs font-semibold leading-relaxed text-gray-300">
        <p className="font-bold text-white mb-2">Common Troubleshooting Steps:</p>
        <ul className="list-disc pl-4 space-y-1.5 text-gray-400">
          <li>Verify your card number, expiry, and CVV codes.</li>
          <li>Ensure you have sufficient funds in your sandbox or real account.</li>
          <li>Ensure your card is enabled for international transactions if testing internationally.</li>
          <li>Retry or contact support if the issue persists.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/pricing')}
          className="w-full py-4 bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white font-black text-xs uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RefreshCcw className="w-4 h-4" /> Retry Payment Flow
        </button>
        <button
          onClick={() => navigate('/workspace')}
          className="w-full py-3.5 bg-slate-900 border border-slate-800 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Return to Workspace
        </button>
      </div>
    </div>
  );
};

export default PaymentFailed;
