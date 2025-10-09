import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Boosters from './pages/Boosters';
import Collection from './pages/Collection';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';

// Composant de redirection vers l'admin backend
function AdminRedirect() {
  useEffect(() => {
    // Rediriger vers le backend admin
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin`;
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🏴‍☠️ Redirection vers l'admin...</h1>
        <p>Si la redirection ne fonctionne pas, <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/admin`} style={{ color: '#60a5fa' }}>cliquez ici</a></p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Route admin - redirige vers le backend */}
          <Route path="/admin" element={<AdminRedirect />} />

          {/* Routes d'authentification */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />

          {/* Routes principales - toutes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="boosters" element={<Boosters />} />
            <Route path="collection" element={<Collection />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;