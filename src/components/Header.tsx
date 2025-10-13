import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, Trophy, User, LogIn, UserPlus, Medal, Shield, ShoppingCart } from 'lucide-react';
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
    <header className="bg-white/5 backdrop-blur-2xl border-b-2 border-white/10 sticky top-0 z-50 shadow-2xl">
      {/* Glassmorphism top shine effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-ocean-500/80 to-treasure-500/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl">🏴‍☠️</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-ocean-300 via-blue-300 to-treasure-300 bg-clip-text text-transparent">One Piece TCG</h1>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline text-sm">Accueil</span>
            </Link>

            <Link
              to="/boosters"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/boosters')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline text-sm">Boosters</span>
            </Link>

            <Link
              to="/collection"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/collection')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline text-sm">Collection</span>
            </Link>

            <Link
              to="/achievements"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/achievements')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <Trophy size={18} />
              <span className="hidden sm:inline text-sm">Achievements</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/leaderboard')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <Medal size={18} />
              <span className="hidden sm:inline text-sm">Leaderboard</span>
            </Link>

            <Link
              to="/marketplace"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                isActive('/marketplace')
                  ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
              }`}
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline text-sm">Marketplace</span>
            </Link>

            {/* Lien Admin visible uniquement pour les admins */}
            {isAuthenticated && user?.is_admin ? (
              <Link
                to="/admin"
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 border border-purple-400/30 backdrop-blur-xl"
                title="Administration"
              >
                <Shield size={18} />
                <span className="hidden lg:inline text-sm">Admin</span>
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-400/30 backdrop-blur-xl"
                  >
                    <User size={16} />
                    <span className="hidden xs:inline text-sm">{user?.username}</span>
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
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-ocean-500/40 hover:scale-105 border border-ocean-400/30 backdrop-blur-xl"
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline text-sm">Connexion</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-xl border-2 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white transition-all duration-300 font-medium hover:scale-105 backdrop-blur-xl"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline text-sm">S'inscrire</span>
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