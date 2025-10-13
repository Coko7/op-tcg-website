import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
      return false;
    }


    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await register({ username, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
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
            Créer un compte
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-300">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              connectez-vous
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
                autoComplete="new-password"
                required
                className="relative block w-full px-3 py-2 sm:py-3 border border-white/30 rounded-lg placeholder-gray-400 text-white bg-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:z-10 text-sm sm:text-base transition-all"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full px-3 py-2 sm:py-3 border border-white/30 rounded-lg placeholder-gray-400 text-white bg-white/10 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent focus:z-10 text-sm sm:text-base transition-all"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 sm:py-3 px-4 text-sm sm:text-base font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-400/30 backdrop-blur-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </div>
                ) : (
                  'Créer mon compte'
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

        {/* Informations sur les exigences */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-3 sm:p-4 border border-white/10">
          <p className="text-xs text-gray-300 text-center mb-2">Exigences :</p>
          <div className="text-xs text-gray-400 space-y-1 text-center">
            <div>• Nom: 3+ caractères</div>
            <div>• Mot de passe: 6+ caractères</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;