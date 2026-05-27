import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Sparkles, Zap, Shield, HelpCircle, ArrowRight } from 'lucide-react';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const { user, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      name: 'Free',
      icon: <Zap className="w-5 h-5 text-gray-400" />,
      desc: 'Perfect for exploring and casual creations.',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Standard processing queue',
        'Resolution limit: up to 1080p',
        'Standard style filters only',
        '5 projects storage limit',
        '10 downloads per day',
        'Community gallery support'
      ],
      notIncluded: [
        'Priority GPU processing',
        'Custom style model uploads',
        'Lossless RAW exports',
        'Commercial usage rights'
      ],
      cta: 'Get Started',
      color: 'border-slate-800 hover:border-slate-700 bg-[#111115]/50'
    },
    {
      name: 'Pro',
      icon: <Sparkles className="w-5 h-5 text-[var(--pixit-primary)]" />,
      desc: 'For digital artists and AI power users.',
      price: { monthly: 15, yearly: 10 },
      popular: true,
      features: [
        'Priority high-speed queue',
        'Resolution limit: up to 4K / UHD',
        'All neural & custom styles unlocked',
        'Unlimited projects storage',
        'Unlimited downloads',
        'High-fidelity PNG/JPEG exports',
        'Early access to new styles'
      ],
      notIncluded: [
        'Custom style model uploads',
        'Dedicated processing node'
      ],
      cta: 'Upgrade to Pro',
      color: 'border-[var(--pixit-primary)] bg-[var(--pixit-primary)]/5 shadow-[0_0_30px_rgba(182,255,0,0.05)]'
    },
    {
      name: 'Enterprise',
      icon: <Shield className="w-5 h-5 text-orange-500" />,
      desc: 'For professional studios and scale operations.',
      price: { monthly: 49, yearly: 33 },
      features: [
        'Dedicated single-tenant GPU node',
        'Lossless RAW & TIFF exports',
        'Custom-trained model uploads (LoRA)',
        'Private gallery & workspace storage',
        'Commercial use license',
        'Dedicated 24/7 technical support',
        'SLA guaranteed uptime'
      ],
      notIncluded: [],
      cta: 'Go Enterprise',
      color: 'border-orange-500/30 hover:border-orange-500/50 bg-[#151211]/50'
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (plan.name === 'Free') {
      navigate('/workspace');
      return;
    }

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          plan_name: plan.name,
          billing_cycle: billingCycle
        })
      });

      if (!response.ok) throw new Error("Failed to create checkout session");
      const data = await response.json();
      
      if (data.is_mock) {
        // Local checkout route
        navigate(data.url);
      } else {
        // External Stripe redirection
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      // Fallback local mock checkout page
      navigate(`/checkout?plan=${plan.name}&cycle=${billingCycle}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-12 max-w-6xl mx-auto px-4 text-white">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
          CHOOSE YOUR <span className="text-[var(--pixit-primary)]">CREATIVE SCALE</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          Upgrade to unlock premium AI style filters, raw 4K quality outputs, and high-priority processing speeds.
        </p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-[var(--pixit-primary)] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-[var(--pixit-primary)] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly Billing <span className="bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">Save 33%</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-stretch">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`relative rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 select-none ${plan.color}`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--pixit-primary)] text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-[0_4px_12px_rgba(182,255,0,0.3)]">
                Most Popular
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase text-gray-400 tracking-widest">{plan.name}</span>
                {plan.icon}
              </div>
              <p className="text-gray-400 text-xs mb-6 font-medium leading-relaxed">{plan.desc}</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl md:text-5xl font-black">${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}</span>
                <span className="text-gray-500 text-xs font-semibold">/ month</span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3.5 mb-8">
                {plan.features.map((feat, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[var(--pixit-primary)] shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs font-medium leading-normal">{feat}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feat, index) => (
                  <div key={index} className="flex items-start gap-3 opacity-30">
                    <span className="text-gray-500 text-sm font-bold w-4 text-center shrink-0 mt-0.5">—</span>
                    <span className="text-gray-400 text-xs font-medium leading-normal line-through">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={loadingPlan !== null}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                plan.popular
                  ? 'bg-[var(--pixit-primary)] text-black hover:shadow-[0_0_20px_var(--pixit-primary)]'
                  : 'bg-slate-900 border border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              {loadingPlan === plan.name ? 'Preparing Gateway...' : plan.cta} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="bg-[#111115]/40 border border-slate-800 rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-extrabold uppercase tracking-wide mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[var(--pixit-primary)]" /> Detailed Plan Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-4 text-gray-500 font-bold uppercase tracking-wider">Features</th>
                <th className="py-4 text-gray-300 font-bold uppercase tracking-wider text-center">Free</th>
                <th className="py-4 text-[var(--pixit-primary)] font-bold uppercase tracking-wider text-center">Pro</th>
                <th className="py-4 text-orange-500 font-bold uppercase tracking-wider text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              <tr>
                <td className="py-4 font-bold text-white">Daily AI Stylization Limits</td>
                <td className="py-4 text-center">15 images / day</td>
                <td className="py-4 text-center font-bold text-white">Unlimited</td>
                <td className="py-4 text-center font-bold text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-white">Maximum Canvas Resolution</td>
                <td className="py-4 text-center">1080p (Standard HD)</td>
                <td className="py-4 text-center">4K (Ultra HD)</td>
                <td className="py-4 text-center">Lossless RAW</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-white">GPU Processing Mode</td>
                <td className="py-4 text-center">Standard Queue</td>
                <td className="py-4 text-center">Priority Boost</td>
                <td className="py-4 text-center">Dedicated Node</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-white">LoRA / Model Fine-tuning</td>
                <td className="py-4 text-center text-gray-600">—</td>
                <td className="py-4 text-center text-gray-600">—</td>
                <td className="py-4 text-center">Included</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-white">API Usage Access</td>
                <td className="py-4 text-center text-gray-600">—</td>
                <td className="py-4 text-center">Custom integrations</td>
                <td className="py-4 text-center">Full SDK support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
