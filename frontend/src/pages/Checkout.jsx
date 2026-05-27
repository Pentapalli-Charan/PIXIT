import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowLeft, CreditCard, Check, AlertCircle, RefreshCw } from 'lucide-react';

const Checkout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse plan details from query params
  const params = new URLSearchParams(location.search);
  const plan = params.get('plan') || 'Pro';
  const cycle = params.get('cycle') || 'monthly';

  const prices = {
    Pro: { monthly: 15, yearly: 120 },
    Enterprise: { monthly: 49, yearly: 399 }
  };

  const basePrice = prices[plan] ? prices[plan][cycle] : 15;

  // Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponError, setCouponError] = useState('');
  
  // Checkout Process State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(''); // 'authenticating', 'encrypting', 'authorizing', 'done'
  const [formError, setFormError] = useState('');

  // Auto-format card number as typed (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/.{1,4}/g);
    setCardNumber(matches ? matches.join(' ') : value);
  };

  // Auto-format expiry as typed (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  // Auto-format CVV (up to 3 digits)
  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  // Apply Coupon Code
  const applyCoupon = () => {
    setCouponError('');
    const code = coupon.toUpperCase().trim();
    if (code === 'PIXIT50') {
      setDiscount(0.5); // 50% off
      setCouponApplied(code);
    } else if (code === 'PIXITDEV') {
      setDiscount(1.0); // 100% off (Free Sandbox)
      setCouponApplied(code);
    } else {
      setCouponError('Invalid promo code');
    }
  };

  const finalPrice = Math.max(0, basePrice * (1 - discount));

  // Process Mock Checkout
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!cardName || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3) {
      setFormError('Please enter valid credit card details.');
      return;
    }

    setIsSubmitting(true);
    
    // Step 1: Simulated Handshake
    setCheckoutStep('Verifying Gateway Connection...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Step 2: Simulated Encryption
    setCheckoutStep('Encrypting Card Details (AES-256)...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Step 3: Server validation
    setCheckoutStep('Processing Sandbox Transaction...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          session_id: `cs_mock_${Math.random().toString(36).substring(7)}`,
          plan_name: plan,
          billing_cycle: cycle
        })
      });

      if (!response.ok) throw new Error("Verification failed");
      
      setCheckoutStep('Confirming Order Receipt...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      navigate(`/payment-success?plan=${plan}&cycle=${cycle}`);
    } catch (err) {
      console.error(err);
      navigate('/payment-failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto text-white">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Checkout Restricted</h2>
        <p className="text-gray-500 text-sm mb-6">Please log in to finalize your subscription checkout.</p>
        <button onClick={() => navigate('/pricing')} className="bg-[var(--pixit-primary)] text-black font-extrabold px-6 py-2 rounded-lg">Return to Pricing</button>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto px-4 text-white">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition text-xs font-bold mb-8 cursor-pointer select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to pricing plans
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Side: Card Details & Form */}
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-black uppercase">SECURE CHECKOUT</h1>
            <p className="text-gray-500 text-xs mt-1">Complete your subscription details using our secure sandbox gateway.</p>
          </div>

          {/* Hologram Card Preview */}
          <div className="relative h-44 w-full rounded-2xl p-6 bg-gradient-to-br from-zinc-900 to-black border border-white/10 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] select-none">
            {/* Card Hologram Accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--pixit-primary)]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="h-full flex flex-col justify-between relative z-10">
              <div className="flex items-start justify-between">
                {/* Chip */}
                <div className="w-10 h-8 rounded-md bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <div className="w-6 h-5 rounded-sm bg-amber-500/40 border border-amber-600/30"></div>
                </div>
                <span className="text-[var(--pixit-primary)] font-black text-sm tracking-tighter">PIXIT PAY</span>
              </div>

              {/* Card Number */}
              <div className="text-base md:text-lg font-mono tracking-widest text-zinc-300">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Cardholder Name</div>
                  <div className="text-[11px] font-bold text-white uppercase truncate max-w-[150px]">{cardName || 'Your Name'}</div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Expires</div>
                    <div className="text-[11px] font-mono font-bold text-white">{cardExpiry || 'MM/YY'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">CVV</div>
                    <div className="text-[11px] font-mono font-bold text-white">{cardCvv || '•••'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="CHARAN PENTAPALLI"
                className="w-full bg-[#111115] border border-slate-800 focus:border-[var(--pixit-primary)] rounded-xl p-3 text-xs font-semibold placeholder:text-zinc-700 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 2222 3333 4444"
                  className="w-full bg-[#111115] border border-slate-800 focus:border-[var(--pixit-primary)] rounded-xl p-3 pl-10 text-xs font-semibold placeholder:text-zinc-700 outline-none transition"
                />
                <CreditCard className="w-4 h-4 text-zinc-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Expiration Date</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  className="w-full bg-[#111115] border border-slate-800 focus:border-[var(--pixit-primary)] rounded-xl p-3 text-xs font-semibold placeholder:text-zinc-700 outline-none transition text-center"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">CVV Code</label>
                <input
                  type="password"
                  required
                  placeholder="123"
                  value={cardCvv}
                  onChange={handleCvvChange}
                  className="w-full bg-[#111115] border border-slate-800 focus:border-[var(--pixit-primary)] rounded-xl p-3 text-xs font-semibold placeholder:text-zinc-700 outline-none transition text-center"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[var(--pixit-primary)] hover:shadow-[0_0_20px_var(--pixit-primary)] text-black rounded-2xl font-black text-xs uppercase transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {checkoutStep}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Authorize Sandbox Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Order Summary & Promo Code */}
        <div className="bg-[#111115]/50 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Order Summary</h2>

            {/* Plan selection box */}
            <div className="p-4 rounded-2xl border border-white/5 bg-[#111115] flex items-center justify-between">
              <div>
                <div className="font-extrabold text-sm text-white">PIXIT {plan} Plan</div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase mt-0.5">{cycle} billing cycle</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm text-white">${basePrice}</div>
                <div className="text-[9px] text-gray-500">USD</div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="space-y-2">
              <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider">Have a promo code?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PIXIT50"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 bg-[#111115] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold placeholder:text-zinc-700 outline-none focus:border-[var(--pixit-primary)] uppercase"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-400 text-[10px] font-bold">{couponError}</p>}
              {couponApplied && (
                <p className="text-[var(--pixit-primary)] text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Coupon code {couponApplied} applied!
                </p>
              )}
            </div>
          </div>

          {/* Pricing breakdowns */}
          <div className="pt-6 border-t border-white/5 space-y-3 mt-6">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Subtotal</span>
              <span className="font-semibold text-white">${basePrice}.00</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-xs text-[var(--pixit-primary)]">
                <span>Discount ({discount * 100}%)</span>
                <span className="font-bold">-${basePrice * discount}.00</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Taxes & Fees</span>
              <span className="font-semibold text-white">$0.00</span>
            </div>
            
            <div className="pt-3 border-t border-white/5 flex items-baseline justify-between">
              <span className="text-sm font-black text-white uppercase">Total Due</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[var(--pixit-primary)]">${finalPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-500 font-semibold ml-1">USD</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-[10px] font-semibold text-center select-none pt-2">
              <Lock className="w-3.5 h-3.5 text-[var(--pixit-primary)]" /> SSL Encrypted Sandbox Gateway
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;
