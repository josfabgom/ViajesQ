import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getPlaces = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM places ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPlace = async (req: Request, res: Response) => {
  const { name, address, lat, lng } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO places (name, address, lat, lng) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, lat, lng]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePlace = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, lat, lng } = req.body;
  try {
    const result = await pool.query(
      'UPDATE places SET name = $1, address = $2, lat = $3, lng = $4 WHERE id = $5 RETURNING *',
      [name, address, lat, lng, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePlace = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM places WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
