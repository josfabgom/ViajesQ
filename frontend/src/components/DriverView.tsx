import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const CustomToolbar = (toolbar: any) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  return (
    <div className="custom-calendar-toolbar">
      <div className="toolbar-navigation">
        <button className="toolbar-btn" onClick={goToBack}>&#10094;</button>
        <button className="toolbar-btn today-btn" onClick={goToCurrent}>Hoy</button>
        <button className="toolbar-btn" onClick={goToNext}>&#10095;</button>
      </div>
      <div className="toolbar-label">
        <span className="rbc-toolbar-label" style={{ fontWeight: 600, fontSize: '1.1rem', textTransform: 'capitalize' }}>
          {toolbar.label}
        </span>
      </div>
      <div className="toolbar-views">
        <select 
          className="form-control view-select" 
          value={toolbar.view} 
          onChange={(e) => toolbar.onView(e.target.value)}
        >
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
          <option value="agenda">Agenda</option>
        </select>
      </div>
    </div>
  );
};

export function DriverView({ currentDriverId }: { currentDriverId?: string }) {
  const [activeTab, setActiveTab] = useState('viajes');
  
  // Tab 1: Viajes y Calendario
  const [trips, setTrips] = useState<any[]>([]);
  const [calculatedKm, setCalculatedKm] = useState<string>('');
  const [status, setStatus] = useState('idle'); // idle -> in_progress (locally)
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<any>('week');
  const [showMap, setShowMap] = useState(false);

  // Tab 2: Cuenta Corriente
  const [balanceData, setBalanceData] = useState<any>(null);
  const [pendingTrips, setPendingTrips] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 30000);
    return () => clearInterval(interval);
  }, [currentDriverId]);

  useEffect(() => {
    if (!currentDriverId) return;

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    let socket: any;
    import('socket.io-client').then(({ io }) => {
      socket = io(API_URL.replace('/api', ''));
      socket.on('connect', () => {
        socket.emit('join', { role: 'driver', driverId: currentDriverId });
      });

      socket.on('trip_reminder', (data) => {
        showToast(data.message, 'success');
        if (Notification.permission === 'granted') {
          new Notification('Recordatorio de Viaje', { body: data.message });
        }
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentDriverId]);

  const fetchDriverData = async () => {
    if (!currentDriverId) return;
    try {
      // Get all trips for the driver (for calendar and list)
      const resTrips = await axios.get(`${API_URL}/trips?driver_id=${currentDriverId}`);
      setTrips(resTrips.data);

      // See if any trip is currently in progress
      const inProgressTrip = resTrips.data.find((t: any) => t.status === 'in_progress');
      if (inProgressTrip && !currentTripId) {
        setCurrentTripId(inProgressTrip.id);
        setStatus('in_progress');
        setCalculatedKm(inProgressTrip.distance_km || '');
      } else if (!inProgressTrip) {
        setStatus('idle');
        setCurrentTripId(null);
      }

      // Fetch financial data and settings
      const [resBalance, resPending, resHistory, resSettings] = await Promise.all([
        axios.get(`${API_URL}/auth/me/balance`),
        axios.get(`${API_URL}/auth/me/pending-trips`),
        axios.get(`${API_URL}/auth/me/payment-history`),
        axios.get(`${API_URL}/admin/settings`)
      ]);
      setBalanceData(resBalance.data);
      setPendingTrips(resPending.data);
      setPaymentHistory(resHistory.data);
      if (resSettings.data) {
        setSettings(resSettings.data);
      }
      
    } catch (error) {
      console.error('Error fetching driver data', error);
    }
  };

  const handleStartTrip = async (trip: any) => {
    try {
      await axios.put(`${API_URL}/trips/${trip.id}`, { status: 'in_progress' });
      setCurrentTripId(trip.id);
      setStatus('in_progress');
      setCalculatedKm(trip.distance_km || '');
      fetchDriverData();
    } catch (error) {
      alert('Error al iniciar el viaje');
    }
  };

  const handleFinishTrip = async () => {
    if (!calculatedKm) return alert('Por favor, ingresa los kilómetros recorridos antes de finalizar.');
    try {
      await axios.put(`${API_URL}/trips/${currentTripId}/finish`, {
        distance_km: parseFloat(calculatedKm)
      });
      setStatus('idle');
      setCurrentTripId(null);
      setCalculatedKm('');
      alert('Viaje finalizado exitosamente.');
      fetchDriverData();
    } catch (error) {
      alert('Error al finalizar el viaje');
    }
  };

  // Prepare events for calendar
  const events = trips.map(t => ({
    title: `${t.origin_address} ➔ ${t.destination_address} (${t.passenger_name})`,
    start: new Date(t.scheduled_time || t.created_at),
    end: new Date(new Date(t.scheduled_time || t.created_at).getTime() + (settings?.trip_auto_finish_minutes || 20) * 60 * 1000), // Auto finish block
    resource: t,
  }));

  const getTripDate = (t: any) => t.ended_at ? parseISO(t.ended_at) : parseISO(t.scheduled_time || t.created_at);
  const pendingTripsToStart = trips.filter(t => t.status !== 'completed' && t.status !== 'in_progress');

  const getMinTime = () => {
    const timeString = settings?.calendar_start_time || '00:00';
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return d;
  };

  const getMaxTime = () => {
    const timeString = settings?.calendar_end_time || '23:59';
    const [hours, minutes] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 59, 999);
    return d;
  };

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '⏱️' : '❌'} {toast.message}
          </div>
        </div>
      )}
      <div className="mobile-tabs-dropdown">
        <label className="mobile-tabs-label">Sección Actual:</label>
        <select 
          className="form-control" 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="viajes">📅 Mis Viajes</option>
          <option value="cuenta">💳 Mi Cuenta</option>
        </select>
      </div>
      <div className="admin-tabs desktop-tabs" style={{ marginBottom: '20px' }}>
        <button className={`admin-tab-btn ${activeTab === 'viajes' ? 'active' : ''}`} onClick={() => setActiveTab('viajes')}>📅 Mis Viajes</button>
        <button className={`admin-tab-btn ${activeTab === 'cuenta' ? 'active' : ''}`} onClick={() => setActiveTab('cuenta')}>💳 Mi Cuenta</button>
      </div>

      {activeTab === 'viajes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Status Panel */}
          {status === 'in_progress' && currentTripId ? (
            <div className="card" style={{ border: '2px solid #10b981', backgroundColor: '#ecfdf5' }}>
              <h3 style={{ color: '#047857', marginTop: 0 }}>🚕 Viaje en Curso</h3>
              <p>Tienes un viaje actualmente en proceso. Este viaje se finalizará automáticamente según el tiempo configurado por el administrador en el sistema. ¡Buen viaje!</p>
            </div>
          ) : (
            pendingTripsToStart.length > 0 && (
              <div className="card" style={{ border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginTop: 0 }}>📍 Viajes Pendientes</h3>
                {pendingTripsToStart.map(trip => (
                  <div key={trip.id} style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong>{format(new Date(trip.scheduled_time || trip.created_at), 'HH:mm')}</strong> - {trip.passenger_name} <br/>
                      <small>{trip.origin_address} ➔ {trip.destination_address}</small>
                    </div>
                    <button className="btn" style={{ width: 'auto' }} onClick={() => handleStartTrip(trip)}>
                      ▶️ Iniciar
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Calendar */}
          <div className="card">
            <div className="calendar-header">
              <h3 style={{ margin: 0 }}>🗓️ Mi Calendario Semanal</h3>
              <button className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} onClick={() => setShowMap(true)}>🗺️ Ver Mapa del Día</button>
            </div>
            <div style={{ height: '500px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                date={calendarDate}
                onNavigate={setCalendarDate}
                view={calendarView}
                onView={setCalendarView}
                startAccessor="start"
                endAccessor="end"
                min={getMinTime()}
                max={getMaxTime()}
                culture="es"
                components={{
                  toolbar: CustomToolbar
                }}
                messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", noEventsInRange: "No hay viajes programados." }}
                eventPropGetter={(event) => {
                  let backgroundColor = '#3b82f6'; // Programado
                  let className = '';
                  if (event.resource.status === 'in_progress') {
                    backgroundColor = '#10b981';
                    className = 'event-corriendo';
                  }
                  if (event.resource.status === 'completed') backgroundColor = '#9ca3af';
                  return { className, style: { backgroundColor, borderRadius: '6px', color: '#fff', fontSize: '13px' } };
                }}
              />
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '13px', color: '#666' }}>
              <span>🟦 Programado</span>
              <span>🟩 En Curso</span>
              <span>⬜ Completado</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', zIndex: 1000 }}>
            <div className="modal-header">
              <h2>📍 Mapa del {calendarDate.toLocaleDateString()}</h2>
              <button className="close-btn" onClick={() => setShowMap(false)}>×</button>
            </div>
            <div className="modal-content" style={{ height: '400px' }}>
              <MapContainer 
                center={[parseFloat(settings?.default_lat) || -34.6037, parseFloat(settings?.default_lng) || -58.3816]} 
                zoom={11} 
                style={{ height: '100%', width: '100%', borderRadius: '4px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {events.filter(e => isSameDay(e.start, calendarDate)).map(e => (
                  <div key={e.resource.id}>
                    {e.resource.origin_lat && e.resource.origin_lng && (
                      <Marker position={[parseFloat(e.resource.origin_lat), parseFloat(e.resource.origin_lng)]}>
                        <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.9} className="map-tooltip">
                          <strong style={{fontSize:'12px'}}>{e.resource.origin_address}</strong><br/>{format(e.start, 'HH:mm')}
                        </Tooltip>
                        <Popup><strong>Origen:</strong> {e.resource.origin_address}<br/>({format(e.start, 'HH:mm')})</Popup>
                      </Marker>
                    )}
                    {e.resource.destination_lat && e.resource.destination_lng && (
                      <Marker position={[parseFloat(e.resource.destination_lat), parseFloat(e.resource.destination_lng)]}>
                        <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.9} className="map-tooltip">
                          <strong style={{fontSize:'12px'}}>{e.resource.destination_address}</strong><br/>{format(e.start, 'HH:mm')}
                        </Tooltip>
                        <Popup><strong>Destino:</strong> {e.resource.destination_address}<br/>({format(e.start, 'HH:mm')})</Popup>
                      </Marker>
                    )}
                  </div>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cuenta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>Saldo a Favor</h2>
            <h1 style={{ fontSize: '48px', color: 'var(--primary-color)', margin: '10px 0' }}>
              ${balanceData?.balance?.toFixed(2) || '0.00'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Generado: ${balanceData?.total_earned || '0.00'} | Cobrado: ${balanceData?.total_paid || '0.00'}
            </p>
          </div>

          <div className="card">
            <h3>Viajes Pendientes de Cobro</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Fecha</th><th>Ruta</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  {pendingTrips.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>No hay viajes pendientes.</td></tr>}
                  {pendingTrips.map(t => (
                    <tr key={t.id}>
                      <td data-label="Fecha">{new Date(t.ended_at || t.scheduled_time || t.created_at).toLocaleDateString()}</td>
                      <td data-label="Ruta">{t.origin_address} ➔ {t.destination_address}</td>
                      <td data-label="Monto" style={{ fontWeight: 'bold' }}>${t.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Historial de Pagos Recibidos</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Fecha</th><th>Método</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  {paymentHistory.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>No hay pagos registrados.</td></tr>}
                  {paymentHistory.map(p => (
                    <tr key={p.id}>
                      <td data-label="Fecha">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td data-label="Método" style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                      <td data-label="Monto" style={{ color: '#10b981', fontWeight: 'bold' }}>+${parseFloat(p.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}