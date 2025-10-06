import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, User, LogIn, UserPlus } from 'lucide-react';
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
    <header className="bg-blue-800/50 backdrop-blur-sm border-b border-blue-600/30 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <img
              src="/skull-flag.svg"
              alt="One Piece Logo"
              className="h-6 w-6 sm:h-8 sm:w-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-sm sm:text-xl font-bold text-white">One Piece Boosters</h1>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            <Link
              to="/boosters"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                isActive('/boosters')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline">Boosters</span>
            </Link>

            <Link
              to="/collection"
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                isActive('/collection')
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">Collection</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-1 sm:space-x-4">
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded-lg bg-blue-600/50 hover:bg-blue-600 transition-colors"
                >
                  <User size={16} className="text-blue-200" />
                  <span className="text-white font-medium hidden xs:inline">{user?.username}</span>
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
                  className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-medium transition-colors"
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline">Connexion</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg border border-blue-400 text-blue-200 hover:bg-blue-600/30 transition-colors"
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