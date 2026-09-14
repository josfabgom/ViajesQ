import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, r.name as role_name, r.id as role_id
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, phone, password, role_id } = req.body;
  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y perfil son obligatorios' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role_id`,
      [name, email, phone, password_hash, role_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role_id, password } = req.body;
  try {
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name=$1, email=$2, phone=$3, role_id=$4, password_hash=$5 WHERE id=$6`,
        [name, email, phone, role_id, password_hash, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name=$1, email=$2, phone=$3, role_id=$4 WHERE id=$5`,
        [name, email, phone, role_id, id]
      );
    }
    const result = await pool.query('SELECT id, name, email, phone, role_id FROM users WHERE id=$1', [id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as any).user;
  if (requestingUser.id === id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar. El usuario puede tener viajes o rutas asignadas.' });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
