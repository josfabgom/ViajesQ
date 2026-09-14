import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { default_lat, default_lng } = req.body;
  try {
    const result = await pool.query(
      'UPDATE settings SET default_lat = $1, default_lng = $2 WHERE id = 1 RETURNING *',
      [default_lat, default_lng]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
