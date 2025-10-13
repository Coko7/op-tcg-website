import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, Trophy, User, LogIn, UserPlus, Medal, Shield, ShoppingCart, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/boosters', icon: Package, label: 'Boosters' },
    { to: '/collection', icon: BookOpen, label: 'Collection' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/leaderboard', icon: Medal, label: 'Leaderboard' },
    { to: '/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  ];

  return (
    <header className="bg-white/5 backdrop-blur-2xl border-b-2 border-white/10 sticky top-0 z-50 shadow-2xl">
      {/* Glassmorphism top shine effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-ocean-500/80 to-treasure-500/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl">🏴‍☠️</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-ocean-300 via-blue-300 to-treasure-300 bg-clip-text text-transparent">One Piece TCG</h1>
          </div>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium backdrop-blur-xl ${
                  isActive(to)
                    ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg shadow-ocean-500/30 scale-105 border border-ocean-400/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105 border border-transparent hover:border-white/20'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{label}</span>
              </Link>
            ))}

            {/* Lien Admin visible uniquement pour les admins */}
            {isAuthenticated && user?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 border border-purple-400/30 backdrop-blur-xl"
                title="Administration"
              >
                <Shield size={18} />
                <span className="text-sm">Admin</span>
              </Link>
            )}
          </nav>

          {/* Right side: Notifications, User menu, Mobile menu button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notifications - Visible on all sizes */}
            {isAuthenticated && (
              <div className="relative z-50">
                <NotificationBell />
              </div>
            )}

            {/* Desktop: User menu or Login/Register */}
            <div className="hidden sm:flex items-center space-x-2">
              {isAuthenticated ? (
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

            {/* Mobile: User icon + Hamburger Menu Button */}
            <div className="flex items-center space-x-2 sm:hidden">
              {/* Mobile User Icon */}
              {isAuthenticated ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative p-2 rounded-xl bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 text-white shadow-lg border border-emerald-400/30 backdrop-blur-xl"
                >
                  <User size={18} />
                </button>
              ) : null}

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-xl"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Glassmorphism */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-2xl border-l-2 border-white/10 shadow-2xl z-50 lg:hidden animate-in slide-in-from-right duration-300">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ocean-500/80 to-treasure-500/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <span className="text-2xl">🏴‍☠️</span>
                </div>
                <h2 className="text-lg font-bold text-white">Menu</h2>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
              {navLinks.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive(to)
                      ? 'bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 text-white shadow-lg scale-105 border border-ocean-400/30'
                      : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Admin Link in Mobile Menu */}
              {isAuthenticated && user?.is_admin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-white shadow-lg border border-purple-400/30"
                >
                  <Shield size={20} />
                  <span>Administration</span>
                </Link>
              )}

              {/* Login/Register in Mobile Menu (if not authenticated) */}
              {!isAuthenticated && (
                <div className="pt-4 space-y-2 border-t border-white/10">
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-medium transition-all duration-300 shadow-lg border border-ocean-400/30"
                  >
                    <LogIn size={20} />
                    <span>Connexion</span>
                  </Link>

                  <Link
                    to="/register"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl border-2 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 hover:text-white transition-all duration-300 font-medium"
                  >
                    <UserPlus size={20} />
                    <span>S'inscrire</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* User Info Footer (if authenticated) */}
            {isAuthenticated && user && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{user.username}</p>
                    <p className="text-treasure-300 text-sm font-bold">{user.berrys} ฿</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile User Profile Modal */}
      {isAuthenticated && showUserMenu && (
        <>
          {/* Backdrop for mobile user menu */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setShowUserMenu(false)}
          />
          {/* User Profile positioned for mobile */}
          <div className="fixed top-20 left-4 right-4 z-50 sm:hidden">
            <UserProfile />
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
