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
    <div className="bg-slate-800/95 backdrop-blur-lg rounded-lg border border-white/30 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.username}</h3>
            {user.is_admin ? (
              <span className="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded mt-1">
                Admin
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
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
            <div className="flex items-center justify-between bg-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-400" size={24} />
                <span className="text-white font-medium">Berrys</span>
              </div>
              <div className="text-yellow-400 font-bold text-xl">{user.berrys || 0}</div>
            </div>
          </div>

          {/* Lien vers les paramètres du profil */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <Link
              to="/profile"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-colors border border-blue-500/30"
            >
              <Settings size={18} />
              <span className="font-medium">Paramètres du profil</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;