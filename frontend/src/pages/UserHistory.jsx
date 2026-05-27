import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, Eye, EyeOff, Trash2, Download, ExternalLink, Sparkles, AlertCircle, Heart, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'favorites'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityLoadingId, setVisibilityLoadingId] = useState(null);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'library') {
        const data = await api.getHistory();
        setProjects(data);
      } else {
        const data = await api.getFavorites();
        setFavorites(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch elements from the cloud database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, activeTab]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project? This will erase all its stylizations.")) return;
    setDeletingId(projectId);
    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter(p => p.project_id !== projectId));
    } catch (err) {
      alert("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (stylizationId, currentStatus) => {
    setVisibilityLoadingId(stylizationId);
    try {
      const data = await api.togglePublicVisibility(stylizationId, !currentStatus);
      setProjects(prevProjects => 
        prevProjects.map(proj => ({
          ...proj,
          stylizations: proj.stylizations.map(sty => 
            sty.id === stylizationId ? { ...sty, is_public: data.is_public } : sty
          )
        }))
      );
    } catch (err) {
      alert("Failed to update visibility settings.");
    } finally {
      setVisibilityLoadingId(null);
    }
  };

  const handleUnlikeFavorite = async (stylizationId) => {
    try {
      await api.unlikeStylization(stylizationId);
      setFavorites(favorites.filter(fav => fav.stylization_id !== stylizationId));
    } catch (err) {
      alert("Failed to unlike design.");
    }
  };

  const handleEditAgain = (proj, styleApplied = 'cartoon') => {
    navigate('/workspace', {
      state: {
        projectId: proj.project_id,
        tryStyle: styleApplied,
        originalUrl: proj.original_url
      }
    });
  };

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6">Please log in to view your saved projects and image stylization history.</p>
      </div>
    );
  }

  return (
    <div className="py-8 w-full max-w-6xl mx-auto px-4 text-white">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <History className="text-[var(--pixit-primary)] w-7 h-7" /> SAVED PROJECT LIBRARY
          </h1>
          <p className="text-gray-500 text-xs mt-1">Review, export, delete, or re-stylize your processed designs.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer select-none ${
              activeTab === 'library'
                ? 'bg-[var(--pixit-primary)] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Uploads
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer select-none ${
              activeTab === 'favorites'
                ? 'bg-[var(--pixit-primary)] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--pixit-primary)]/20 border-t-[var(--pixit-primary)] rounded-full animate-spin mb-4"></div>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Querying Database...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-500/30 text-red-500 p-6 rounded-2xl text-center shadow-lg">
          <p className="font-bold">{error}</p>
        </div>
      ) : activeTab === 'library' && projects.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center bg-black/20">
          <h3 className="text-lg font-bold text-gray-400 mb-2">No projects saved yet</h3>
          <p className="text-gray-600 text-xs mb-6 max-w-xs mx-auto">Stylize your first photo to see it saved here automatically.</p>
          <button 
            onClick={() => navigate('/workspace')}
            className="bg-[var(--pixit-primary)] text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer"
          >
            Launch Neural Editor
          </button>
        </div>
      ) : activeTab === 'favorites' && favorites.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center bg-black/20">
          <Heart className="w-10 h-10 mx-auto text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">No favorited designs</h3>
          <p className="text-gray-600 text-xs mb-6 max-w-xs mx-auto">Browse the community showcase and click the heart icon on designs you like!</p>
          <button 
            onClick={() => navigate('/gallery')}
            className="bg-[var(--pixit-primary)] text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer"
          >
            Browse Community Gallery
          </button>
        </div>
      ) : activeTab === 'library' ? (
        <div className="flex flex-col gap-6">
          {projects.map(proj => (
            <div 
              key={proj.project_id}
              className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-stretch shadow-xl"
            >
              {/* Left Column: Original Preview */}
              <div className="w-full md:w-44 flex-shrink-0 flex flex-col gap-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Original Upload</span>
                <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/5 bg-black/30">
                  <img src={proj.original_url} alt="Original source" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj.project_id)}
                  disabled={deletingId === proj.project_id}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-red-500 text-xs font-bold py-2 border border-red-500/10 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Project
                </button>
              </div>

              {/* Right Column: Stylizations list */}
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                    {proj.title}
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    Created on {new Date(proj.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">AI Styles Generated</span>
                  {proj.stylizations && proj.stylizations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {proj.stylizations.map(sty => (
                        <div 
                          key={sty.id}
                          className="bg-[#1A1A22] border border-white/5 p-3.5 rounded-2xl flex gap-4 items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/5 flex-shrink-0 bg-black/20">
                              <img src={sty.processed_url} alt="Styled output" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-black text-xs text-white capitalize">{sty.style_applied}</div>
                              <span className="text-[9px] text-gray-500">
                                {new Date(sty.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Privacy Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(sty.id, sty.is_public)}
                              disabled={visibilityLoadingId === sty.id}
                              className={`p-2 rounded-lg border transition cursor-pointer ${
                                sty.is_public
                                  ? 'bg-[var(--pixit-primary)]/10 border-[var(--pixit-primary)]/20 text-[var(--pixit-primary)]'
                                  : 'bg-black/25 border-white/5 text-gray-500 hover:text-white'
                              }`}
                              title={sty.is_public ? "Publicly Shared" : "Private image"}
                            >
                              {sty.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            {/* Download */}
                            <a
                              href={sty.processed_url}
                              download={`stylized_${sty.style_applied}.png`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-black/25 border border-white/5 text-gray-400 hover:text-white transition"
                              title="Download Stylized Image"
                            >
                              <Download className="w-4 h-4" />
                            </a>

                            {/* Re-stylize */}
                            <button
                              type="button"
                              onClick={() => handleEditAgain(proj, sty.style_applied)}
                              className="p-2 rounded-lg bg-[var(--pixit-primary)] text-black hover:shadow-[0_0_8px_rgba(182,255,0,0.3)] transition cursor-pointer"
                              title="Open in editor with original image"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs italic py-2">No stylization runs found for this image.</div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => handleEditAgain(proj, 'cartoon')}
                    className="text-xs text-[var(--pixit-primary)] hover:text-[var(--pixit-primary)]/80 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    Apply New Filter <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* FAVORITES GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {favorites.map(fav => (
            <div 
              key={fav.stylization_id}
              className="bg-[#111115]/80 border border-slate-800 rounded-3xl p-5 hover:border-[var(--pixit-primary)]/30 transition shadow-xl relative group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/5 bg-black/30 mb-4">
                  <img src={fav.processed_url} alt="Favorited styled work" className="w-full h-full object-cover" />
                </div>
                
                <h3 className="text-sm font-black text-white capitalize">{fav.style_applied} Effect</h3>
                <p className="text-[10px] text-gray-500 mt-1">Creator: {fav.username} | Title: {fav.project_title}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                <button
                  onClick={() => handleUnlikeFavorite(fav.stylization_id)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-gray-400 font-bold transition cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-current text-red-500" />
                  <span>Liked</span>
                </button>

                <a
                  href={fav.processed_url}
                  download={`favorite_${fav.style_applied}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-gray-400 hover:text-[var(--pixit-primary)] transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserHistory;
