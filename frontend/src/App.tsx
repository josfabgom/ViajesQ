import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AdminView } from './components/AdminView';
import { DriverView } from './components/DriverView';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function ProtectedDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="container">
      <div className="app-header">
        <div className="app-header-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.jpg" alt="ViajesQ Logo" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <h1 style={{ margin: 0, lineHeight: '1.2' }}>ViajesQ</h1>
            <p style={{ margin: 0, marginTop: '4px' }}>
              {user.role === 'driver' ? `Bienvenido, ${user.name} 👋` : `Panel de Control — ${user.name} (${user.role})`}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary logout-btn">
          Cerrar Sesión
        </button>
      </div>
      {user.role === 'driver' ? <DriverView currentDriverId={user.id} /> : <AdminView />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('viajesq_token');
    const savedUser = localStorage.getItem('viajesq_user');
    
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }

    if (savedToken && savedUser) {
      axios.get(`${API_URL}/auth/me`)
        .then(() => {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }).catch(() => {
          localStorage.removeItem('viajesq_token');
          localStorage.removeItem('viajesq_user');
          delete axios.defaults.headers.common['Authorization'];
        }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (loggedUser: any, loggedToken: string) => {
    setUser(loggedUser);
    setToken(loggedToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${loggedToken}`;
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('viajesq_token');
    localStorage.removeItem('viajesq_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
      } />
      <Route path="/dashboard" element={<ProtectedDashboard user={user} onLogout={handleLogout} />} />
      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
