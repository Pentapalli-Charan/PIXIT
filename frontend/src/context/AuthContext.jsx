import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (token && username) {
        return { username, token };
      }
    } catch (e) {
      console.error("Failed to read auth state from localStorage:", e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const login = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('username', userData.username);
    } catch (e) {
      console.error("Failed to persist auth state to localStorage:", e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    } catch (e) {
      console.error("Failed to remove auth state from localStorage:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
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
