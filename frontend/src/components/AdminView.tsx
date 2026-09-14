import { CalendarioView } from './CalendarioView';
import { CuentaCorrienteView } from './CuentaCorrienteView';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function LocationPickerMap({ lat, lng, onLocationSelect, defaultLat = -34.6037, defaultLng = -58.3816 }: { lat?: number, lng?: number, onLocationSelect: (lat: number, lng: number) => void, defaultLat?: number, defaultLng?: number }) {
  const centerLat = lat || defaultLat;
  const centerLng = lng || defaultLng;
  const [position, setPosition] = useState<[number, number] | null>(lat && lng ? [lat, lng] : null);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ddd' }}>
      <MapContainer center={[centerLat, centerLng]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {position && <Marker position={position} />}
        <MapEvents />
      </MapContainer>
    </div>
  );
}

export function AdminView() {
  const [activeTab, setActiveTab] = useState('viajes');
  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [priceRates, setPriceRates] = useState<any[]>([]);
  
  const [settings, setSettings] = useState<any>({ default_lat: -34.6037, default_lng: -58.3816 });
  const [settingsForm, setSettingsForm] = useState<any>({});

  // Modal State
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [formData, setFormData] = useState<any>({});

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };


  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'viajes') {
        const res = await axios.get(`${API_URL}/trips`);
        setTrips(res.data);
      } else if (activeTab === 'choferes') {
        const res = await axios.get(`${API_URL}/admin/drivers`);
        setDrivers(res.data);
      } else if (activeTab === 'pasajeros') {
        const res = await axios.get(`${API_URL}/admin/passengers`);
        setPassengers(res.data);
      } else if (activeTab === 'vehiculos') {
        const res = await axios.get(`${API_URL}/admin/vehicles`);
        setVehicles(res.data);
      } else if (activeTab === 'lugares') {
        const res = await axios.get(`${API_URL}/admin/places`);
        setPlaces(res.data);
      } else if (activeTab === 'rutas') {
        const [routesRes, driversRes, passRes, placesRes, ratesRes] = await Promise.all([
          axios.get(`${API_URL}/admin/routes`),
          axios.get(`${API_URL}/admin/drivers`),
          axios.get(`${API_URL}/admin/passengers`),
          axios.get(`${API_URL}/admin/places`),
          axios.get(`${API_URL}/admin/price-rates`)
        ]);
        setRoutesData(routesRes.data);
        setDrivers(driversRes.data);
        setPassengers(passRes.data);
        setPlaces(placesRes.data);
        setPriceRates(ratesRes.data);
      
      } else if (activeTab === 'calendario') {
        const [tripsRes, driversRes, passRes, placesRes, ratesRes] = await Promise.all([
          axios.get(`${API_URL}/trips`),
          axios.get(`${API_URL}/admin/drivers`),
          axios.get(`${API_URL}/admin/passengers`),
          axios.get(`${API_URL}/admin/places`),
          axios.get(`${API_URL}/admin/price-rates`)
        ]);
        setTrips(tripsRes.data);
        setDrivers(driversRes.data);
        setPassengers(passRes.data);
        setPlaces(placesRes.data);
        setPriceRates(ratesRes.data);
} else if (activeTab === 'tarifas') {
        const res = await axios.get(`${API_URL}/admin/price-rates`);
        setPriceRates(res.data);
      } else if (activeTab === 'configuracion') {
        const res = await axios.get(`${API_URL}/admin/settings`);
        setSettings(res.data);
        setSettingsForm(res.data);
      } else if (activeTab === 'usuarios') {
        const [usersRes, rolesRes] = await Promise.all([
          axios.get(`${API_URL}/admin/users`),
          axios.get(`${API_URL}/admin/roles`)
        ]);
        setUsersData(usersRes.data);
        setRoles(rolesRes.data);
      } else if (activeTab === 'cuenta_corriente') {
        const res = await axios.get(`${API_URL}/admin/drivers`);
        setDrivers(res.data);
      }
      
      // Always fetch settings for default map center
      const s = await axios.get(`${API_URL}/admin/settings`);
      setSettings(s.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      if (modalType === 'driver') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/drivers/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/drivers`, formData);
      } else if (modalType === 'passenger') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/passengers/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/passengers`, formData);
      } else if (modalType === 'vehicle') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/vehicles/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/vehicles`, formData);
      } else if (modalType === 'place') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/places/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/places`, formData);
      } else if (modalType === 'route') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/routes/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/routes`, formData);
      } else if (modalType === 'user') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/users/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/users`, formData);
      
      } else if (modalType === 'trip') {
        if (editingItem?.id) await axios.put(`${API_URL}/trips/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/trips`, formData);
} else if (modalType === 'price_rate') {
        if (editingItem?.id) await axios.put(`${API_URL}/admin/price-rates/${editingItem.id}`, formData);
        else await axios.post(`${API_URL}/admin/price-rates`, formData);
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error guardando los datos', 'error');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      if (type === 'driver') await axios.delete(`${API_URL}/admin/drivers/${id}`);
      else if (type === 'passenger') await axios.delete(`${API_URL}/admin/passengers/${id}`);
      else if (type === 'vehicle') await axios.delete(`${API_URL}/admin/vehicles/${id}`);
      else if (type === 'place') await axios.delete(`${API_URL}/admin/places/${id}`);
      else if (type === 'route') await axios.delete(`${API_URL}/admin/routes/${id}`);
      else if (type === 'user') await axios.delete(`${API_URL}/admin/users/${id}`);
      
      else if (type === 'trip') await axios.delete(`${API_URL}/trips/${id}`);
      else if (type === 'price_rate') await axios.delete(`${API_URL}/admin/price-rates/${id}`);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error eliminando el registro (podría estar en uso)', 'error');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c * 1.3; // 1.3 factor to roughly account for roads vs straight line
    return dist.toFixed(2);
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_URL}/admin/settings`, settingsForm);
      showToast('Configuración guardada exitosamente.', 'success');
      fetchData();
    } catch (error) {
      showToast('Error guardando configuración', 'error');
    }
  };

  return (
    <div className="card">
      <h2>📊 Panel de Administración</h2>
      
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
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
          <option value="calendario">📅 Calendario</option>
          <option value="viajes">🛣️ Viajes</option>
          <option value="rutas">🗺️ Rutas</option>
          <option value="tarifas">💰 Tarifas</option>
          <option value="lugares">📍 Lugares</option>
          <option value="choferes">👨‍✈️ Choferes</option>
          <option value="cuenta_corriente">💳 Cuentas Choferes</option>
          <option value="pasajeros">👥 Pasajeros</option>
          <option value="vehiculos">🚗 Vehículos</option>
          <option value="configuracion">⚙️ Configuración</option>
        </select>
      </div>

      <div className="admin-tabs desktop-tabs">
        <button className={`admin-tab-btn ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => setActiveTab('calendario')}>📅 Calendario</button>
        <button className={`admin-tab-btn ${activeTab === 'viajes' ? 'active' : ''}`} onClick={() => setActiveTab('viajes')}>🛣️ Viajes</button>
        <button className={`admin-tab-btn ${activeTab === 'rutas' ? 'active' : ''}`} onClick={() => setActiveTab('rutas')}>🗺️ Rutas</button>
        <button className={`admin-tab-btn ${activeTab === 'tarifas' ? 'active' : ''}`} onClick={() => setActiveTab('tarifas')}>💰 Tarifas</button>
        <button className={`admin-tab-btn ${activeTab === 'lugares' ? 'active' : ''}`} onClick={() => setActiveTab('lugares')}>📍 Lugares</button>
        <button className={`admin-tab-btn ${activeTab === 'choferes' ? 'active' : ''}`} onClick={() => setActiveTab('choferes')}>👨‍✈️ Choferes</button>
        <button className={`admin-tab-btn ${activeTab === 'cuenta_corriente' ? 'active' : ''}`} onClick={() => setActiveTab('cuenta_corriente')}>💳 Cuentas</button>
        <button className={`admin-tab-btn ${activeTab === 'pasajeros' ? 'active' : ''}`} onClick={() => setActiveTab('pasajeros')}>👥 Pasajeros</button>
        <button className={`admin-tab-btn ${activeTab === 'vehiculos' ? 'active' : ''}`} onClick={() => setActiveTab('vehiculos')}>🚗 Vehículos</button>
        <button className={`admin-tab-btn ${activeTab === 'configuracion' ? 'active' : ''}`} onClick={() => setActiveTab('configuracion')}>⚙️ Configuración</button>
      </div>

      
      {activeTab === 'calendario' && (
        <CalendarioView 
          trips={trips} 
          drivers={drivers} 
          passengers={passengers} 
          places={places} 
          priceRates={priceRates} 
          openModal={openModal} 
          handleDelete={handleDelete}
          settings={settings}
        />
      )}

      {activeTab === 'cuenta_corriente' && (
        <CuentaCorrienteView drivers={drivers} />
      )}

      {activeTab === 'configuracion' && (
        <div>
          <h3>⚙️ Configuración del Sistema</h3>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h4>Configuración del Calendario</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
              Define el rango horario y la vista por defecto (mes, semana, día) del calendario.
            </p>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora de Inicio</label>
                <input 
                  type="time" 
                  className="form-control" 
                  value={settingsForm.calendar_start_time || '00:00'} 
                  onChange={(e) => setSettingsForm({...settingsForm, calendar_start_time: e.target.value})}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Hora de Fin</label>
                <input 
                  type="time" 
                  className="form-control" 
                  value={settingsForm.calendar_end_time || '23:59'} 
                  onChange={(e) => setSettingsForm({...settingsForm, calendar_end_time: e.target.value})}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Vista por Defecto</label>
                <select 
                  className="form-control" 
                  value={settingsForm.calendar_default_view || 'month'} 
                  onChange={(e) => setSettingsForm({...settingsForm, calendar_default_view: e.target.value})}
                >
                  <option value="month">Mes</option>
                  <option value="week">Semana</option>
                  <option value="day">Día</option>
                  <option value="agenda">Agenda</option>
                </select>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4>Ciudad por defecto (Centro del Mapa)</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
              Haz clic en el mapa para establecer el centro por defecto de la ciudad. Todos los mapas de la aplicación se abrirán en esta ubicación.
            </p>
            <LocationPickerMap 
              lat={settingsForm.default_lat} 
              lng={settingsForm.default_lng} 
              defaultLat={-34.6037}
              defaultLng={-58.3816}
              onLocationSelect={(lat, lng) => setSettingsForm({...settingsForm, default_lat: lat, default_lng: lng})} 
            />
            <small style={{ color: '#666', display: 'block', marginBottom: '15px' }}>
              Latitud: {settingsForm.default_lat} | Longitud: {settingsForm.default_lng}
            </small>
            <button className="btn" style={{ width: 'auto' }} onClick={handleSaveSettings}>Guardar Configuración</button>
          </div>
        </div>
      )}

      {activeTab === 'tarifas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Tarifas (Precio por Km)</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('price_rate')}>+ Nueva Tarifa</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre Tarifa</th><th>Precio por Km ($)</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {priceRates.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>No hay tarifas definidas.</td></tr>}
                {priceRates.map(pr => (
                  <tr key={pr.id}>
                    <td data-label="Nombre Tarifa"><strong>{pr.name}</strong></td>
                    <td data-label="Precio por Km ($)">${parseFloat(pr.price_per_km).toFixed(2)}</td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('price_rate', pr)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('price_rate', pr.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'viajes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Historial de Viajes</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Chofer/Vehículo</th><th>Pasajero</th><th>Origen ➔ Destino (Lugares)</th><th>Km</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', padding:'20px'}}>No hay viajes registrados.</td></tr>}
                {trips.map(trip => (
                  <tr key={trip.id}>
                    <td data-label="Fecha">{new Date(trip.created_at).toLocaleDateString()}</td>
                    <td data-label="Chofer/Vehículo"><strong>{trip.driver_name}</strong><br/><small style={{color: 'var(--text-muted)'}}>{trip.vehicle_plate}</small></td>
                    <td data-label="Pasajero">{trip.passenger_name}</td>
                    <td data-label="Origen ➔ Destino">{trip.origin_address} <br/><small style={{color: 'var(--text-muted)'}}>➔ {trip.destination_address}</small></td>
                    <td data-label="Km">{trip.distance_km || '-'}</td>
                    <td data-label="Estado">
                      <span className={`status-badge status-${trip.status}`}>
                        {trip.status === 'in_progress' ? 'En Curso' : 'Completado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rutas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Rutas Predefinidas</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('route')}>+ Nueva Ruta</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre Ruta</th><th>Chofer</th><th>Pasajero</th><th>Origen ➔ Destino</th><th>Distancia</th><th>Tarifa / Costo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {routesData.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:'20px'}}>No hay rutas predefinidas.</td></tr>}
                {routesData.map(r => (
                  <tr key={r.id}>
                    <td data-label="Nombre Ruta"><strong>{r.name}</strong></td>
                    <td data-label="Chofer">{r.driver_name}</td>
                    <td data-label="Pasajero">{r.passenger_name}</td>
                    <td data-label="Origen ➔ Destino">{r.origin_name} ➔ {r.destination_name}</td>
                    <td data-label="Distancia">{r.distance_km ? `${r.distance_km} km` : '-'}</td>
                    <td data-label="Tarifa / Costo">
                      {r.price_rate_name ? (
                        <>
                          <small>{r.price_rate_name}</small><br/>
                          <strong>${(parseFloat(r.distance_km || 0) * parseFloat(r.price_per_km || 0)).toFixed(2)}</strong>
                        </>
                      ) : '-'}
                    </td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('route', r)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('route', r.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'lugares' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Lugares (Puntos de Mapa)</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('place')}>+ Nuevo Lugar</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre del Lugar</th><th>Dirección/Referencia</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {places.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>No hay lugares definidos.</td></tr>}
                {places.map(p => (
                  <tr key={p.id}>
                    <td data-label="Nombre"><strong>{p.name}</strong></td><td data-label="Dirección/Referencia">{p.address}</td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('place', p)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('place', p.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'choferes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Choferes</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('driver')}>+ Nuevo Chofer</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td data-label="Nombre"><strong>{d.name}</strong></td><td data-label="Email">{d.email}</td><td data-label="Teléfono">{d.phone || '-'}</td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('driver', d)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('driver', d.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pasajeros' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Pasajeros</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('passenger')}>+ Nuevo Pasajero</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {passengers.map(p => (
                  <tr key={p.id}>
                    <td data-label="Nombre"><strong>{p.name}</strong></td><td data-label="Teléfono">{p.phone}</td><td data-label="Email">{p.email}</td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('passenger', p)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('passenger', p.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehiculos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Gestión de Vehículos</h3>
            <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openModal('vehicle')}>+ Nuevo Vehículo</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Patente</th><th>Marca/Modelo</th><th>Capacidad</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td data-label="Patente"><strong>{v.plate}</strong></td><td data-label="Marca/Modelo">{v.brand} {v.model}</td><td data-label="Capacidad">{v.capacity} pax</td>
                    <td data-label="Acciones">
                      <button className="action-btn" onClick={() => openModal('vehicle', v)}>✏️</button>
                      <button className="action-btn" onClick={() => handleDelete('vehicle', v.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL ABM --- */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingItem ? '✏️ Editar' : '➕ Nuevo'} {modalType === 'trip' ? 'Viaje' : modalType === 'driver' ? 'Chofer' : modalType === 'passenger' ? 'Pasajero' : modalType === 'vehicle' ? 'Vehículo' : 'Lugar'}</h3>
            
            {modalType === 'place' && (
              <>
                <div className="form-group">
                  <label>Nombre del Lugar (Ej: Planta Norte)</label>
                  <input type="text" className="form-control" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Referencia o Dirección (Opcional)</label>
                  <input type="text" className="form-control" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Haz clic en el mapa para ubicar el lugar exacto:</label>
                  <LocationPickerMap 
                    lat={formData.lat} 
                    lng={formData.lng} 
                    defaultLat={settings?.default_lat}
                    defaultLng={settings?.default_lng}
                    onLocationSelect={(lat, lng) => setFormData({...formData, lat, lng})} 
                  />
                </div>
              </>
            )}

            
            {modalType === 'trip' && (
              <>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Fecha y Hora</label>
                    <input type="datetime-local" className="form-control" 
                           value={formData.scheduled_time ? new Date(new Date(formData.scheduled_time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} 
                           onChange={e => setFormData({...formData, scheduled_time: new Date(e.target.value).toISOString()})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Estado</label>
                    <select className="form-control" value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="scheduled">Programado</option>
                      <option value="in_progress">En Curso</option>
                      <option value="completed">Completado</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Chofer Asignado</label>
                    <select className="form-control" value={formData.driver_id || ''} onChange={e => setFormData({...formData, driver_id: e.target.value})}>
                      <option value="">Selecciona Chofer...</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Pasajero Asignado</label>
                    <select className="form-control" value={formData.passenger_id || ''} onChange={e => setFormData({...formData, passenger_id: e.target.value})}>
                      <option value="">Selecciona Pasajero...</option>
                      {passengers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Origen</label>
                    <select className="form-control" value={formData.origin_place_id || ''} onChange={e => setFormData({...formData, origin_place_id: e.target.value})}>
                      <option value="">Selecciona Origen...</option>
                      {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Destino</label>
                    <select className="form-control" value={formData.destination_place_id || ''} onChange={e => setFormData({...formData, destination_place_id: e.target.value})}>
                      <option value="">Selecciona Destino...</option>
                      {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Distancia (Km)</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="number" step="0.01" className="form-control" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: e.target.value})} />
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 10px', fontSize: '12px', width: 'auto' }} onClick={() => {
                        const origin = places.find(p => p.id === formData.origin_place_id);
                        const dest = places.find(p => p.id === formData.destination_place_id);
                        if (origin?.lat && dest?.lat) {
                          const dist = calculateDistance(Number(origin.lat), Number(origin.lng), Number(dest.lat), Number(dest.lng));
                          setFormData({...formData, distance_km: dist});
                        } else {
                          showToast('Selecciona origen y destino con ubicaciones válidas primero.', 'error');
                        }
                      }}>Calc</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Tarifa</label>
                    <select className="form-control" value={formData.price_rate_id || ''} onChange={e => setFormData({...formData, price_rate_id: e.target.value})}>
                      <option value="">Selecciona Tarifa...</option>
                      {priceRates.map(pr => <option key={pr.id} value={pr.id}>{pr.name} (${parseFloat(pr.price_per_km).toFixed(2)}/km)</option>)}
                    </select>
                  </div>
                </div>
                {formData.distance_km && formData.price_rate_id && (
                  <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '4px', textAlign: 'right', fontSize: '16px', color: '#111827' }}>
                    Costo Estimado: <strong>${(parseFloat(formData.distance_km) * parseFloat(priceRates.find(pr => pr.id === formData.price_rate_id)?.price_per_km || 0)).toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}

            {modalType === 'price_rate' && (
              <>
                <div className="form-group">
                  <label>Nombre de Tarifa (Ej: Tarifa Feriado)</label>
                  <input type="text" className="form-control" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Precio por Km ($)</label>
                  <input type="number" step="0.01" className="form-control" value={formData.price_per_km || ''} onChange={e => setFormData({...formData, price_per_km: e.target.value})} />
                </div>
              </>
            )}

            {modalType === 'route' && (
              <>
                <div className="form-group">
                  <label>Nombre de la Ruta (Ej: Diaria Planta a Centro)</label>
                  <input type="text" className="form-control" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Chofer Asignado</label>
                    <select className="form-control" value={formData.driver_id || ''} onChange={e => setFormData({...formData, driver_id: e.target.value})}>
                      <option value="">Selecciona Chofer...</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Pasajero Asignado</label>
                    <select className="form-control" value={formData.passenger_id || ''} onChange={e => setFormData({...formData, passenger_id: e.target.value})}>
                      <option value="">Selecciona Pasajero...</option>
                      {passengers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Origen (Lugar)</label>
                    <select className="form-control" value={formData.origin_place_id || ''} onChange={e => setFormData({...formData, origin_place_id: e.target.value})}>
                      <option value="">Selecciona Origen...</option>
                      {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Destino (Lugar)</label>
                    <select className="form-control" value={formData.destination_place_id || ''} onChange={e => setFormData({...formData, destination_place_id: e.target.value})}>
                      <option value="">Selecciona Destino...</option>
                      {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Distancia (Km)</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="number" step="0.01" className="form-control" value={formData.distance_km || ''} onChange={e => setFormData({...formData, distance_km: e.target.value})} />
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 10px', fontSize: '12px', width: 'auto' }} onClick={() => {
                        const origin = places.find(p => p.id === formData.origin_place_id);
                        const dest = places.find(p => p.id === formData.destination_place_id);
                        if (origin?.lat && dest?.lat) {
                          const dist = calculateDistance(Number(origin.lat), Number(origin.lng), Number(dest.lat), Number(dest.lng));
                          setFormData({...formData, distance_km: dist});
                        } else {
                          showToast('Selecciona origen y destino con ubicaciones válidas primero.', 'success');
                        }
                      }}>Calcular Auto</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Tarifa</label>
                    <select className="form-control" value={formData.price_rate_id || ''} onChange={e => setFormData({...formData, price_rate_id: e.target.value})}>
                      <option value="">Selecciona Tarifa...</option>
                      {priceRates.map(pr => <option key={pr.id} value={pr.id}>{pr.name} (${parseFloat(pr.price_per_km).toFixed(2)}/km)</option>)}
                    </select>
                  </div>
                </div>
                {formData.distance_km && formData.price_rate_id && (
                  <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '4px', textAlign: 'right', fontSize: '16px', color: '#111827' }}>
                    Costo Estimado: <strong>${(parseFloat(formData.distance_km) * parseFloat(priceRates.find(pr => pr.id === formData.price_rate_id)?.price_per_km || 0)).toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}

            {modalType === 'driver' && (
              <>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" className="form-control" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" className="form-control" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                {!editingItem && (
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input type="password" className="form-control" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                )}
              </>
            )}

            {modalType === 'passenger' && (
              <>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" className="form-control" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" className="form-control" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </>
            )}

            {modalType === 'vehicle' && (
              <>
                <div className="form-group">
                  <label>Patente / Matrícula</label>
                  <input type="text" className="form-control" value={formData.plate || ''} onChange={e => setFormData({...formData, plate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input type="text" className="form-control" placeholder="Ej: Toyota" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input type="text" className="form-control" placeholder="Ej: Corolla" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Capacidad (Pasajeros)</label>
                  <input type="number" className="form-control" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
