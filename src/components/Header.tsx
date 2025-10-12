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
    <header className="bg-slate-900/90 backdrop-blur-xl border-b border-ocean-500/20 sticky top-0 z-50 shadow-xl">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-treasure-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏴‍☠️</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-ocean-400 to-treasure-400 bg-clip-text text-transparent">One Piece TCG</h1>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                isActive('/')
                  ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            <Link
              to="/boosters"
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                isActive('/boosters')
                  ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline">Boosters</span>
            </Link>

            <Link
              to="/collection"
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                isActive('/collection')
                  ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">Collection</span>
            </Link>

            <Link
              to="/achievements"
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                isActive('/achievements')
                  ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
              }`}
            >
              <Trophy size={18} />
              <span className="hidden sm:inline">Achievements</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                isActive('/leaderboard')
                  ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg shadow-ocean-500/30 scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:scale-105'
              }`}
            >
              <Medal size={18} />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>

            {/* Lien Admin visible uniquement pour les admins */}
            {isAuthenticated && user?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                title="Administration"
              >
                <Shield size={18} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 hover:scale-105"
                  >
                    <User size={16} />
                    <span className="hidden xs:inline">{user?.username}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50">
                      <UserProfile />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-ocean-500/40 hover:scale-105"
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline">Connexion</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl border-2 border-ocean-400/50 text-ocean-300 hover:bg-ocean-500/10 hover:border-ocean-400 hover:text-ocean-200 transition-all duration-300 font-medium hover:scale-105"
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