import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'viajesq_super_secret_key_2024';
const JWT_EXPIRES = '8h';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role_name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // req.user is set by the auth middleware
  res.json((req as any).user);
};

export const getMyPendingTrips = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'driver') return res.status(403).json({ error: 'Solo para choferes' });
  
  try {
    const result = await pool.query(
      `SELECT t.*, 
             p.name as passenger_name, 
             po.name as origin_address,
             pd.name as destination_address
      FROM trips t
      LEFT JOIN passengers p ON t.passenger_id = p.id
      LEFT JOIN places po ON t.origin_place_id = po.id
      LEFT JOIN places pd ON t.destination_place_id = pd.id
      WHERE t.driver_id = $1 
        AND t.status = 'completed' 
        AND t.payment_status != 'paid'
      ORDER BY COALESCE(t.ended_at, t.scheduled_time, t.created_at) ASC`,
      [user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyPaymentHistory = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'driver') return res.status(403).json({ error: 'Solo para choferes' });
  
  try {
    const result = await pool.query(
      `SELECT * FROM driver_payments 
      WHERE driver_id = $1 
      ORDER BY created_at DESC`,
      [user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyBalance = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'driver') return res.status(403).json({ error: 'Solo para choferes' });
  
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE((SELECT SUM(t.total_price) FROM trips t WHERE t.driver_id = $1 AND t.status = 'completed'), 0) as total_earned,
        COALESCE((SELECT SUM(dp.amount) FROM driver_payments dp WHERE dp.driver_id = $1), 0) as total_paid`,
      [user.id]
    );
    
    const r = result.rows[0];
    const balance = parseFloat(r.total_earned) - parseFloat(r.total_paid);
    res.json({ total_earned: r.total_earned, total_paid: r.total_paid, balance });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
