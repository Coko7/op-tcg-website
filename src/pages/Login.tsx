import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer la destination après connexion
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl font-bold text-white">OP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Connexion
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-300">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              créez un compte
            </Link>
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                <p className="text-red-200 text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="sr-only">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-3 py-2 sm:py-3 border border-white/30 rounded-lg placeholder-gray-400 text-white bg-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:z-10 text-sm sm:text-base transition-all"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 sm:py-3 border border-white/30 rounded-lg placeholder-gray-400 text-white bg-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:z-10 text-sm sm:text-base transition-all"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 sm:py-3 px-4 text-sm sm:text-base font-bold rounded-xl text-white bg-gradient-to-r from-treasure-500/90 to-treasure-600/90 hover:from-treasure-600 hover:to-treasure-700 focus:outline-none focus:ring-2 focus:ring-treasure-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-treasure-500/40 hover:scale-105 border border-treasure-400/30 backdrop-blur-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors text-xs sm:text-sm"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </form>
        </div>

        {/* Informations de connexion */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-3 sm:p-4 border border-white/10">
          <p className="text-xs text-gray-300 text-center mb-2">Création de compte :</p>
          <div className="text-xs text-gray-400 space-y-1 text-center">
            <div>Pas de compte ? Créez-en un gratuitement !</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;