import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  const { plate, brand, model, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicles (plate, brand, model, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [plate, brand, model, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { plate, brand, model, capacity } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vehicles SET plate = $1, brand = $2, model = $3, capacity = $4 WHERE id = $5 RETURNING *',
      [plate, brand, model, capacity, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
