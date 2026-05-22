import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const AuthModal = () => {
  const { login, setIsAuthModalOpen } = useAuth();
  const onClose = () => setIsAuthModalOpen(false);
  const [mode, setMode] = useState('login'); // 'login', 'register'
  const [formData, setFormData] = useState({ identifier: '', password: '', email: '', username: '' });
  const [error, setError] = useState('');
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
    setFormData({ identifier: '', password: '', email: '', username: '' });
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
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const data = await api.login(formData.identifier, formData.password);
        login({ username: formData.identifier, token: data.access });
      } else {
        await api.register(formData);
        // Automatically attempt to login after successful registration for better UX
        const loginData = await api.login(formData.username, formData.password);
        login({ username: formData.username, token: loginData.access });
      }
    } catch (err) {
      console.error("Auth error:", err);
      const data = err.data;
      if (data) {
        if (data.detail) {
          setError(data.detail);
        } else if (typeof data === 'object') {
          const errorMessages = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join(' | ');
          setError(errorMessages || 'An error occurred during authentication.');
        } else {
          setError('An error occurred. Please try again.');
        }
      } else {
        setError('Failed to connect to backend. Make sure the server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-[#0B0B0B] to-[#111827] w-[440px] max-w-[90vw] p-10 rounded-2xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] animate-[modalFadeIn_0.3s_ease-out]">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition bg-transparent border-none cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 font-bold text-sm uppercase transition ${mode === 'login' ? 'text-white border-b-2 border-[var(--pixit-primary)]' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => handleModeSwitch('login')}
          >
            Login
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 font-bold text-sm uppercase transition ${mode === 'register' ? 'text-white border-b-2 border-[var(--pixit-primary)]' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => handleModeSwitch('register')}
          >
            Register
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[#A0A0A0] text-xs font-medium mb-1">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[#A0A0A0] text-xs font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                  required 
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-[#A0A0A0] text-xs font-medium mb-1">Username or Email</label>
              <input 
                type="text" 
                name="identifier" 
                value={formData.identifier} 
                onChange={handleChange} 
                disabled={isLoading}
                autoFocus
                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
                required 
              />
            </div>
          )}

          <div>
            <label className="block text-[#A0A0A0] text-xs font-medium mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              disabled={isLoading}
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-[var(--pixit-primary)] focus:ring-1 focus:ring-[var(--pixit-primary)] outline-none transition" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full bg-[var(--pixit-primary)] text-black font-bold py-3 rounded-lg hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(182,255,0,0.4)] transition disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                PROCESSING...
              </span>
            ) : mode === 'login' ? 'ACCESS DASHBOARD' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setError('Password recovery is not implemented yet.'); }}
              className="text-gray-500 text-xs font-bold uppercase hover:text-white transition cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="flex items-center my-6 text-gray-600 text-xs font-bold tracking-widest before:flex-1 before:border-b before:border-gray-800 before:mr-4 after:flex-1 after:border-b after:border-gray-800 after:ml-4">
          OR
        </div>

        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); setError('Google integration is not set up.'); }}
          className="w-full flex items-center justify-center gap-3 bg-black/30 border border-gray-700 text-white py-3 rounded-lg font-semibold text-sm hover:bg-black/60 hover:border-gray-600 transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
        </button>

      </div>
    </div>
  );
};

export default AuthModal;
