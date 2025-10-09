// Configuration - Détecter automatiquement l'URL de l'API
const API_URL = (() => {
  // Si on est sur le même domaine que l'API, utiliser l'URL relative
  const currentHost = window.location.host;
  const currentProtocol = window.location.protocol;

  // Si on est sur le backend directement (port 5000 ou domaine backend)
  if (currentHost.includes('backend') || window.location.port === '5000') {
    return `${currentProtocol}//${currentHost}/api`;
  }

  // Sinon, essayer de deviner l'URL du backend
  // Si le frontend est sur un sous-domaine, remplacer par backend
  if (currentHost.includes('optcg.polo2409.work')) {
    return `${currentProtocol}//backend-optcg.polo2409.work/api`;
  }

  // Par défaut, localhost
  return 'http://localhost:5000/api';
})();

// État de l'application
// Note: Le token est maintenant dans un cookie httpOnly, pas besoin de le gérer en JS
const state = {
  token: null, // Non utilisé, le cookie est envoyé automatiquement
  user: null,
};

// Debug: afficher la configuration
console.log('🔧 Admin Panel Configuration:');
console.log('  API URL:', API_URL);
console.log('  Auth method: httpOnly cookies');
console.log('  Current host:', window.location.host);

// Éléments DOM
const elements = {
  // Écrans
  loginScreen: document.getElementById('loginScreen'),
  dashboardScreen: document.getElementById('dashboardScreen'),

  // Login
  loginForm: document.getElementById('loginForm'),
  loginBtn: document.getElementById('loginBtn'),
  loginError: document.getElementById('loginError'),

  // Navbar
  adminUsername: document.getElementById('adminUsername'),
  logoutBtn: document.getElementById('logoutBtn'),

  // Tabs
  tabs: document.querySelectorAll('.tab'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // Stats
  totalUsers: document.getElementById('totalUsers'),
  activeToday: document.getElementById('activeToday'),
  activeWeek: document.getElementById('activeWeek'),
  newWeek: document.getElementById('newWeek'),
  totalBerrys: document.getElementById('totalBerrys'),
  avgBerrys: document.getElementById('avgBerrys'),
  totalOpenings: document.getElementById('totalOpenings'),
  openedToday: document.getElementById('openedToday'),
  openedWeek: document.getElementById('openedWeek'),
  totalCards: document.getElementById('totalCards'),
  activeCards: document.getElementById('activeCards'),
  totalCardsOwned: document.getElementById('totalCardsOwned'),
  failedLogins: document.getElementById('failedLogins'),
  suspicious: document.getElementById('suspicious'),
  criticalEvents: document.getElementById('criticalEvents'),
  topPlayersTable: document.getElementById('topPlayersTable').querySelector('tbody'),

  // Notifications
  notificationForm: document.getElementById('notificationForm'),
  notifTitle: document.getElementById('notifTitle'),
  notifMessage: document.getElementById('notifMessage'),
  rewardBerrys: document.getElementById('rewardBerrys'),
  rewardBoosters: document.getElementById('rewardBoosters'),
  expiresAt: document.getElementById('expiresAt'),
  notifError: document.getElementById('notifError'),
  notifSuccess: document.getElementById('notifSuccess'),
  notificationsList: document.getElementById('notificationsList'),

  // Joueurs
  onlineUsersList: document.getElementById('onlineUsersList'),

  // Activité
  activityList: document.getElementById('activityList'),
};

// Utilitaires
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 5000);
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 5000);
}

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num || 0);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(dateString);
}

