import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getTrips = async (req: Request, res: Response) => {
  try {
    const updatedTrips = await pool.query(`UPDATE trips SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE status = 'scheduled' AND scheduled_time <= NOW() RETURNING id, passenger_id`);
    
    const io = req.app.get('io');
    if (io && updatedTrips.rows.length > 0) {
       for (const trip of updatedTrips.rows) {
          const passRes = await pool.query(`SELECT name FROM passengers WHERE id=$1`, [trip.passenger_id]);
          const passName = passRes.rows.length > 0 ? passRes.rows[0].name : 'Desconocido';
          io.to('room_admin').emit('trip_reminder', {
             tripId: trip.id,
             message: `El viaje de ${passName} acaba de INICIAR.`
          });
       }
    }

    let query = `
      SELECT t.*, 
             d.name as driver_name, 
             p.name as passenger_name, 
             v.plate as vehicle_plate,
             po.name as origin_address,
             pd.name as destination_address,
             po.lat as origin_lat,
             po.lng as origin_lng,
             pd.lat as destination_lat,
             pd.lng as destination_lng,
             pr.name as price_rate_name,
             pr.price_per_km
      FROM trips t
      LEFT JOIN users d ON t.driver_id = d.id
      LEFT JOIN passengers p ON t.passenger_id = p.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN places po ON t.origin_place_id = po.id
      LEFT JOIN places pd ON t.destination_place_id = pd.id
      LEFT JOIN price_rates pr ON t.price_rate_id = pr.id
    `;
    const params: any[] = [];
    let whereClauses: string[] = [];

    if (req.query.driver_id) {
      params.push(req.query.driver_id);
      whereClauses.push(`t.driver_id = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      whereClauses.push(`t.status = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY COALESCE(t.scheduled_time, t.created_at) DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const checkOverlap = async (driver_id: string | null, passenger_id: string | null, scheduled_time: string, exclude_id?: string) => {
  if (!scheduled_time) return null;
  if (!driver_id && !passenger_id) return null;
  
  // We assume a trip takes 1 hour. Overlap means there is a trip whose scheduled_time is within 59 minutes.
  const time = new Date(scheduled_time).toISOString();
  
  let query = `
    SELECT id, driver_id, passenger_id FROM trips 
    WHERE status IN ('scheduled', 'in_progress')
    AND scheduled_time >= $1::timestamp - interval '59 minutes'
    AND scheduled_time <= $1::timestamp + interval '59 minutes'
  `;
  const params: any[] = [time];
  
  if (exclude_id) {
    query += ` AND id != $2`;
    params.push(exclude_id);
  }
  
  const result = await pool.query(query, params);
  
  for (const trip of result.rows) {
    if (driver_id && trip.driver_id === driver_id) {
      return 'El chofer ya tiene un viaje asignado en este horario o muy cercano (margen de 1 hora).';
    }
    if (passenger_id && trip.passenger_id === passenger_id) {
      return 'El pasajero ya tiene un viaje programado en este horario o muy cercano (margen de 1 hora).';
    }
  }
  
  return null;
};

export const createTrip = async (req: Request, res: Response) => {
  const { driver_id, vehicle_id, passenger_id, origin_place_id, destination_place_id, scheduled_time, distance_km, price_rate_id, total_price, status } = req.body;
  try {
    if (scheduled_time) {
      const errorMsg = await checkOverlap(driver_id, passenger_id, scheduled_time);
      if (errorMsg) {
        return res.status(400).json({ error: errorMsg });
      }
    }

    const finalStatus = status || (scheduled_time ? 'scheduled' : 'in_progress');
    const startedAt = finalStatus === 'in_progress' ? new Date().toISOString() : null;
    const result = await pool.query(
      `INSERT INTO trips (driver_id, vehicle_id, passenger_id, origin_place_id, destination_place_id, scheduled_time, distance_km, price_rate_id, total_price, status, started_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [driver_id || null, vehicle_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, scheduled_time || null, distance_km || null, price_rate_id || null, total_price || null, finalStatus, startedAt]
    );

    if (finalStatus === 'in_progress') {
       const io = req.app.get('io');
       if (io) {
          const passRes = await pool.query(`SELECT name FROM passengers WHERE id=$1`, [passenger_id]);
          const passName = passRes.rows.length > 0 ? passRes.rows[0].name : 'Desconocido';
          io.to('room_admin').emit('trip_reminder', {
             tripId: result.rows[0].id,
             message: `El viaje de ${passName} acaba de INICIAR.`
          });
       }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { driver_id, vehicle_id, passenger_id, origin_place_id, destination_place_id, scheduled_time, distance_km, price_rate_id, total_price, status } = req.body;
  try {
    if (scheduled_time && status !== 'completed') {
      const errorMsg = await checkOverlap(driver_id, passenger_id, scheduled_time, id);
      if (errorMsg) {
        return res.status(400).json({ error: errorMsg });
      }
    }

    let finalPrice = total_price;
    let finalRate = price_rate_id;

    if (status === 'completed' && (!finalPrice || parseFloat(finalPrice) === 0)) {
       let pricePerKm = 0;
       if (finalRate) {
          const r = await pool.query(`SELECT price_per_km FROM price_rates WHERE id = $1`, [finalRate]);
          if (r.rows.length > 0) pricePerKm = r.rows[0].price_per_km;
       } else {
          const r = await pool.query(`SELECT id, price_per_km FROM price_rates LIMIT 1`);
          if (r.rows.length > 0) {
            finalRate = r.rows[0].id;
            pricePerKm = r.rows[0].price_per_km;
          }
       }
       if (distance_km) {
          finalPrice = (parseFloat(distance_km) * pricePerKm).toFixed(2);
       }
    }

    const oldTripRes = await pool.query(`SELECT status FROM trips WHERE id=$1`, [id]);
    const oldStatus = oldTripRes.rows.length > 0 ? oldTripRes.rows[0].status : null;

    const result = await pool.query(
      `UPDATE trips SET driver_id=$1, vehicle_id=$2, passenger_id=$3, origin_place_id=$4, destination_place_id=$5, scheduled_time=$6, distance_km=$7, price_rate_id=$8, total_price=$9, status=$10, started_at=CASE WHEN $10 = 'in_progress' THEN COALESCE(started_at, CURRENT_TIMESTAMP) ELSE started_at END WHERE id=$11 RETURNING *`,
      [driver_id || null, vehicle_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, scheduled_time || null, distance_km || null, finalRate || null, finalPrice || null, status, id]
    );

    if (oldStatus !== 'in_progress' && status === 'in_progress') {
       const io = req.app.get('io');
       if (io) {
          const passRes = await pool.query(`SELECT name FROM passengers WHERE id=$1`, [passenger_id]);
          const passName = passRes.rows.length > 0 ? passRes.rows[0].name : 'Desconocido';
          io.to('room_admin').emit('trip_reminder', {
             tripId: id,
             message: `El viaje de ${passName} acaba de INICIAR.`
          });
       }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const checkRes = await pool.query('SELECT paid_amount, started_at FROM trips WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    
    const trip = checkRes.rows[0];
    if (trip.paid_amount && parseFloat(trip.paid_amount) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un viaje que tiene pagos asociados. Anule el pago primero si es necesario.' });
    }
    
    if (trip.started_at) {
      return res.status(400).json({ error: 'No se puede eliminar un viaje que realmente se realizó (iniciado por el chofer). Si fue un error, considere ponerle costo $0.' });
    }

    await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const finishTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { distance_km } = req.body;
  try {
    const tripRes = await pool.query(`SELECT distance_km, total_price, price_rate_id FROM trips WHERE id = $1`, [id]);
    if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripRes.rows[0];
    
    let finalDist = distance_km !== undefined ? distance_km : trip.distance_km || 0;
    let finalPrice = trip.total_price;
    let rateId = trip.price_rate_id;
    
    if (!finalPrice || parseFloat(finalPrice) === 0) {
       let pricePerKm = 0;
       if (rateId) {
          const r = await pool.query(`SELECT price_per_km FROM price_rates WHERE id = $1`, [rateId]);
          if (r.rows.length > 0) pricePerKm = r.rows[0].price_per_km;
       } else {
          const r = await pool.query(`SELECT id, price_per_km FROM price_rates LIMIT 1`);
          if (r.rows.length > 0) {
            rateId = r.rows[0].id;
            pricePerKm = r.rows[0].price_per_km;
          }
       }
       finalPrice = (finalDist * pricePerKm).toFixed(2);
    }

    const result = await pool.query(
      `UPDATE trips 
       SET status = 'completed', distance_km = $1, total_price = $2, price_rate_id = $3, ended_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [finalDist, finalPrice, rateId, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error finishing trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
