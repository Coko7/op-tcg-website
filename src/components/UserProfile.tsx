import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, stats } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl border-2 border-white/20 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 bg-gradient-to-br from-treasure-400 to-treasure-600 rounded-full flex items-center justify-center shadow-lg border-2 border-treasure-300/30">
            <span className="text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">{user.username}</h3>
            {user.is_admin ? (
              <span className="inline-block bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 text-white text-xs px-2.5 py-1 rounded-lg mt-1 border border-purple-400/30 shadow-lg font-medium backdrop-blur-xl">
                Admin
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-red-500/40 hover:scale-105 border border-red-400/30 backdrop-blur-xl font-medium"
        >
          Déconnexion
        </button>
      </div>

      {stats && (
        <div className="border-t border-white/20 pt-4">
          <h4 className="text-white font-medium mb-2">Statistiques</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-300">Cartes uniques</p>
              <p className="text-white font-semibold">{stats.unique_cards || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Total cartes</p>
              <p className="text-white font-semibold">{stats.total_cards || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Boosters ouverts</p>
              <p className="text-white font-semibold">{stats.total_openings || 0}</p>
            </div>
            <div>
              <p className="text-gray-300">Aujourd'hui</p>
              <p className="text-white font-semibold">{stats.today_openings || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between bg-gradient-to-r from-treasure-500/20 to-treasure-600/20 rounded-xl p-4 border border-treasure-400/30 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2">
                <Coins className="text-treasure-300" size={24} />
                <span className="text-white font-semibold">Berrys</span>
              </div>
              <div className="text-treasure-300 font-bold text-xl">{user.berrys || 0} ฿</div>
            </div>
          </div>

          {/* Lien vers les paramètres du profil */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <Link
              to="/profile"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-ocean-500/90 to-ocean-600/90 hover:from-ocean-600 hover:to-ocean-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-ocean-500/40 hover:scale-105 border border-ocean-400/30 backdrop-blur-xl font-medium"
            >
              <Settings size={18} />
              <span>Paramètres du profil</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;