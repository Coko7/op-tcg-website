import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import './Admin.css';

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    active_today: number;
    active_week: number;
    new_week: number;
    total_berrys: number;
    avg_berrys: number;
  };
  cards: {
    total: number;
    active: number;
  };
  collections: {
    total: number;
    total_cards_owned: number;
    users_with_cards: number;
    avg_per_user: number;
  };
  boosters: {
    total_openings: number;
    opened_today: number;
    opened_week: number;
  };
  achievements: {
    total: number;
    completions: number;
    claimed: number;
  };
  security: {
    failed_logins_24h: number;
    suspicious_activities_24h: number;
    critical_events_24h: number;
  };
  top_players: Array<{
    username: string;
    berrys: number;
    total_cards: number;
    cards_owned: number;
  }>;
}

interface OnlineUser {
  id: string;
  username: string;
  last_login: string;
  berrys: number;
  available_boosters: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats and online users in parallel
      const [statsResponse, onlineResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          }
        }),
        fetch('/api/admin/dashboard/online-users', {
          headers: {
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          }
        })
      ]);

      if (!statsResponse.ok || !onlineResponse.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const statsData = await statsResponse.json();
      const onlineData = await onlineResponse.json();

      console.log('📊 Stats reçues:', statsData);
      console.log('👥 Online users reçus:', onlineData);

      // Vérifier que les données existent
      if (!statsData || !statsData.data) {
        console.error('❌ Pas de données stats:', statsData);
        throw new Error('Données de statistiques manquantes');
      }

      setStats(statsData.data);
      setOnlineUsers(onlineData.data?.users || []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Chargement du dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error">❌ {error}</div>
        <button onClick={loadDashboardData}>Réessayer</button>
      </div>
    );
  }

  if (!stats) {
    console.log('⚠️ Stats est null/undefined après chargement');
    return (
      <div className="admin-dashboard">
        <div className="error">⚠️ Aucune donnée disponible</div>
        <button onClick={loadDashboardData}>Recharger</button>
      </div>
    );
  }

  console.log('✅ Affichage du dashboard avec stats:', stats);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>🎮 Administration - One Piece Booster Game</h1>
        <div className="admin-nav">
          <Link to="/admin" className="active">Dashboard</Link>
          <Link to="/admin/notifications">Notifications</Link>
          <Link to="/admin/users">Utilisateurs</Link>
          <Link to="/">← Retour au jeu</Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Users Stats */}
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Utilisateurs</h3>
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-details">
              <div>✅ Actifs aujourd'hui: {stats.users.active_today}</div>
              <div>📅 Actifs cette semaine: {stats.users.active_week}</div>
              <div>🆕 Nouveaux cette semaine: {stats.users.new_week}</div>
              <div>👑 Admins: {stats.users.admins}</div>
            </div>
          </div>
        </div>

        {/* Cards Stats */}
        <div className="stat-card">
          <div className="stat-icon">🃏</div>
          <div className="stat-content">
            <h3>Cartes</h3>
            <div className="stat-value">{stats.cards.total.toLocaleString()}</div>
            <div className="stat-details">
              <div>✅ Cartes actives: {stats.cards.active.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Collections Stats */}
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Collections</h3>
            <div className="stat-value">{stats.collections.total.toLocaleString()}</div>
            <div className="stat-details">
              <div>🎴 Cartes possédées: {stats.collections.total_cards_owned.toLocaleString()}</div>
              <div>👤 Collectionneurs: {stats.collections.users_with_cards}</div>
              <div>📊 Moyenne/joueur: {stats.collections.avg_per_user}</div>
            </div>
          </div>
        </div>

        {/* Boosters Stats */}
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Boosters</h3>
            <div className="stat-value">{stats.boosters.total_openings.toLocaleString()}</div>
            <div className="stat-details">
              <div>📅 Ouverts aujourd'hui: {stats.boosters.opened_today}</div>
              <div>📈 Ouverts cette semaine: {stats.boosters.opened_week}</div>
            </div>
          </div>
        </div>

        {/* Berrys Stats */}
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Berrys</h3>
            <div className="stat-value">{stats.users.total_berrys.toLocaleString()}</div>
            <div className="stat-details">
              <div>📊 Moyenne/joueur: {stats.users.avg_berrys.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Achievements Stats */}
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Achievements</h3>
            <div className="stat-value">{stats.achievements.total}</div>
            <div className="stat-details">
              <div>✅ Complétions: {stats.achievements.completions}</div>
              <div>🎁 Réclamés: {stats.achievements.claimed}</div>
            </div>
          </div>
        </div>

        {/* Security Stats */}
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">🔒</div>
          <div className="stat-content">
            <h3>Sécurité (24h)</h3>
            <div className="stat-value">{stats.security.failed_logins_24h}</div>
            <div className="stat-details">
              <div>⚠️ Activités suspectes: {stats.security.suspicious_activities_24h}</div>
              <div>🚨 Événements critiques: {stats.security.critical_events_24h}</div>
            </div>
          </div>
        </div>

        {/* Online Users */}
        <div className="stat-card stat-card-success">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>En Ligne Maintenant</h3>
            <div className="stat-value">{onlineUsers.length}</div>
            <div className="stat-details">
              <div>Actifs dans les 5 dernières minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Players */}
      <div className="top-players-section">
        <h2>🏆 Top 10 Joueurs</h2>
        <div className="top-players-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Joueur</th>
                <th>Berrys</th>
                <th>Cartes Uniques</th>
                <th>Cartes Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_players.map((player, index) => (
                <tr key={player.username}>
                  <td className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </td>
                  <td className="username">{player.username}</td>
                  <td className="berrys">{player.berrys.toLocaleString()} ₿</td>
                  <td>{player.total_cards || 0}</td>
                  <td>{player.cards_owned || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Users List */}
      {onlineUsers.length > 0 && (
        <div className="online-users-section">
          <h2>🟢 Utilisateurs En Ligne ({onlineUsers.length})</h2>
          <div className="online-users-list">
            {onlineUsers.map((user) => (
              <div key={user.id} className="online-user-card">
                <div className="user-info">
                  <strong>{user.username}</strong>
                  <span className="user-berrys">{user.berrys.toLocaleString()} ₿</span>
                </div>
                <div className="user-meta">
                  <span>📦 {user.available_boosters} boosters</span>
                  <span className="last-login">
                    {new Date(user.last_login).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Actions Rapides</h2>
        <div className="action-buttons">
          <Link to="/admin/notifications" className="action-btn action-btn-primary">
            📢 Créer une Notification
          </Link>
          <button onClick={loadDashboardData} className="action-btn action-btn-secondary">
            🔄 Actualiser les Données
          </button>
        </div>
      </div>
    </div>
  );
}
