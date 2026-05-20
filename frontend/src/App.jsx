import React from 'react';
import { Navbar, AuthModal } from './components';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-[-1]" 
           style={{
             backgroundImage: 'linear-gradient(rgba(176, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(176, 255, 0, 0.05) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }}
      ></div>

      <Navbar />
      
      <main className="pt-24 max-w-7xl mx-auto px-4">
        <Home />
      </main>

      {isAuthModalOpen && (
        <AuthModal />
      )}
    </div>
  );
}

export default App;
