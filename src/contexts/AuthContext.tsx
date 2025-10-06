import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, LoginCredentials, RegisterData } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  stats?: any;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    stats: null,
  });

  // Initialisation - vérifier si un utilisateur est déjà connecté
  useEffect(() => {
    const initializeAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getCurrentUser();
          setAuthState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            stats: response.stats,
          });
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            stats: null,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          stats: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiService.login(credentials);
      const statsResponse = await apiService.getStats();

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        stats: statsResponse.data,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiService.register(userData);
      const statsResponse = await apiService.getStats();

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        stats: statsResponse.data,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        stats: null,
      });
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!apiService.isAuthenticated()) return;

    try {
      const response = await apiService.getCurrentUser();
      setAuthState(prev => ({
        ...prev,
        user: response.user,
        stats: response.stats,
      }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};