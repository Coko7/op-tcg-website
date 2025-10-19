import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, BookOpen, Trophy, Medal, Shield, ShoppingCart, LogIn, UserPlus, X, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MobileMenuProps {
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onClose }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/boosters', icon: Package, label: 'Boosters' },
    { to: '/collection', icon: BookOpen, label: 'Collection' },
    { to: '/map', icon: MapIcon, label: 'Carte' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/leaderboard', icon: Medal, label: 'Leaderboard' },
    { to: '/marketplace', icon: ShoppingCart, label: 'Marketplace' },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl border-2 border-white/20 p-5 shadow-2xl max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-ocean-500 to-treasure-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg">🏴‍☠️</span>
          </div>
          <h2 className="text-lg font-bold text-white">Navigation</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="space-y-2 mb-4">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              isActive(to)
                ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-lg border border-ocean-400/40'
                : 'text-white/80 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        {/* Admin Link */}
        {isAuthenticated && user?.is_admin ? (
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg border border-purple-400/40"
          >
            <Shield size={20} />
            <span>Administration</span>
          </Link>
        ) : null}
      </div>

      {/* Login/Register if not authenticated */}
      {!isAuthenticated ? (
        <div className="pt-4 space-y-2 border-t border-white/20">
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-ocean-500/40 hover:scale-105 border border-ocean-400/30 backdrop-blur-xl"
          >
            <LogIn size={18} />
            <span>Connexion</span>
          </Link>

          <Link
            to="/register"
            onClick={onClose}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-xl"
          >
            <UserPlus size={18} />
            <span>S'inscrire</span>
          </Link>
        </div>
      ) : null}

      {/* User info if authenticated */}
      {isAuthenticated && user ? (
        <div className="pt-4 mt-4 border-t border-white/20">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-treasure-500/20 to-treasure-600/20 rounded-xl p-3 border border-treasure-400/30">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate text-sm">{user.username}</p>
              <p className="text-treasure-300 text-sm font-bold">{user.berrys} ฿</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MobileMenu;
