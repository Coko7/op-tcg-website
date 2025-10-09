import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, Trophy, User, LogIn, UserPlus, Medal, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

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
    <header className="bg-marine-blue/80 backdrop-blur-sm border-b-4 border-gold-treasure/50 sticky top-0 z-50 shadow-lg shadow-pirate-black/30">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <h1 className="text-sm sm:text-xl font-bold text-gold-treasure font-pirate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(241,196,15,0.3)' }}>🏴‍☠️ One Piece Boosters</h1>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/')
                  ? 'bg-luffy-red border-2 border-gold-treasure text-white shadow-lg shadow-luffy-red/50'
                  : 'text-cloud-white/80 hover:text-gold-treasure hover:bg-pirate-black/30 border-2 border-transparent'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline font-semibold">Accueil</span>
            </Link>

            <Link
              to="/boosters"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/boosters')
                  ? 'bg-luffy-red border-2 border-gold-treasure text-white shadow-lg shadow-luffy-red/50'
                  : 'text-cloud-white/80 hover:text-gold-treasure hover:bg-pirate-black/30 border-2 border-transparent'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline font-semibold">Boosters</span>
            </Link>

            <Link
              to="/collection"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/collection')
                  ? 'bg-luffy-red border-2 border-gold-treasure text-white shadow-lg shadow-luffy-red/50'
                  : 'text-cloud-white/80 hover:text-gold-treasure hover:bg-pirate-black/30 border-2 border-transparent'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline font-semibold">Collection</span>
            </Link>

            <Link
              to="/achievements"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/achievements')
                  ? 'bg-luffy-red border-2 border-gold-treasure text-white shadow-lg shadow-luffy-red/50'
                  : 'text-cloud-white/80 hover:text-gold-treasure hover:bg-pirate-black/30 border-2 border-transparent'
              }`}
            >
              <Trophy size={18} />
              <span className="hidden sm:inline font-semibold">Achievements</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive('/leaderboard')
                  ? 'bg-luffy-red border-2 border-gold-treasure text-white shadow-lg shadow-luffy-red/50'
                  : 'text-cloud-white/80 hover:text-gold-treasure hover:bg-pirate-black/30 border-2 border-transparent'
              }`}
            >
              <Medal size={18} />
              <span className="hidden sm:inline font-semibold">Leaderboard</span>
            </Link>

            {/* Lien Admin visible uniquement pour les admins */}
            {isAuthenticated && user?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 bg-purple-600/70 hover:bg-purple-600 border-2 border-purple-400 text-white shadow-lg shadow-purple-600/30"
                title="Administration"
              >
                <Shield size={18} />
                <span className="hidden lg:inline font-semibold">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-1 sm:space-x-4">
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg bg-emerald-sea/70 hover:bg-emerald-sea border-2 border-gold-treasure/40 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-sea/30"
                >
                  <User size={16} className="text-gold-treasure" />
                  <span className="text-cloud-white font-semibold hidden xs:inline">{user?.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50">
                    <UserProfile />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg bg-gold-treasure hover:bg-gold-treasure/90 text-pirate-black font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-gold-treasure/30 border-2 border-gold-treasure/50"
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline">Connexion</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border-2 border-gold-treasure text-gold-treasure hover:bg-gold-treasure/10 transition-all duration-200 font-semibold"
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