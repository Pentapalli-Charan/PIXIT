import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar, AuthModal } from './components';
import { Landing, Workspace, CommunityGallery, UserHistory, UserProfile } from './pages';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthModalOpen } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen relative overflow-hidden bg-black text-white flex flex-col justify-between">
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none z-[-1]" 
             style={{
               backgroundImage: 'linear-gradient(rgba(182, 255, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(182, 255, 0, 0.03) 1px, transparent 1px)',
               backgroundSize: '60px 60px'
             }}
        ></div>

        <div>
          <Navbar />
          
          <main className="pt-28 max-w-7xl mx-auto px-4 w-full">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/workspace" element={<Workspace />} />
              <Route path="/gallery" element={<CommunityGallery />} />
              <Route path="/history" element={<UserHistory />} />
              <Route path="/profile" element={<UserProfile />} />
            </Routes>
          </main>
        </div>

        {isAuthModalOpen && (
          <AuthModal />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
