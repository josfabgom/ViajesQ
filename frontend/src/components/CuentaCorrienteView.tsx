import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function CuentaCorrienteView() {
  const [balances, setBalances] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  
  const [pendingTrips, setPendingTrips] = useState<any[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, []);

  // Update paymentAmount default when selected trips change
  useEffect(() => {
    if (selectedDriver) {
      const sum = pendingTrips
        .filter(t => selectedTripIds.includes(t.id))
        .reduce((acc, t) => acc + (parseFloat(t.total_price || 0) - parseFloat(t.paid_amount || 0)), 0);
      
      if (sum > 0) {
        setPaymentAmount(sum.toFixed(2));
      } else {
        setPaymentAmount('');
      }
    }
  }, [selectedTripIds, pendingTrips]);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/payments/balances`);
      setBalances(res.data);
    } catch (error) {
      console.error('Error fetching balances', error);
    } finally {
      setLoading(false);
    }
  };

  const openDriverDetail = async (driver: any) => {
    setSelectedDriver(driver);
    setPeriodStart('');
    setPeriodEnd('');
    setObservations('');
    setPaymentMethod('efectivo');
    setSelectedTripIds([]);
    
    try {
      const [pendingRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/admin/payments/pending/${driver.driver_id}`),
        axios.get(`${API_URL}/admin/payments/history/${driver.driver_id}`)
      ]);
      setPendingTrips(pendingRes.data);
      setPaymentHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching details', error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTripIds(pendingTrips.map(t => t.id));
    } else {
      setSelectedTripIds([]);
    }
  };

  const handleSelectTrip = (id: string) => {
    setSelectedTripIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handlePay = async () => {
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Ingresa un monto válido mayor a 0.');
      return;
    }
    
    const confirmMsg = selectedTripIds.length > 0 
      ? `¿Confirmas el pago parcial/total de $${amountNum} distribuidos en ${selectedTripIds.length} viaje(s)?`
      : `¿Confirmas el pago a cuenta de $${amountNum} (sin viajes específicos)?`;
      
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/payments`, {
        driver_id: selectedDriver.driver_id,
        amount: amountNum,
        payment_method: paymentMethod,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        trip_ids: selectedTripIds,
        observations: observations || null
      });
      alert('Pago registrado con éxito.');
      await fetchBalances(); // reload balances
      setSelectedDriver(null); // return to grid
    } catch (error) {
      console.error('Error recording payment', error);
      alert('Hubo un error al registrar el pago.');
    }
  };

  if (loading && balances.length === 0) {
    return <p>Cargando cuentas corrientes...</p>;
  }

  // --- DETAIL VIEW ---
  if (selectedDriver) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => setSelectedDriver(null)} style={{ marginBottom: '20px' }}>
          &larr; Volver a Tarjetas
        </button>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Columna Izquierda: Formulario y Viajes */}
          <div style={{ flex: 3, minWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>{selectedDriver.name} - Liquidación</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Total Generado en Sistema:</span>
                <strong>${selectedDriver.total_earned.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Total Pagado Histórico:</span>
                <strong>${selectedDriver.total_paid.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #93c5fd', fontSize: '18px' }}>
                <span>Saldo Actual:</span>
                <strong>${selectedDriver.balance.toFixed(2)}</strong>
              </div>
            </div>

            <h4>Selecciona los viajes a pagar:</h4>
            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '10px' }}>
                      <input type="checkbox" onChange={handleSelectAll} checked={selectedTripIds.length === pendingTrips.length && pendingTrips.length > 0} />
                    </th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Ruta</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Costo Viaje</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>Resta Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrips.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No hay viajes pendientes</td>
                    </tr>
                  ) : (
                    pendingTrips.map(trip => {
                      const cost = parseFloat(trip.total_price || 0);
                      const paid = parseFloat(trip.paid_amount || 0);
                      const remains = cost - paid;
                      
                      return (
                        <tr key={trip.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: paid > 0 ? '#fffbeb' : 'white' }}>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedTripIds.includes(trip.id)}
                              onChange={() => handleSelectTrip(trip.id)}
                            />
                          </td>
                          <td style={{ padding: '10px' }}>{new Date(trip.ended_at || trip.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '10px' }}>{trip.origin_address} ➔ {trip.destination_address}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>${cost.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                            ${remains.toFixed(2)}
                            {paid > 0 && <span style={{display: 'block', fontSize: '11px', color: '#d97706'}}>Pagado parcial: ${paid.toFixed(2)}</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div className="form-group">
                <label>Monto a Pagar ($)</label>
                <input type="number" step="0.01" className="form-control" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                <small style={{ color: '#6b7280' }}>Si ingresas un monto menor al total de los viajes, el pago se distribuirá de forma parcial a partir del viaje más antiguo.</small>
              </div>
              
              <div className="form-group">
                <label>Medio de Pago</label>
                <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Período Desde (Opcional)</label>
                  <input type="date" className="form-control" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Período Hasta (Opcional)</label>
                  <input type="date" className="form-control" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Observaciones (Opcional)</label>
                <input type="text" className="form-control" placeholder="Ej: Adelanto para combustible, viáticos..." value={observations} onChange={e => setObservations(e.target.value)} />
              </div>

              <button className="btn" style={{ width: '100%', marginTop: '10px' }} onClick={handlePay}>Registrar Movimiento de Pago</button>
            </div>
          </div>

          {/* Columna Derecha: Historial de Pagos */}
          <div style={{ flex: 2, minWidth: '300px' }}>
            <h3 style={{ marginTop: 0 }}>Historial de Movimientos</h3>
            <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Fecha Registro</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Detalle</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Monto Entregado</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>Sin historial de pagos</td>
                    </tr>
                  ) : (
                    paymentHistory.map(payment => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px' }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                          <span style={{display: 'block', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize'}}>{payment.payment_method}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {(payment.period_start || payment.period_end) && (
                            <div style={{ fontSize: '12px', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: payment.observations ? '4px' : '0' }}>
                              {payment.period_start ? new Date(payment.period_start).toLocaleDateString() : '...'} al {payment.period_end ? new Date(payment.period_end).toLocaleDateString() : '...'}
                            </div>
                          )}
                          {payment.observations && (
                            <div style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
                              "{payment.observations}"
                            </div>
                          )}
                          {!payment.period_start && !payment.period_end && !payment.observations && '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                          ${parseFloat(payment.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- GRID VIEW ---
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>💳 Cuentas Corrientes</h3>
        <button className="btn btn-secondary" onClick={fetchBalances}>🔄 Actualizar</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {balances.map(driver => (
          <div key={driver.driver_id} style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '20px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                {driver.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>{driver.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{driver.email}</p>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', marginBottom: '5px' }}>
                <span>Viajes (Generado)</span>
                <span>${driver.total_earned.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', marginBottom: '10px' }}>
                <span>Adelantos / Pagos</span>
                <span>${driver.total_paid.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Saldo Pendiente</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: driver.balance > 0 ? '#dc2626' : (driver.balance < 0 ? '#059669' : '#111827') }}>
                  ${driver.balance.toFixed(2)}
                </span>
              </div>
            </div>
            
            <button className="btn" onClick={() => openDriverDetail(driver)}>
              Ver Cuenta / Pagar
            </button>
          </div>
        ))}
        {balances.length === 0 && !loading && (
          <p>No hay choferes registrados.</p>
        )}
      </div>
    </div>
  );
}
