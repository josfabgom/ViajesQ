import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getDriverBalances = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as driver_id,
        u.name,
        u.email,
        u.phone,
        COALESCE((
          SELECT SUM(t.total_price) 
          FROM trips t 
          WHERE t.driver_id = u.id AND t.status = 'completed'
        ), 0) as total_earned,
        COALESCE((
          SELECT SUM(dp.amount) 
          FROM driver_payments dp 
          WHERE dp.driver_id = u.id
        ), 0) as total_paid
      FROM users u
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'driver')
    `);
    
    const balances = result.rows.map(r => ({
      ...r,
      total_earned: parseFloat(r.total_earned),
      total_paid: parseFloat(r.total_paid),
      balance: parseFloat(r.total_earned) - parseFloat(r.total_paid)
    }));
    
    res.json(balances);
  } catch (error) {
    console.error('Error fetching driver balances', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingTrips = async (req: Request, res: Response) => {
  const { driver_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT t.*, 
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
      ORDER BY COALESCE(t.ended_at, t.scheduled_time, t.created_at) ASC
    `, [driver_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending trips', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  const { driver_id, amount, payment_method, period_start, period_end, trip_ids, observations } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert payment record
    const paymentResult = await client.query(
      `INSERT INTO driver_payments (driver_id, amount, payment_method, period_start, period_end, observations) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [driver_id, amount, payment_method || 'efectivo', period_start || null, period_end || null, observations || null]
    );
    const payment = paymentResult.rows[0];

    // Distribute payment across trips if trip_ids are provided
    if (trip_ids && trip_ids.length > 0) {
      let remainingPayment = parseFloat(amount);
      
      const tripsResult = await client.query(`
        SELECT id, total_price, paid_amount 
        FROM trips 
        WHERE id = ANY($1) 
        ORDER BY COALESCE(ended_at, scheduled_time, created_at) ASC
      `, [trip_ids]);

      for (const trip of tripsResult.rows) {
        if (remainingPayment <= 0) break;
        
        const tripTotal = parseFloat(trip.total_price || 0);
        const tripPaid = parseFloat(trip.paid_amount || 0);
        const tripDebt = tripTotal - tripPaid;
        
        if (tripDebt > 0) {
          if (remainingPayment >= tripDebt) {
            // Pay trip fully
            await client.query(
              `UPDATE trips SET paid_amount = $1, payment_status = 'paid' WHERE id = $2`,
              [tripTotal, trip.id]
            );
            remainingPayment -= tripDebt;
          } else {
            // Pay trip partially
            await client.query(
              `UPDATE trips SET paid_amount = $1, payment_status = 'partial' WHERE id = $2`,
              [tripPaid + remainingPayment, trip.id]
            );
            remainingPayment = 0;
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(payment);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  const { driver_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM driver_payments 
      WHERE driver_id = $1 
      ORDER BY created_at DESC
    `, [driver_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment history', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