// API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important: envoyer les cookies httpOnly
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentification
async function login(username, password) {
  try {
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Connexion...';

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (!data.user.is_admin) {
      throw new Error('Accès refusé: droits administrateur requis');
    }

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('adminToken', data.token);

    showDashboard();
  } catch (error) {
    showError(elements.loginError, error.message);
  } finally {
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Connexion';
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('adminToken');
  showLogin();
}

function showLogin() {
  elements.loginScreen.classList.add('active');
  elements.dashboardScreen.classList.remove('active');
}

function showDashboard() {
  elements.loginScreen.classList.remove('active');
  elements.dashboardScreen.classList.add('active');
  elements.adminUsername.textContent = state.user.username;

  // Charger les données initiales
  loadDashboardStats();
  loadNotifications();
}

// Chargement des statistiques
async function loadDashboardStats() {
  try {
    const data = await apiRequest('/admin/dashboard/stats');
    const stats = data.data;

    // Utilisateurs
    elements.totalUsers.textContent = formatNumber(stats.users.total);
    elements.activeToday.textContent = formatNumber(stats.users.active_today);
    elements.activeWeek.textContent = formatNumber(stats.users.active_week);
    elements.newWeek.textContent = formatNumber(stats.users.new_week);

    // Économie
    elements.totalBerrys.textContent = formatNumber(stats.users.total_berrys);
    elements.avgBerrys.textContent = formatNumber(stats.users.avg_berrys);

    // Boosters
    elements.totalOpenings.textContent = formatNumber(stats.boosters.total_openings);
    elements.openedToday.textContent = formatNumber(stats.boosters.opened_today);
    elements.openedWeek.textContent = formatNumber(stats.boosters.opened_week);

    // Cartes
    elements.totalCards.textContent = formatNumber(stats.cards.total);
    elements.activeCards.textContent = formatNumber(stats.cards.active);
    elements.totalCardsOwned.textContent = formatNumber(stats.collections.total_cards_owned);

    // Sécurité
    elements.failedLogins.textContent = formatNumber(stats.security.failed_logins_24h);
    elements.suspicious.textContent = formatNumber(stats.security.suspicious_activities_24h);
    elements.criticalEvents.textContent = formatNumber(stats.security.critical_events_24h);

    // Top joueurs
    renderTopPlayers(stats.top_players);
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

function renderTopPlayers(players) {
  if (!players || players.length === 0) {
    elements.topPlayersTable.innerHTML = '<tr><td colspan="5" class="loading">Aucun joueur</td></tr>';
    return;
  }

  elements.topPlayersTable.innerHTML = players.map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${player.username}</td>
      <td>${formatNumber(player.berrys)} 💰</td>
      <td>${formatNumber(player.total_cards || 0)}</td>
      <td>${formatNumber(player.cards_owned || 0)}</td>
    </tr>
  `).join('');
}

// Notifications
async function loadNotifications() {
  try {
    const data = await apiRequest('/admin/notifications');
    renderNotifications(data.data);
  } catch (error) {
    console.error('Erreur chargement notifications:', error);
    elements.notificationsList.innerHTML = '<p class="loading">Erreur de chargement</p>';
  }
}

function renderNotifications(notifications) {
  if (!notifications || notifications.length === 0) {
    elements.notificationsList.innerHTML = '<p class="loading">Aucune notification</p>';
    return;
  }

  elements.notificationsList.innerHTML = notifications.map(notif => `
    <div class="notification-item">
      <div class="notification-header">
        <div>
          <div class="notification-title">${notif.title}</div>
          <div class="notification-meta">
            <span>📅 ${formatDate(notif.created_at)}</span>
            <span>👤 ${notif.created_by_username || 'Admin'}</span>
            <span>📊 ${notif.total_claims || 0} réclamations</span>
          </div>
        </div>
        <span class="notification-status ${notif.is_active ? 'active' : 'inactive'}">
          ${notif.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="notification-message">${notif.message}</div>
      ${(notif.reward_berrys > 0 || notif.reward_boosters > 0) ? `
        <div class="notification-rewards">
          ${notif.reward_berrys > 0 ? `<span class="reward-badge">💰 ${formatNumber(notif.reward_berrys)} Berrys</span>` : ''}
          ${notif.reward_boosters > 0 ? `<span class="reward-badge">📦 ${notif.reward_boosters} Boosters</span>` : ''}
        </div>
      ` : ''}
      ${notif.expires_at ? `<div class="notification-meta"><span>⏰ Expire: ${formatDate(notif.expires_at)}</span></div>` : ''}
    </div>
  `).join('');
}

async function sendNotification(formData) {
  try {
    elements.sendNotifBtn = document.getElementById('sendNotifBtn');
    elements.sendNotifBtn.disabled = true;
    elements.sendNotifBtn.textContent = 'Envoi en cours...';

    const data = await apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    showSuccess(elements.notifSuccess, 'Notification envoyée avec succès !');
    elements.notificationForm.reset();

    // Recharger la liste
    setTimeout(() => loadNotifications(), 1000);
  } catch (error) {
    showError(elements.notifError, error.message);
  } finally {
    elements.sendNotifBtn.disabled = false;
    elements.sendNotifBtn.textContent = '📤 Envoyer la notification';
  }
}

// Joueurs en ligne
async function loadOnlineUsers() {
  try {
    const data = await apiRequest('/admin/dashboard/online-users');
    renderOnlineUsers(data.data);
  } catch (error) {
    console.error('Erreur chargement joueurs en ligne:', error);
    elements.onlineUsersList.innerHTML = '<p class="loading">Erreur de chargement</p>';
  }
}

function renderOnlineUsers(data) {
  if (!data.users || data.users.length === 0) {
    elements.onlineUsersList.innerHTML = '<p class="loading">Aucun joueur en ligne</p>';
    return;
  }

  elements.onlineUsersList.innerHTML = `
    <p style="margin-bottom: 16px; color: var(--text-secondary);">
      <span class="online-indicator"></span>
      ${data.count} joueur${data.count > 1 ? 's' : ''} en ligne
    </p>
    ${data.users.map(user => `
      <div class="online-user-card">
        <div class="online-user-name">
          <span class="online-indicator"></span>
          ${user.username}
        </div>
        <div class="online-user-info">
          <span>💰 ${formatNumber(user.berrys)} Berrys</span>
          <span>📦 ${user.available_boosters} Boosters</span>
        </div>
        <div class="online-user-info">
          <span style="font-size: 0.85rem;">Dernière activité: ${formatRelativeTime(user.last_login)}</span>
        </div>
      </div>
    `).join('')}
  `;
}

// Activité récente
async function loadRecentActivity() {
  try {
    const data = await apiRequest('/admin/dashboard/activity?limit=50');
    renderActivity(data.data);
  } catch (error) {
    console.error('Erreur chargement activité:', error);
    elements.activityList.innerHTML = '<p class="loading">Erreur de chargement</p>';
  }
}

function renderActivity(activities) {
  if (!activities || activities.length === 0) {
    elements.activityList.innerHTML = '<p class="loading">Aucune activité récente</p>';
    return;
  }

  const actionIcons = {
    'user_login': '🔐',
    'user_register': '👤',
    'booster_opened': '📦',
    'booster_purchased': '🛒',
    'achievement_claimed': '🏆',
  };

  const actionLabels = {
    'user_login': 'Connexion',
    'user_register': 'Inscription',
    'booster_opened': 'Booster ouvert',
    'booster_purchased': 'Booster acheté',
    'achievement_claimed': 'Succès réclamé',
  };

  elements.activityList.innerHTML = activities.map(activity => {
    const details = typeof activity.details === 'string'
      ? JSON.parse(activity.details)
      : activity.details;

    return `
      <div class="activity-item">
        <div class="activity-icon">${actionIcons[activity.action] || '📋'}</div>
        <div class="activity-content">
          <div class="activity-action">${actionLabels[activity.action] || activity.action}</div>
          <div class="activity-details">
            ${activity.user_id ? `User ID: ${activity.user_id}` : ''}
            ${details && details.username ? ` - ${details.username}` : ''}
          </div>
        </div>
        <div class="activity-time">${formatRelativeTime(activity.created_at)}</div>
      </div>
    `;
  }).join('');
}

// Event Listeners
elements.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  login(username, password);
});

elements.logoutBtn.addEventListener('click', logout);

// Gestion des onglets
elements.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;

    // Mettre à jour les onglets actifs
    elements.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Mettre à jour les panels actifs
    elements.tabPanels.forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Charger les données si nécessaire
    switch(tabName) {
      case 'stats':
        loadDashboardStats();
        break;
      case 'notifications':
        loadNotifications();
        break;
      case 'players':
        loadOnlineUsers();
        break;
      case 'activity':
        loadRecentActivity();
        break;
    }
  });
});

// Formulaire de notification
elements.notificationForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = {
    title: elements.notifTitle.value,
    message: elements.notifMessage.value,
    reward_berrys: parseInt(elements.rewardBerrys.value) || 0,
    reward_boosters: parseInt(elements.rewardBoosters.value) || 0,
    expires_at: elements.expiresAt.value || null,
  };

  sendNotification(formData);
});

// Initialisation
async function init() {
  if (state.token) {
    try {
      // Vérifier si le token est valide et récupérer les infos utilisateur
      const userResponse = await apiRequest('/users/me');

      // Vérifier si l'utilisateur est admin
      if (!userResponse.user || !userResponse.user.is_admin) {
        throw new Error('Accès refusé: droits administrateur requis');
      }

      state.user = userResponse.user;

      // Charger le dashboard si admin
      showDashboard();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      // Token invalide ou pas admin, afficher message et retour à la connexion
      if (error.message.includes('admin')) {
        alert('⛔ Accès refusé\n\nCette interface est réservée aux administrateurs.\nVotre compte ne dispose pas des droits nécessaires.');
      }
      // Nettoyer le token invalide
      state.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('adminToken');
      showLogin();
    }
  } else {
    showLogin();
  }
}

// Démarrer l'application
init();
