/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT token:", e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null') {
        const decoded = decodeToken(token);
        if (decoded && decoded.sub) {
          // Check expiration
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp > now) {
            return { username: decoded.sub, token };
          } else {
            // Expired token, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('username');
          }
        }
      }
    } catch (e) {
      console.error("Failed to read auth state from localStorage:", e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [profile, setProfile] = useState(null);

  const refreshProfile = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch profile details:", err);
    }
  };

  const login = (token) => {
    try {
      const decoded = decodeToken(token);
      const username = decoded?.sub || 'User';
      setUser({ username, token });
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
    } catch (e) {
      console.error("Failed to persist auth state to localStorage:", e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    } catch (e) {
      console.error("Failed to remove auth state from localStorage:", e);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setIsAuthModalOpen(true);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      refreshProfile,
      login, 
      logout, 
      isAuthModalOpen, 
      setIsAuthModalOpen,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
