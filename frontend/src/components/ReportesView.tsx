import React, { useState } from 'react';
import { parseISO, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface Trip {
  id: string;
  driver_id: string;
  driver_name: string;
  distance_km: number | string;
  total_price: number | string;
  status: string;
  created_at: string;
  scheduled_time?: string;
  ended_at?: string;
}

interface Driver {
  id: string;
  name: string;
}

interface ReportesViewProps {
  trips: Trip[];
  drivers: Driver[];
}

export function ReportesView({ trips, drivers }: ReportesViewProps) {
  // Por defecto, inicializamos en el día de hoy
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const getTripDate = (t: Trip) => t.ended_at ? parseISO(t.ended_at) : parseISO(t.created_at);
  const completedTrips = trips.filter(t => t.status === 'completed');

  // Filtrar por rango
  const filteredTrips = completedTrips.filter(t => {
    if (!startDate || !endDate) return true;
    const d = getTripDate(t);
    // Parseamos start y end a la fecha local
    const s = startOfDay(parseISO(startDate));
    const e = endOfDay(parseISO(endDate));
    return isWithinInterval(d, { start: s, end: e });
  });

  const aggregate = (tripList: Trip[]) => {
    let totalTrips = tripList.length;
    let totalKm = 0;
    let totalPayout = 0;
    const byDriver: Record<string, { name: string; trips: number; payout: number }> = {};

    tripList.forEach(t => {
      const dist = parseFloat(t.distance_km as string) || 0;
      const price = parseFloat(t.total_price as string) || 0;
      totalKm += dist;
      totalPayout += price;

      if (t.driver_id) {
        if (!byDriver[t.driver_id]) {
          byDriver[t.driver_id] = { name: t.driver_name || 'Desconocido', trips: 0, payout: 0 };
        }
        byDriver[t.driver_id].trips += 1;
        byDriver[t.driver_id].payout += price;
      }
    });

    return { totalTrips, totalKm, totalPayout, byDriver: Object.values(byDriver).sort((a,b) => b.payout - a.payout) };
  };

  const reportData = aggregate(filteredTrips);

  const renderCard = (title: string, value: string, icon: string) => (
    <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', minWidth: '150px' }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{value}</div>
    </div>
  );

  const renderDriverTable = (driversData: any[]) => (
    <table style={{ marginTop: '15px' }}>
      <thead>
        <tr>
          <th>Chofer</th>
          <th style={{ textAlign: 'center' }}>Viajes</th>
          <th style={{ textAlign: 'right' }}>A Pagar</th>
        </tr>
      </thead>
      <tbody>
        {driversData.length === 0 ? (
          <tr><td colSpan={3} style={{ textAlign: 'center', padding: '15px' }}>Sin viajes en este rango</td></tr>
        ) : (
          driversData.map((d, i) => (
            <tr key={i}>
              <td data-label="Chofer"><strong>{d.name}</strong></td>
              <td data-label="Viajes" style={{ textAlign: 'center' }}>{d.trips}</td>
              <td data-label="A Pagar" style={{ textAlign: 'right', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                ${d.payout.toFixed(2)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="card">
        <h3 style={{ borderBottom: '2px solid #eef2ff', paddingBottom: '10px', marginBottom: '20px' }}>📊 Reporte Dinámico</h3>
        
        {/* Controles de Rango de Fechas */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label>Desde</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label>Hasta</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
             <button className="btn" onClick={() => {
                setStartDate(format(new Date(), 'yyyy-MM-dd'));
                setEndDate(format(new Date(), 'yyyy-MM-dd'));
             }}>Limpiar (Hoy)</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {renderCard('Viajes Completados', reportData.totalTrips.toString(), '🚗')}
          {renderCard('Km Recorridos', reportData.totalKm.toFixed(1) + ' km', '📍')}
          {renderCard('Total a Pagar', '$' + reportData.totalPayout.toFixed(2), '💰')}
        </div>
        
        <h4>Desglose por Chofer</h4>
        <div className="table-container">
          {renderDriverTable(reportData.byDriver)}
        </div>
      </div>
    </div>
  );
}
