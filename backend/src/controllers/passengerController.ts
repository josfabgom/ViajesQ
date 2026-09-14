import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getPassengers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM passengers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPassenger = async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO passengers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
      [name, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePassenger = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE passengers SET name = $1, phone = $2, email = $3 WHERE id = $4 RETURNING *',
      [name, phone, email, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePassenger = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM passengers WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
