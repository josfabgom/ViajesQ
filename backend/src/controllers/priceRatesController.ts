import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getPriceRates = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM price_rates ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching price rates' });
  }
};

export const createPriceRate = async (req: Request, res: Response) => {
  const { name, price_per_km } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO price_rates (name, price_per_km) VALUES ($1, $2) RETURNING *',
      [name, price_per_km]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating price rate' });
  }
};

export const updatePriceRate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price_per_km } = req.body;
  try {
    const result = await pool.query(
      'UPDATE price_rates SET name = $1, price_per_km = $2 WHERE id = $3 RETURNING *',
      [name, price_per_km, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating price rate' });
  }
};

export const deletePriceRate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM price_rates WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting price rate (might be in use)' });
  }
};
