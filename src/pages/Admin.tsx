import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Users, Activity, Bell, TrendingUp, Coins, Package, Shield, Calendar } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import Dialog from '../components/ui/Dialog';

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    active_today: number;
    active_week: number;
    new_week: number;
    total_berrys: number;
    avg_berrys: number;
    // Support ancien format
    active?: number;
    new_today?: number;
  };
  economy?: {
    total_berrys: number;
    avg_berrys: number;
  };
  cards: {
    total: number;
    active: number;
    // Support ancien format
    total_collected?: number;
    unique_cards?: number;
    avg_per_user?: number;
  };
  collections?: {
    total: number;
    total_cards_owned: number;
    users_with_cards: number;
    avg_per_user: number;
  };
  boosters: {
    total_openings: number;
    opened_today: number;
    opened_week: number;
    // Support ancien format
    total_opened?: number;
    total_purchased?: number;
    most_popular?: string;
  };
  achievements?: {
    total: number;
    completions: number;
    claimed: number;
  };
  security: {
    failed_logins_24h: number;
    suspicious_activities_24h: number;
    critical_events_24h: number;
    // Support ancien format
    suspicious_activities?: number;
  };
  top_players: Array<{
    username: string;
    berrys: number;
    total_cards?: number;
    cards_owned?: number;
    // Support ancien format
    cards_count?: number;
  }>;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  username?: string;
}

interface Notification {
  id: number;
  message: string;
  berry_reward: number | null;
  booster_reward: number | null;
  created_at: string;
  sent_by: string;
  is_active: boolean;
}

