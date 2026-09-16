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
  const { default_lat, default_lng, calendar_start_time, calendar_end_time, calendar_default_view, trip_auto_finish_minutes, reminder_minutes_before } = req.body;
  try {
    const result = await pool.query(
      'UPDATE settings SET default_lat = $1, default_lng = $2, calendar_start_time = $3, calendar_end_time = $4, calendar_default_view = $5, trip_auto_finish_minutes = $6, reminder_minutes_before = $7 WHERE id = 1 RETURNING *',
      [default_lat, default_lng, calendar_start_time || '00:00', calendar_end_time || '23:59', calendar_default_view || 'month', trip_auto_finish_minutes || 20, reminder_minutes_before || 15]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
