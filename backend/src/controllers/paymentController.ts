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
          WHERE dp.driver_id = u.id AND dp.status = 'active'
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
            await client.query(`INSERT INTO payment_trips (payment_id, trip_id, amount_allocated) VALUES ($1, $2, $3)`, [payment.id, trip.id, tripDebt]);
            remainingPayment -= tripDebt;
          } else {
            // Pay trip partially
            await client.query(
              `UPDATE trips SET paid_amount = $1, payment_status = 'partial' WHERE id = $2`,
              [tripPaid + remainingPayment, trip.id]
            );
            await client.query(`INSERT INTO payment_trips (payment_id, trip_id, amount_allocated) VALUES ($1, $2, $3)`, [payment.id, trip.id, remainingPayment]);
            remainingPayment = 0;
          }
        }
      }
    }

    // Insert Audit Log
    await client.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details) VALUES ($1, $2, $3, $4, $5)`,
      ['PAYMENT_CREATED', 'driver_payment', payment.id, (req as any).user?.id, JSON.stringify({ amount: amount, driver_id: driver_id })]
    );

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

export const getPaymentReceipt = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const paymentRes = await pool.query(`
      SELECT dp.*, u.name as driver_name 
      FROM driver_payments dp
      JOIN users u ON dp.driver_id = u.id
      WHERE dp.id = $1
    `, [id]);

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentRes.rows[0];

    const tripsRes = await pool.query(`
      SELECT pt.amount_allocated, t.scheduled_time, t.started_at, t.ended_at, t.created_at,
             po.name as origin_address, pd.name as destination_address, p.name as passenger_name
      FROM payment_trips pt
      JOIN trips t ON pt.trip_id = t.id
      LEFT JOIN places po ON t.origin_place_id = po.id
      LEFT JOIN places pd ON t.destination_place_id = pd.id
      LEFT JOIN passengers p ON t.passenger_id = p.id
      WHERE pt.payment_id = $1
    `, [id]);

    res.json({
      ...payment,
      trips: tripsRes.rows
    });
  } catch (error) {
    console.error('Error fetching payment receipt', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const annulPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).user?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Check if payment exists and is active
    const paymentRes = await client.query('SELECT * FROM driver_payments WHERE id = $1 FOR UPDATE', [id]);
    if (paymentRes.rows.length === 0) throw new Error('Payment not found');
    const payment = paymentRes.rows[0];
    if (payment.status === 'annulled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Payment is already annulled' });
    }

    // Get payment trips
    const ptRes = await client.query('SELECT * FROM payment_trips WHERE payment_id = $1', [id]);
    
    for (const pt of ptRes.rows) {
      // Revert paid_amount on trip
      const amountToRevert = parseFloat(pt.amount_allocated);
      
      const tripRes = await client.query('SELECT total_price, paid_amount FROM trips WHERE id = $1 FOR UPDATE', [pt.trip_id]);
      if (tripRes.rows.length > 0) {
        const trip = tripRes.rows[0];
        const newPaidAmount = Math.max(0, parseFloat(trip.paid_amount) - amountToRevert);
        const total = parseFloat(trip.total_price);
        
        let newStatus = 'pending';
        if (newPaidAmount >= total && total > 0) newStatus = 'paid';
        else if (newPaidAmount > 0) newStatus = 'partial';
        
        await client.query(
          'UPDATE trips SET paid_amount = $1, payment_status = $2 WHERE id = $3',
          [newPaidAmount, newStatus, pt.trip_id]
        );
      }
    }

    // Update driver_payments
    await client.query(
      'UPDATE driver_payments SET status = $1, annulled_at = CURRENT_TIMESTAMP, annulled_by = $2 WHERE id = $3',
      ['annulled', adminId, id]
    );

    // Insert Audit log
    await client.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details) VALUES ($1, $2, $3, $4, $5)`,
      ['PAYMENT_ANNULLED', 'driver_payment', id, adminId, JSON.stringify({ amount: payment.amount, driver_id: payment.driver_id })]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Payment annulled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error annulling payment', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const getPaymentLedger = async (req: Request, res: Response) => {
  try {
    const ledgerRes = await pool.query(`
      SELECT 
        dp.id, dp.amount, dp.payment_method, dp.status, dp.created_at, dp.annulled_at, dp.observations,
        u.name as driver_name,
        a.name as annulled_by_name
      FROM driver_payments dp
      JOIN users u ON dp.driver_id = u.id
      LEFT JOIN users a ON dp.annulled_by = a.id
      ORDER BY dp.created_at DESC
    `);
    res.json(ledgerRes.rows);
  } catch (error) {
    console.error('Error fetching payment ledger', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  const paymentId = req.params.id;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if payment is active, if so revert balances first
    const payRes = await client.query('SELECT status FROM driver_payments WHERE id = $1', [paymentId]);
    if (payRes.rows.length > 0 && payRes.rows[0].status === 'active') {
      const tripsRes = await client.query('SELECT trip_id, amount_allocated FROM payment_trips WHERE payment_id = $1', [paymentId]);
      for (const pt of tripsRes.rows) {
        await client.query(
          `UPDATE trips 
           SET paid_amount = GREATEST(0, COALESCE(paid_amount, 0) - $1)
           WHERE id = $2`,
          [pt.amount_allocated, pt.trip_id]
        );
        await client.query(
          `UPDATE trips 
           SET payment_status = CASE WHEN paid_amount <= 0 THEN 'pending' ELSE 'partial' END
           WHERE id = $1`,
          [pt.trip_id]
        );
      }
    }
    
    // Delete payment_trips, audit_logs and driver_payments (cascade takes care of payment_trips usually, but let's be safe)
    await client.query('DELETE FROM payment_trips WHERE payment_id = $1', [paymentId]);
    await client.query("DELETE FROM audit_logs WHERE action IN ('payment_created', 'payment_annulled') AND details->>'payment_id' = $1", [paymentId]);
    await client.query('DELETE FROM driver_payments WHERE id = $1', [paymentId]);
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting payment', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
