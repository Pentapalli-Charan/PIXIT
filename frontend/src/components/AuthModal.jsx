import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Key, Mail, User as UserIcon, Lock, Sparkles, Check, AlertCircle, ArrowLeft } from 'lucide-react';

const AuthModal = () => {
  const { login, setIsAuthModalOpen } = useAuth();
  const onClose = () => setIsAuthModalOpen(false);
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [formData, setFormData] = useState({ 
    identifier: '', 
    password: '', 
    email: '', 
    username: '', 
    resetToken: '', 
    newPassword: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFormData({ 
      identifier: '', 
      password: '', 
      email: '', 
      username: '', 
      resetToken: '', 
      newPassword: '' 
    });
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.username.trim()) {
        setError('Username is required.');
        return false;
      }
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
    } else if (mode === 'forgot') {
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return false;
      }
    } else if (mode === 'reset') {
      if (!formData.resetToken.trim()) {
        setError('Reset token is required.');
        return false;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return false;
      }
    } else {
      if (!formData.identifier.trim()) {
        setError('Username or Email is required.');
        return false;
      }
      if (!formData.password) {
        setError('Password is required.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const data = await api.login(formData.identifier, formData.password);
        login({ username: formData.identifier, token: data.access });
      } else if (mode === 'register') {
        await api.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        setSuccess('Account created successfully! Directing you in...');
        // Automatically attempt to login after successful registration for better UX
        const loginData = await api.login(formData.username, formData.password);
        setTimeout(() => {
          login({ username: formData.username, token: loginData.access });
        }, 1000);
      } else if (mode === 'forgot') {
        const data = await api.forgotPassword(formData.email);
        setSuccess(data.message || 'Reset token generated successfully!');
        setTimeout(() => {
          setMode('reset');
          setError('');
          setSuccess('');
        }, 2500);
      } else if (mode === 'reset') {
        const data = await api.resetPassword(formData.resetToken, formData.newPassword);
        setSuccess(data.message || 'Password updated successfully!');
        setTimeout(() => {
          setMode('login');
          setError('');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Map API details or connection errors beautifully
      if (err.data && err.data.detail) {
        setError(err.data.detail);
      } else {
        setError(err.message || 'Failed to communicate with the service. Please verify your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-[#0B0B0B] to-[#121218] w-[450px] max-w-[92vw] p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] animate-[modalFadeIn_0.25s_ease-out] z-10 text-white">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-5 right-5 text-gray-500 hover:text-white transition bg-transparent border-none cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Modal Headers / Tabs */}
        {mode === 'forgot' || mode === 'reset' ? (
          <div className="mb-6">
            <button 
              onClick={() => handleModeSwitch('login')}
              className="flex items-center gap-1 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider mb-3 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Key className="text-[var(--pixit-primary)] w-6 h-6" /> {mode === 'forgot' ? 'FORGOT PASSWORD' : 'RESET PASSWORD'}
            </h2>
            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
              {mode === 'forgot' 
                ? 'Request a secure verification code to reset your login password.' 
                : 'Input your verification token and your new password layers.'}
            </p>
          </div>
        ) : (
          <div className="flex border-b border-white/5 mb-8 select-none">
            <button 
              type="button"
              className={`flex-1 pb-3 font-black text-sm uppercase transition tracking-wider ${mode === 'login' ? 'text-[var(--pixit-primary)] border-b-2 border-[var(--pixit-primary)]' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => handleModeSwitch('login')}
            >
              Login Access
            </button>
            <button 
              type="button"
              className={`flex-1 pb-3 font-black text-sm uppercase transition tracking-wider ${mode === 'register' ? 'text-[var(--pixit-primary)] border-b-2 border-[var(--pixit-primary)]' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => handleModeSwitch('register')}
            >
              Register Canvas
            </button>
          </div>
        )}

        {/* Feedbacks alerts */}
        {error && (
          <div className="bg-red-950/20 border border-red-500/30 text-red-500 text-xs p-3.5 rounded-xl mb-6 flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="bg-[var(--pixit-primary)]/10 border border-[var(--pixit-primary)]/30 text-[var(--pixit-primary)] text-xs p-3.5 rounded-xl mb-6 flex items-center gap-2.5 font-extrabold">
            <Check className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* REGISTER: Username & Email */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    name="username" 
                    placeholder="Enter unique username"
                    value={formData.username} 
                    onChange={handleChange} 
                    disabled={isLoading}
                    autoFocus
                    className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="you@example.com"
                    value={formData.email} 
                    onChange={handleChange} 
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                    required 
                  />
                </div>
              </div>
            </>
          )}

          {/* FORGOT: Email */}
          {mode === 'forgot' && (
            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your registration email"
                  value={formData.email} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
            </div>
          )}

          {/* LOGIN: Identifier */}
          {mode === 'login' && (
            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">Username or Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="identifier" 
                  placeholder="Username or registered email"
                  value={formData.identifier} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
            </div>
          )}

          {/* RESET: Token Input */}
          {mode === 'reset' && (
            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">Reset Token</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="resetToken" 
                  placeholder="Paste 32-character token from logs"
                  value={formData.resetToken} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition font-mono text-xs" 
                  required 
                />
              </div>
            </div>
          )}

          {/* Standard Passwords */}
          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-[10px] text-gray-500 hover:text-[var(--pixit-primary)] font-bold uppercase transition bg-transparent border-none cursor-pointer select-none"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Minimum 6 characters"
                  value={formData.password} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
            </div>
          )}

          {/* RESET: New Password */}
          {mode === 'reset' && (
            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase mb-1.5 tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  name="newPassword" 
                  placeholder="Minimum 6 characters"
                  value={formData.newPassword} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full bg-[var(--pixit-primary)] text-black font-black py-4 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(182,255,0,0.3)] transition duration-200 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2 text-xs uppercase font-black">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <span className="text-xs uppercase font-black tracking-widest">
                {mode === 'login' && 'ACCESS DASHBOARD'}
                {mode === 'register' && 'CREATE CANVAS ACCOUNT'}
                {mode === 'forgot' && 'REQUEST RESET CODE'}
                {mode === 'reset' && 'SAVE NEW PASSWORD'}
              </span>
            )}
          </button>
        </form>

        {/* OR Divider for standard authentication */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <div className="flex items-center my-6 text-gray-600 text-[10px] font-black tracking-widest before:flex-1 before:border-b before:border-slate-800/85 before:mr-4 after:flex-1 after:border-b after:border-slate-800/85 after:ml-4 select-none">
              OR CHOOSE
            </div>

            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setError('Google Authentication is undergoing active security review.'); }}
              className="w-full flex items-center justify-center gap-3 bg-black/30 border border-slate-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black/60 hover:border-slate-700 transition cursor-pointer select-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Google Account
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
