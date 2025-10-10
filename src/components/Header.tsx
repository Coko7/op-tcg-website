import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, Trophy, User, LogIn, UserPlus, Medal, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/20 sticky top-0 z-50 shadow-2xl shadow-black/20">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="hidden sm:block w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏴‍☠️</span>
            </div>
            <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">One Piece TCG</h1>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                isActive('/')
                  ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive('/') && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />}
              <Home size={18} className="relative z-10" />
              <span className="hidden sm:inline font-medium relative z-10">Accueil</span>
            </Link>

            <Link
              to="/boosters"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                isActive('/boosters')
                  ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive('/boosters') && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />}
              <Package size={18} className="relative z-10" />
              <span className="hidden sm:inline font-medium relative z-10">Boosters</span>
            </Link>

            <Link
              to="/collection"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                isActive('/collection')
                  ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive('/collection') && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />}
              <BookOpen size={18} className="relative z-10" />
              <span className="hidden sm:inline font-medium relative z-10">Collection</span>
            </Link>

            <Link
              to="/achievements"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                isActive('/achievements')
                  ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive('/achievements') && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />}
              <Trophy size={18} className="relative z-10" />
              <span className="hidden sm:inline font-medium relative z-10">Achievements</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                isActive('/leaderboard')
                  ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isActive('/leaderboard') && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />}
              <Medal size={18} className="relative z-10" />
              <span className="hidden sm:inline font-medium relative z-10">Leaderboard</span>
            </Link>

            {/* Lien Admin visible uniquement pour les admins */}
            {isAuthenticated && user?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                title="Administration"
              >
                <Shield size={18} />
                <span className="hidden lg:inline font-medium">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-1 sm:space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/80 to-teal-500/80 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30"
                  >
                    <User size={16} className="text-white" />
                    <span className="text-white font-medium hidden xs:inline">{user?.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50">
                      <UserProfile />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/40"
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline">Connexion</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl border border-blue-400/50 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 transition-all duration-300 font-medium"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">S'inscrire</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;