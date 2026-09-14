import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 50px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>
          Soporte<span style={{ color: '#111827' }}>Q</span>
        </div>
        <nav>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          >
            Acceso Sistema ViajesQ
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '48px', color: '#111827', marginBottom: '20px', maxWidth: '800px' }}>
          Soluciones Tecnológicas Integrales para tu Empresa
        </h1>
        <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '40px', maxWidth: '600px', lineHeight: '1.6' }}>
          En SoporteQ brindamos asistencia técnica especializada, desarrollo de software a medida y modernización de infraestructura. Elevamos tu productividad con tecnología confiable.
        </p>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            style={{ padding: '15px 30px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Nuestros Servicios
          </button>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '15px 30px', backgroundColor: 'transparent', color: '#4f46e5', border: '2px solid #4f46e5', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Ingresar a ViajesQ &rarr;
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff', color: '#9ca3af', fontSize: '14px' }}>
        &copy; {new Date().getFullYear()} SoporteQ Tech. Todos los derechos reservados.
      </footer>
    </div>
  );
}
