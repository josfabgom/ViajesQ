import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getTrips = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
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
      ORDER BY COALESCE(t.scheduled_time, t.created_at) DESC
    `);
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
    const result = await pool.query(
      `INSERT INTO trips (driver_id, vehicle_id, passenger_id, origin_place_id, destination_place_id, scheduled_time, distance_km, price_rate_id, total_price, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [driver_id || null, vehicle_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, scheduled_time || null, distance_km || null, price_rate_id || null, total_price || null, finalStatus]
    );
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
    if (scheduled_time) {
      const errorMsg = await checkOverlap(driver_id, passenger_id, scheduled_time, id);
      if (errorMsg) {
        return res.status(400).json({ error: errorMsg });
      }
    }

    const result = await pool.query(
      `UPDATE trips SET driver_id=$1, vehicle_id=$2, passenger_id=$3, origin_place_id=$4, destination_place_id=$5, scheduled_time=$6, distance_km=$7, price_rate_id=$8, total_price=$9, status=$10 WHERE id=$11 RETURNING *`,
      [driver_id || null, vehicle_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, scheduled_time || null, distance_km || null, price_rate_id || null, total_price || null, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
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
    const result = await pool.query(
      `UPDATE trips 
       SET status = 'completed', distance_km = COALESCE($1, distance_km), ended_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [distance_km || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error finishing trip', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
