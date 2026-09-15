import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, r.name as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = 'driver'
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  try {
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'driver'");
    const roleId = roleResult.rows[0].id;
    const password_hash = await bcrypt.hash(password || 'defaultpass', 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone',
      [name, email, phone, password_hash, roleId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;
  try {
    let result;
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      result = await pool.query(
        'UPDATE users SET name = $1, email = $2, phone = $3, password_hash = $4 WHERE id = $5 RETURNING id, name, email, phone',
        [name, email, phone, password_hash, id]
      );
    } else {
      result = await pool.query(
        'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone',
        [name, email, phone, id]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
