import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

function MapBounds({ routeCoords }: { routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords, map]);
  return null;
}

export function DriverView({ currentDriverId }: { currentDriverId?: string }) {
  const [originPlaceId, setOriginPlaceId] = useState('');
  const [destinationPlaceId, setDestinationPlaceId] = useState('');
  
  const [passenger, setPassenger] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState(currentDriverId || '');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  
  const [calculatedKm, setCalculatedKm] = useState<string>('');
  const [routeLine, setRouteLine] = useState<[number, number][]>([]); 
  
  const [status, setStatus] = useState('idle');
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ default_lat: -34.6037, default_lng: -58.3816 });

  useEffect(() => {
    fetchData();
  }, []);

  const selectedOrigin = places.find(p => p.id === originPlaceId);
  const selectedDest = places.find(p => p.id === destinationPlaceId);

  useEffect(() => {
    if (selectedOrigin && selectedDest) {
      calculateDistanceAndRoute(selectedOrigin, selectedDest);
    } else {
      setCalculatedKm('');
      setRouteLine([]);
    }
  }, [selectedOrigin, selectedDest]);

  const fetchData = async () => {
    try {
      const [driversRes, vehiclesRes, passengersRes, placesRes, settingsRes, routesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/drivers`),
        axios.get(`${API_URL}/admin/vehicles`),
        axios.get(`${API_URL}/admin/passengers`),
        axios.get(`${API_URL}/admin/places`),
        axios.get(`${API_URL}/admin/settings`),
        axios.get(`${API_URL}/admin/routes`)
      ]);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setPassengers(passengersRes.data);
      setPlaces(placesRes.data);
      setSettings(settingsRes.data);
      setRoutes(routesRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleRouteSelect = (e: any) => {
    const rId = e.target.value;
    setSelectedRouteId(rId);
    if (!rId) return;
    const r = routes.find(x => x.id === rId);
    if (r) {
      setDriver(r.driver_id || '');
      setPassenger(r.passenger_id || '');
      setOriginPlaceId(r.origin_place_id || '');
      setDestinationPlaceId(r.destination_place_id || '');
    }
  };

  const calculateDistanceAndRoute = async (orig: any, dest: any) => {
    try {
      const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
      if (res.data && res.data.routes && res.data.routes.length > 0) {
        const route = res.data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(2);
        setCalculatedKm(distanceKm);
        const coordinates = route.geometry.coordinates;
        const latLonCoords: [number, number][] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        setRouteLine(latLonCoords);
      }
    } catch (error) {
      console.error('OSRM Route Error', error);
      alert('No se pudo calcular la ruta. Verifica que los puntos estén en tierra y conectados por calles.');
    }
  };

  const handleStartTrip = async () => {
    if (!originPlaceId || !destinationPlaceId || !passenger || !vehicle || !driver) {
      return alert('Por favor, completa todos los campos.');
    }
    if (originPlaceId === destinationPlaceId) {
      return alert('El origen y destino no pueden ser el mismo lugar.');
    }
    
    try {
      const res = await axios.post(`${API_URL}/trips`, {
        driver_id: driver,
        vehicle_id: vehicle,
        passenger_id: passenger,
        origin_place_id: originPlaceId,
        destination_place_id: destinationPlaceId,
        distance_km: parseFloat(calculatedKm)
      });
      setCurrentTripId(res.data.id);
      setStatus('in_progress');
    } catch (error) {
      console.error('Error starting trip', error);
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
      setOriginPlaceId('');
      setDestinationPlaceId('');
      setPassenger('');
      setVehicle('');
      setDriver('');
      setCalculatedKm('');
      setRouteLine([]);
      setCurrentTripId(null);
      alert('Viaje finalizado exitosamente.');
    } catch (error) {
      console.error('Error finishing trip', error);
      alert('Error al finalizar el viaje');
    }
  };

  return (
    <div className="card">
      <h2>🚗 Registrar Viaje</h2>
      {status === 'idle' ? (
        <>
          <div style={{ padding: '16px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>🗺️ Rutas Predefinidas Rápidas</h4>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Selecciona tu Ruta Asignada (Autocompleta todos los datos)</label>
              <select className="form-control" value={selectedRouteId} onChange={handleRouteSelect}>
                <option value="">Selecciona una ruta...</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name} (Chofer: {r.driver_name})</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Chofer Actual</label>
            <select className="form-control" value={driver} onChange={(e) => setDriver(e.target.value)}>
              <option value="">Selecciona tu nombre...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Vehículo a utilizar</label>
            <select className="form-control" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">Selecciona un vehículo...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.model})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Pasajero</label>
            <select className="form-control" value={passenger} onChange={(e) => setPassenger(e.target.value)}>
              <option value="">Selecciona un pasajero...</option>
              {passengers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>📍 Selección de Ruta</h4>
            
            <div className="form-group">
              <label>Lugar de Origen</label>
              <select className="form-control" value={originPlaceId} onChange={(e) => setOriginPlaceId(e.target.value)}>
                <option value="">Selecciona un lugar oficial...</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Lugar de Destino</label>
              <select className="form-control" value={destinationPlaceId} onChange={(e) => setDestinationPlaceId(e.target.value)}>
                <option value="">Selecciona un lugar oficial...</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            {calculatedKm && (
              <div style={{ marginTop: '10px', color: '#059669', fontWeight: 'bold' }}>
                📏 Distancia Calculada: {calculatedKm} Km
              </div>
            )}
          </div>

          {/* MAP DISPLAY */}
          {(selectedOrigin || selectedDest) && (
            <div style={{ height: '300px', width: '100%', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
              <MapContainer 
                center={selectedOrigin ? [selectedOrigin.lat, selectedOrigin.lng] : selectedDest ? [selectedDest.lat, selectedDest.lng] : [settings?.default_lat || -34.6037, settings?.default_lng || -58.3816]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {selectedOrigin && (
                  <Marker position={[selectedOrigin.lat, selectedOrigin.lng]}>
                    <Popup>Origen: {selectedOrigin.name}</Popup>
                  </Marker>
                )}
                
                {selectedDest && (
                  <Marker position={[selectedDest.lat, selectedDest.lng]}>
                    <Popup>Destino: {selectedDest.name}</Popup>
                  </Marker>
                )}

                {routeLine.length > 0 && (
                  <>
                    <Polyline positions={routeLine} color="blue" weight={5} opacity={0.6} />
                    <MapBounds routeCoords={routeLine} />
                  </>
                )}
              </MapContainer>
            </div>
          )}

          <button className="btn" onClick={handleStartTrip}>
            ▶ Iniciar Viaje
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#28a745' }}>Viaje en Curso</h3>
          <p><strong>Desde:</strong> {selectedOrigin?.name}</p>
          <p><strong>Hacia:</strong> {selectedDest?.name}</p>
          <div className="form-group" style={{ marginTop: '20px', textAlign: 'left' }}>
            <label>Kilómetros recorridos (Auto-calculados, puedes modificarlos)</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Ej: 15.5" 
              value={calculatedKm}
              onChange={(e) => setCalculatedKm(e.target.value)}
            />
          </div>
          <br/>
          <button className="btn btn-danger" onClick={handleFinishTrip}>
            ⏹ Finalizar Viaje
          </button>
        </div>
      )}
    </div>
  );
}
