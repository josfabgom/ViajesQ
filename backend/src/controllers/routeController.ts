import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             d.name as driver_name, 
             p.name as passenger_name, 
             po.name as origin_name,
             pd.name as destination_name,
             pr.name as price_rate_name,
             pr.price_per_km
      FROM routes r
      LEFT JOIN users d ON r.driver_id = d.id
      LEFT JOIN passengers p ON r.passenger_id = p.id
      LEFT JOIN places po ON r.origin_place_id = po.id
      LEFT JOIN places pd ON r.destination_place_id = pd.id
      LEFT JOIN price_rates pr ON r.price_rate_id = pr.id
      ORDER BY r.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching routes', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRoute = async (req: Request, res: Response) => {
  const { name, driver_id, passenger_id, origin_place_id, destination_place_id, distance_km, price_rate_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO routes (name, driver_id, passenger_id, origin_place_id, destination_place_id, distance_km, price_rate_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, driver_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, distance_km || null, price_rate_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating route', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, driver_id, passenger_id, origin_place_id, destination_place_id, distance_km, price_rate_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE routes SET name = $1, driver_id = $2, passenger_id = $3, origin_place_id = $4, destination_place_id = $5, distance_km = $6, price_rate_id = $7 WHERE id = $8 RETURNING *',
      [name, driver_id || null, passenger_id || null, origin_place_id || null, destination_place_id || null, distance_km || null, price_rate_id || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating route', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM routes WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting route', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