const Admin: React.FC = () => {
  const { dialogState, showAlert, showConfirm, handleClose, handleConfirm } = useDialog();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'notifications' | 'activity'>('stats');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifForm, setNotifForm] = useState({
    message: '',
    berry_reward: '',
    booster_reward: ''
  });

  // Fonction helper pour convertir les dates UTC de SQLite vers la timezone locale
  const formatLocalDateTime = (utcDateString: string): string => {
    // SQLite retourne les dates au format 'YYYY-MM-DD HH:MM:SS' en UTC
    // On ajoute 'Z' pour indiquer à JavaScript que c'est UTC, puis on convertit en local
    const utcDate = new Date(utcDateString + 'Z');
    return utcDate.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/dashboard/stats`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${apiService.getAccessToken()}` }
      });
      const activityRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/dashboard/activity`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${apiService.getAccessToken()}` }
      });
      const notifsRes = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/notifications`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${apiService.getAccessToken()}` }
      });

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();
      const notifsData = await notifsRes.json();

      console.log('📊 Admin - Stats reçues:', statsData);
      console.log('📋 Admin - Activities reçues:', activityData);
      console.log('🔔 Admin - Notifications reçues:', notifsData);

      setStats(statsData.data || statsData.stats);  // Support ancien et nouveau format
      setActivities(activityData.activities || []);
      setNotifications(notifsData.notifications || []);
    } catch (error) {
      console.error('Erreur chargement admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/notifications`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify({
          message: notifForm.message,
          berry_reward: notifForm.berry_reward ? parseInt(notifForm.berry_reward) : null,
          booster_reward: notifForm.booster_reward ? parseInt(notifForm.booster_reward) : null
        })
      });
      setNotifForm({ message: '', berry_reward: '', booster_reward: '' });
      await loadData();
      await showAlert('Succès', 'Notification envoyée avec succès !', 'success');
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      await showAlert('Erreur', 'Erreur lors de l\'envoi de la notification', 'error');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    const confirmed = await showConfirm('Désactiver la notification', 'Désactiver cette notification ?');
    if (!confirmed) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      });
      await loadData();
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      await showAlert('Erreur', 'Erreur lors de la suppression de la notification', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du dashboard admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Shield className="text-purple-400" size={40} />
            Administration
          </h1>
          <p className="text-slate-300">Bienvenue, {user?.username}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'stats'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="inline mr-2" size={20} />
            Statistiques
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="inline mr-2" size={20} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'activity'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="inline mr-2" size={20} />
            Activité
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Utilisateurs</h3>
                  <Users className="text-blue-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{stats.users.total}</p>
                  <p className="text-sm text-slate-400">
                    {stats.users.active_today || stats.users.active} actifs aujourd'hui • {stats.users.new_week || stats.users.new_today || 0} nouveaux cette semaine
                  </p>
                  <p className="text-sm text-purple-400">{stats.users.admins} admins</p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Économie</h3>
                  <Coins className="text-yellow-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{(stats.users.total_berrys || stats.economy?.total_berrys || 0).toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Total Berrys en circulation</p>
                  <p className="text-sm text-yellow-400">
                    Moyenne: {Math.round(stats.users.avg_berrys || stats.economy?.avg_berrys || 0)} Berrys/joueur
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Boosters</h3>
                  <Package className="text-green-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{stats.boosters.total_openings || stats.boosters.total_opened || 0}</p>
                  <p className="text-sm text-slate-400">Boosters ouverts au total</p>
                  <p className="text-sm text-green-400">
                    Aujourd'hui: {stats.boosters.opened_today || 0} • Cette semaine: {stats.boosters.opened_week || 0}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Cartes</h3>
                  <Activity className="text-orange-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{stats.collections?.total_cards_owned || stats.cards.total_collected || 0}</p>
                  <p className="text-sm text-slate-400">
                    {stats.collections?.total || stats.cards.unique_cards || 0} cartes uniques
                  </p>
                  <p className="text-sm text-orange-400">
                    Moyenne: {stats.collections?.avg_per_user || stats.cards.avg_per_user || 0} cartes/joueur
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Sécurité</h3>
                  <Shield className="text-red-400" size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-red-400">{stats.security.failed_logins_24h || 0}</p>
                  <p className="text-sm text-slate-400">Échecs de connexion (24h)</p>
                  <p className="text-sm text-red-400">
                    {stats.security.suspicious_activities_24h || stats.security.suspicious_activities || 0} activités suspectes
                  </p>
                </div>
              </div>
            </div>

            {/* Top Players */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-yellow-400" />
                Top Joueurs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 text-left">
                      <th className="pb-3 font-semibold text-slate-300">#</th>
                      <th className="pb-3 font-semibold text-slate-300">Joueur</th>
                      <th className="pb-3 font-semibold text-slate-300">Berrys</th>
                      <th className="pb-3 font-semibold text-slate-300">Cartes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_players.map((player, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50">
                        <td className="py-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 font-semibold">{player.username}</td>
                        <td className="py-3 text-yellow-400">{player.berrys.toLocaleString()}</td>
                        <td className="py-3 text-blue-400">{player.total_cards || player.cards_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Create Notification Form */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell className="text-blue-400" />
                Envoyer une notification globale
              </h3>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Message *</label>
                  <textarea
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                    rows={3}
                    required
                    placeholder="Annonce importante pour tous les joueurs..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      <Coins className="inline mr-1" size={16} />
                      Récompense Berrys (optionnel)
                    </label>
                    <input
                      type="number"
                      value={notifForm.berry_reward}
                      onChange={(e) => setNotifForm({ ...notifForm, berry_reward: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      <Package className="inline mr-1" size={16} />
                      Récompense Boosters (optionnel)
                    </label>
                    <input
                      type="number"
                      value={notifForm.booster_reward}
                      onChange={(e) => setNotifForm({ ...notifForm, booster_reward: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Envoyer la notification
                </button>
              </form>
            </div>

            {/* Notifications History */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Historique des notifications</h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Aucune notification envoyée</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <p className="text-white mb-2">{notif.message}</p>
                        <div className="flex gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatLocalDateTime(notif.created_at)}
                          </span>
                          {notif.berry_reward && (
                            <span className="text-yellow-400 flex items-center gap-1">
                              <Coins size={14} />
                              +{notif.berry_reward} Berrys
                            </span>
                          )}
                          {notif.booster_reward && (
                            <span className="text-green-400 flex items-center gap-1">
                              <Package size={14} />
                              +{notif.booster_reward} Boosters
                            </span>
                          )}
                          <span className="text-blue-400">Par: {notif.sent_by}</span>
                        </div>
                      </div>
                      {notif.is_active && (
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold ml-4"
                        >
                          Désactiver
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-green-400" />
              Activité récente
            </h3>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Aucune activité récente</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                  >
                    <p className="text-white mb-1">{activity.description}</p>
                    <div className="flex gap-3 text-sm text-slate-400">
                      {activity.username && (
                        <span className="text-blue-400">{activity.username}</span>
                      )}
                      <span>{formatLocalDateTime(activity.created_at)}</span>
                      <span className="text-slate-500">{activity.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
