const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    is_admin: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  message: string;
}

interface User {
  id: string;
  username: string;
  is_admin: boolean;
  berrys?: number;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Récupérer les tokens depuis le localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Ajouter le token d'authentification si disponible
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Si le token a expiré, essayer de le rafraîchir
        if (response.status === 401 && errorData?.code === 'TOKEN_EXPIRED' && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Réessayer la requête avec le nouveau token
            headers.Authorization = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        }

        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setAccessToken(data.accessToken);
        return true;
      } else {
        // Refresh token invalide, déconnecter l'utilisateur
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Méthodes d'authentification
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<{ user: User; stats: any }> {
    return await this.request('/auth/me');
  }

  // Méthodes pour les cartes et boosters
  async getCards(params?: {
    page?: number;
    limit?: number;
    search?: string;
    booster_id?: string;
    rarity?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.booster_id) queryParams.append('booster_id', params.booster_id);
    if (params?.rarity) queryParams.append('rarity', params.rarity);

    const query = queryParams.toString();
    return await this.request(`/cards${query ? `?${query}` : ''}`);
  }

  async getCard(id: string): Promise<any> {
    return await this.request(`/cards/${id}`);
  }

  async getBoosters(params?: {
    page?: number;
    limit?: number;
    search?: string;
    series?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.series) queryParams.append('series', params.series);

    const query = queryParams.toString();
    return await this.request(`/boosters${query ? `?${query}` : ''}`);
  }

  async getBooster(id: string): Promise<any> {
    return await this.request(`/boosters/${id}`);
  }

  async getStats(): Promise<any> {
    return await this.request('/users/stats');
  }

  // Méthodes pour la collection utilisateur
  async getUserCollection(): Promise<any> {
    return await this.request('/users/collection');
  }

  async addCardsToCollection(cardIds: string[]): Promise<any> {
    return await this.request('/users/collection', {
      method: 'POST',
      body: JSON.stringify({ cardIds }),
    });
  }

  async toggleFavorite(cardId: string): Promise<any> {
    return await this.request(`/users/collection/favorite/${cardId}`, {
      method: 'PUT',
    });
  }

  // Méthodes pour les boosters
  async getBoosterStatus(): Promise<any> {
    return await this.request('/users/booster-status');
  }

  async openBooster(boosterId?: string): Promise<any> {
    return await this.request('/users/open-booster', {
      method: 'POST',
      body: JSON.stringify({ boosterId }),
    });
  }

  // Acheter un booster avec des Berrys
  async buyBoosterWithBerrys(boosterId?: string): Promise<any> {
    return await this.request('/users/buy-booster', {
      method: 'POST',
      body: JSON.stringify({ boosterId }),
    });
  }

  // Vendre une carte
  async sellCard(cardId: string, quantity: number = 1): Promise<any> {
    return await this.request('/users/sell-card', {
      method: 'POST',
      body: JSON.stringify({ cardId, quantity }),
    });
  }

  // Obtenir le solde de Berrys
  async getBerrysBalance(): Promise<any> {
    return await this.request('/users/berrys');
  }

  // Définir la carte favorite de profil
  async setProfileFavoriteCard(cardId: string | null): Promise<any> {
    return await this.request('/users/profile-favorite-card', {
      method: 'PUT',
      body: JSON.stringify({ cardId }),
    });
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return await this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Méthodes pour les récompenses quotidiennes
  async checkDailyReward(): Promise<any> {
    return await this.request('/users/daily-reward/check');
  }

  async claimDailyReward(): Promise<any> {
    return await this.request('/users/daily-reward/claim', {
      method: 'POST',
    });
  }

  // Méthodes pour les achievements
  async getAchievements(): Promise<any> {
    return await this.request('/users/achievements');
  }

  async getAchievementStats(): Promise<any> {
    return await this.request('/users/achievements/stats');
  }

  async claimAchievement(achievementId: string): Promise<any> {
    return await this.request(`/users/achievements/${achievementId}/claim`, {
      method: 'POST',
    });
  }

  // Méthodes pour le leaderboard
  async getLeaderboard(): Promise<any> {
    return await this.request('/leaderboard');
  }

  // Méthodes pour les notifications
  async getNotifications(): Promise<any> {
    return await this.request('/notifications');
  }

  async claimNotification(notificationId: string): Promise<any> {
    return await this.request(`/notifications/${notificationId}/claim`, {
      method: 'POST',
    });
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Obtenir le token actuel
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Instance singleton
export const apiService = new ApiService();
export type { LoginCredentials, RegisterData, AuthResponse, User };