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
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState<any[]>([]);

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    if (receiptPaymentId) {
      axios.get(`${API_URL}/admin/payments/${receiptPaymentId}/receipt`)
        .then(res => setReceiptData(res.data))
        .catch(err => console.error('Error fetching receipt', err));
    } else {
      setReceiptData(null);
    }
  }, [receiptPaymentId]);

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
      const resp = await axios.post(`${API_URL}/admin/payments`, {
        driver_id: selectedDriver.driver_id,
        amount: amountNum,
        payment_method: paymentMethod,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        trip_ids: selectedTripIds,
        observations: observations || null
      });
      alert('Pago registrado con éxito.');
      setReceiptPaymentId(resp.data.id);
      await fetchBalances(); // reload balances
    } catch (error) {
      console.error('Error recording payment', error);
      alert('Hubo un error al registrar el pago.');
    }
  };

  if (loading && balances.length === 0) {
    return <p>Cargando cuentas corrientes...</p>;
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('⚠️ ATENCIÓN ⚠️\n¿Estás seguro de que deseas ELIMINAR completamente este pago del sistema?\nEsta acción restaurará la deuda de los viajes y borrará todo registro. No se puede deshacer.')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/admin/payments/${paymentId}`);
      alert('Pago eliminado con éxito.');
      await fetchBalances();
      if (selectedDriver) fetchDriverDetails(selectedDriver.driver_id);
      if (showLedger) fetchLedger();
    } catch (error: any) {
      console.error('Error deleting payment', error);
      alert(error.response?.data?.error || 'Hubo un error al eliminar el pago.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('⚠️ ATENCIÓN ⚠️\n¿Estás seguro de ELIMINAR este viaje pendiente? Desaparecerá del sistema por completo.')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/trips/${tripId}`);
      alert('Viaje eliminado con éxito.');
      await fetchBalances();
      if (selectedDriver) fetchDriverDetails(selectedDriver.driver_id);
    } catch (error: any) {
      console.error('Error deleting trip', error);
      alert(error.response?.data?.error || 'Hubo un error al eliminar el viaje.');
    }
  };

  const handleAnnul = async (paymentId: string) => {
    if (!window.confirm('¿Está seguro de que desea anular este pago? Esta acción restaurará la deuda de los viajes pagados y quedará registrada en auditoría.')) {
      return;
    }
    try {
      await axios.post(`${API_URL}/admin/payments/${paymentId}/annul`);
      alert('Pago anulado con éxito.');
      await fetchBalances();
      if (selectedDriver) {
        fetchDriverDetails(selectedDriver.driver_id);
      }
      if (showLedger) {
        fetchLedger();
      }
    } catch (error: any) {
      console.error('Error annulling payment', error);
      alert(error.response?.data?.error || 'Hubo un error al anular el pago.');
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/payments/ledger`);
      setLedgerData(res.data);
    } catch (error) {
      console.error('Error fetching ledger', error);
    }
  };

  // --- DETAIL VIEW ---
  if (selectedDriver) {
    return (
      <div>
        {receiptData && (
          <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div id="receipt-print-area" style={{ fontFamily: 'monospace', color: '#000' }}>
                <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>VIAJES Q - RECIBO DE PAGO</h2>
                <div style={{ borderBottom: '1px dashed #ccc', marginBottom: '15px', paddingBottom: '10px' }}>
                  <p><strong>Fecha:</strong> {new Date(receiptData.created_at).toLocaleString()}</p>
                  <p><strong>Chofer:</strong> {receiptData.driver_name}</p>
                  <p><strong>Medio de Pago:</strong> <span style={{ textTransform: 'capitalize' }}>{receiptData.payment_method}</span></p>
                  {receiptData.period_start && receiptData.period_end && <p><strong>Período:</strong> {new Date(receiptData.period_start).toLocaleDateString()} al {new Date(receiptData.period_end).toLocaleDateString()}</p>}
                  {receiptData.observations && <p><strong>Observaciones:</strong> {receiptData.observations}</p>}
                </div>
                
                <h4 style={{ margin: '0 0 10px 0' }}>Detalle de Viajes Pagados</h4>
                {receiptData.trips && receiptData.trips.length > 0 ? (
                  <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '5px 0' }}>Fecha</th>
                        <th>Ruta</th>
                        <th style={{ textAlign: 'right' }}>Monto Asignado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.trips.map((t: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '5px 0' }}>{new Date(t.ended_at || t.created_at).toLocaleDateString()}</td>
                          <td>{t.origin_address} ➔ {t.destination_address}</td>
                          <td style={{ textAlign: 'right' }}>${parseFloat(t.amount_allocated).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Pago a cuenta general (sin viajes específicos asociados).</p>
                )}
                
                <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>TOTAL PAGADO:</span>
                  <span>${parseFloat(receiptData.amount).toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px' }}>
                  <p>Firma y Aclaración</p>
                  <p>___________________________________</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }} className="no-print">
                <button className="btn btn-secondary" onClick={() => { setReceiptPaymentId(null); setSelectedDriver(null); }}>Cerrar y Volver</button>
                <button className="btn" onClick={() => {
                   const printContents = document.getElementById('receipt-print-area')?.innerHTML;
                   const originalContents = document.body.innerHTML;
                   if (printContents) {
                     document.body.innerHTML = printContents;
                     window.print();
                     document.body.innerHTML = originalContents;
                     window.location.reload(); // Quickest way to restore React bindings after brutal innerHTML swap
                   }
                }}>🖨️ Imprimir Recibo</button>
              </div>
            </div>
          </div>
        )}

        <button className="btn btn-secondary" onClick={() => setSelectedDriver(null)} style={{ marginBottom: '20px' }}>
          &larr; Volver a Tarjetas
        </button>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* Columna Izquierda: Formulario y Viajes */}
          <div style={{ flex: 3, minWidth: 'min(100%, 400px)' }}>
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
                    <th style={{ padding: '10px', textAlign: 'left' }}>Fecha / Horario</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Ruta</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Costo Viaje</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#dc2626' }}>Resta Pagar</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay viajes pendientes</td>
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
                          <td style={{ padding: '10px' }}>
                            {new Date(trip.ended_at || trip.created_at).toLocaleDateString()}
                            <br />
                            <small style={{ color: '#6b7280' }}>
                              {trip.started_at ? new Date(trip.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (trip.scheduled_time ? new Date(trip.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...')}
                              {' - '}
                              {trip.ended_at ? new Date(trip.ended_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                            </small>
                          </td>
                          <td style={{ padding: '10px' }}>{trip.origin_address} ➔ {trip.destination_address}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>${cost.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                            ${remains.toFixed(2)}
                            {paid > 0 && <span style={{display: 'block', fontSize: '11px', color: '#d97706'}}>Pagado parcial: ${paid.toFixed(2)}</span>}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDeleteTrip(trip.id)} title="Eliminar viaje si no se realizó">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#ecfdf5', padding: '25px', borderRadius: '12px', border: '2px solid #10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#047857', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💰 Registrar Nuevo Pago
              </h3>
              
              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#065f46', fontSize: '15px' }}>Monto a Pagar ($)</label>
                <input type="number" step="0.01" className="form-control" style={{ fontSize: '24px', fontWeight: 'bold', padding: '15px', color: '#065f46', border: '2px solid #34d399', backgroundColor: '#ffffff' }} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
                <small style={{ color: '#047857', marginTop: '8px', display: 'block', fontSize: '12px' }}>💡 Si ingresas un monto menor al total, el pago se distribuirá de forma parcial a partir del viaje más antiguo.</small>
              </div>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ fontWeight: 'bold', color: '#065f46' }}>Medio de Pago</label>
                <select className="form-control" style={{ border: '1px solid #6ee7b7', padding: '10px', backgroundColor: '#ffffff' }} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia Bancaria</option>
                  <option value="cheque">📄 Cheque</option>
                  <option value="otro">🔄 Otro</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ fontWeight: 'bold', color: '#065f46' }}>Observaciones (Opcional)</label>
                <input type="text" className="form-control" style={{ border: '1px solid #6ee7b7', padding: '10px', backgroundColor: '#ffffff' }} placeholder="Ej: Adelanto para combustible, viáticos..." value={observations} onChange={e => setObservations(e.target.value)} />
              </div>

              <button className="btn" style={{ width: '100%', marginTop: '25px', backgroundColor: '#059669', color: 'white', fontSize: '16px', fontWeight: 'bold', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.3)' }} onClick={handlePay}>
                ✨ Acreditar Pago
              </button>
            </div>
          </div>

          {/* Columna Derecha: Historial de Pagos */}
          <div style={{ flex: 2, minWidth: 'min(100%, 300px)' }}>
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
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: payment.status === 'annulled' ? '#9ca3af' : '#059669', textDecoration: payment.status === 'annulled' ? 'line-through' : 'none' }}>
                          ${parseFloat(payment.amount).toFixed(2)}
                          <br />
                          {payment.status === 'annulled' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', marginTop: '5px' }}>
                              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>ANULADO</span>
                              <button className="btn" style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDeletePayment(payment.id)}>
                                🗑️ Eliminar
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', marginTop: '5px', flexWrap: 'wrap' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => setReceiptPaymentId(payment.id)}
                              >
                                📄 Recibo
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                onClick={() => handleAnnul(payment.id)}
                              >
                                🚫 Anular
                              </button>
                              <button 
                                className="btn" 
                                style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                onClick={() => handleDeletePayment(payment.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
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

  // --- LEDGER VIEW ---
  if (showLedger) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>📖 Libro de Movimientos (Auditoría)</h3>
          <button className="btn btn-secondary" onClick={() => setShowLedger(false)}>&larr; Volver a Tarjetas</button>
        </div>
        <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Chofer</th>
                <th style={{ padding: '12px' }}>Monto</th>
                <th style={{ padding: '12px' }}>Estado</th>
                <th style={{ padding: '12px' }}>Auditoría</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: entry.status === 'annulled' ? '#fff1f2' : 'white' }}>
                  <td style={{ padding: '12px' }}>{new Date(entry.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.driver_name}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: entry.status === 'annulled' ? '#9ca3af' : '#059669', textDecoration: entry.status === 'annulled' ? 'line-through' : 'none' }}>
                    ${parseFloat(entry.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {entry.status === 'annulled' ? (
                       <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>ANULADO</span>
                    ) : (
                       <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>ACTIVO</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#4b5563' }}>
                    {entry.status === 'annulled' ? `Anulado por: ${entry.annulled_by_name || 'Admin'} el ${new Date(entry.annulled_at).toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setReceiptPaymentId(entry.id)}>📄 Recibo</button>
                      {entry.status === 'active' && (
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleAnnul(entry.id)}>🚫 Anular</button>
                      )}
                      <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDeletePayment(entry.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {ledgerData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay movimientos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {receiptData && (
          // Use the exact same receipt modal
          <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div id="receipt-print-area" style={{ fontFamily: 'monospace', color: '#000' }}>
                <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>VIAJES Q - RECIBO DE PAGO</h2>
                {receiptData.status === 'annulled' && (
                   <h3 style={{ textAlign: 'center', margin: '0 0 10px 0', color: 'red', border: '2px dashed red', padding: '5px' }}>*** DOCUMENTO ANULADO ***</h3>
                )}
                <div style={{ borderBottom: '1px dashed #ccc', marginBottom: '15px', paddingBottom: '10px' }}>
                  <p><strong>Fecha:</strong> {new Date(receiptData.created_at).toLocaleString()}</p>
                  <p><strong>Chofer:</strong> {receiptData.driver_name}</p>
                  <p><strong>Medio de Pago:</strong> <span style={{ textTransform: 'capitalize' }}>{receiptData.payment_method}</span></p>
                  {receiptData.period_start && receiptData.period_end && <p><strong>Período:</strong> {new Date(receiptData.period_start).toLocaleDateString()} al {new Date(receiptData.period_end).toLocaleDateString()}</p>}
                  {receiptData.observations && <p><strong>Observaciones:</strong> {receiptData.observations}</p>}
                </div>
                
                <h4 style={{ margin: '0 0 10px 0' }}>Detalle de Viajes Pagados</h4>
                {receiptData.trips && receiptData.trips.length > 0 ? (
                  <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '5px 0' }}>Fecha</th>
                        <th>Ruta</th>
                        <th style={{ textAlign: 'right' }}>Monto Asignado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.trips.map((t: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '5px 0' }}>{new Date(t.ended_at || t.created_at).toLocaleDateString()}</td>
                          <td>{t.origin_address} ➔ {t.destination_address}</td>
                          <td style={{ textAlign: 'right' }}>${parseFloat(t.amount_allocated).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Pago a cuenta general (sin viajes específicos asociados).</p>
                )}
                
                <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>TOTAL PAGADO:</span>
                  <span>${parseFloat(receiptData.amount).toFixed(2)}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }} className="no-print">
                <button className="btn btn-secondary" onClick={() => setReceiptPaymentId(null)}>Cerrar</button>
                <button className="btn" onClick={() => {
                   const printContents = document.getElementById('receipt-print-area')?.innerHTML;
                   const originalContents = document.body.innerHTML;
                   if (printContents) {
                     document.body.innerHTML = printContents;
                     window.print();
                     document.body.innerHTML = originalContents;
                     window.location.reload(); 
                   }
                }}>🖨️ Imprimir Recibo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GRID VIEW ---
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>💳 Cuentas Corrientes</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{ backgroundColor: '#10b981', color: 'white' }} onClick={() => { setShowLedger(true); fetchLedger(); }}>📖 Libro de Movimientos (Auditoría)</button>
          <button className="btn btn-secondary" onClick={fetchBalances}>🔄 Actualizar</button>
        </div>
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
