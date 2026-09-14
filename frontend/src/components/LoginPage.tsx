import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, token } = res.data;
      localStorage.setItem('viajesq_token', token);
      localStorage.setItem('viajesq_user', JSON.stringify(user));
      onLogin(user, token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 16px rgba(79,70,229,0.3)'
          }}>🚗</div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1e1b4b' }}>ViajesQ</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>Sistema de Gestión de Viajes</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '24px', marginBottom: 0 }}>
          ViajesQ © 2024 — Gestión de transporte empresarial
        </p>
      </div>
    </div>
  );
}
