import cron from 'node-cron';
import { pool } from '../config/database';
import { Server } from 'socket.io';

export const startCronJobs = (io: Server) => {
  // Ejecutar cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      // Obtener el tiempo de configuración
      const settingsRes = await pool.query('SELECT reminder_minutes_before, trip_auto_finish_minutes FROM settings LIMIT 1');
      const minutesBefore = settingsRes.rows[0]?.reminder_minutes_before || 15;
      const autoFinishMinutes = settingsRes.rows[0]?.trip_auto_finish_minutes || 20;
      
      // Buscar viajes programados que empiezan dentro de "minutesBefore" minutos, 
      // y que no se les haya enviado el aviso
      const query = `
        SELECT t.id, t.driver_id, t.scheduled_time, 
               po.name as origin_address, pd.name as destination_address, p.name as passenger_name,
               d.name as driver_name
        FROM trips t
        LEFT JOIN places po ON t.origin_place_id = po.id
        LEFT JOIN places pd ON t.destination_place_id = pd.id
        LEFT JOIN passengers p ON t.passenger_id = p.id
        LEFT JOIN users d ON t.driver_id = d.id
        WHERE t.status = 'scheduled' 
          AND t.reminder_sent = FALSE
          AND t.scheduled_time IS NOT NULL
          AND t.scheduled_time BETWEEN NOW() AND (NOW() + interval '1 minute' * $1)
      `;
      
      const res = await pool.query(query, [minutesBefore]);
      const upcomingTrips = res.rows;
      
      for (const trip of upcomingTrips) {
        // Emitir alerta a la sala de administradores
        io.to('room_admin').emit('trip_reminder', {
          tripId: trip.id,
          message: `El viaje de ${trip.passenger_name} (Chofer: ${trip.driver_name || 'Sin asignar'}) comienza en ${minutesBefore} minutos.`,
          origin: trip.origin_address,
          destination: trip.destination_address,
          time: trip.scheduled_time
        });
        
        // Emitir alerta a la sala del chofer específico
        if (trip.driver_id) {
          io.to(`room_driver_${trip.driver_id}`).emit('trip_reminder', {
            tripId: trip.id,
            message: `¡Atento! Tienes un viaje programado para ${trip.passenger_name} que comienza en ${minutesBefore} minutos.`,
            origin: trip.origin_address,
            destination: trip.destination_address,
            time: trip.scheduled_time
          });
        }
        
        // Marcar como enviado
        await pool.query('UPDATE trips SET reminder_sent = TRUE WHERE id = $1', [trip.id]);
      }
      
      // Lógica de finalización automática de viajes
      try {
        const autoFinishQuery = `
          SELECT id, driver_id, passenger_id, distance_km, total_price, price_rate_id 
          FROM trips
          WHERE status = 'in_progress' 
            AND (
              (started_at IS NOT NULL AND started_at <= NOW() - interval '1 minute' * $1)
              OR 
              (started_at IS NULL AND scheduled_time <= NOW() - interval '1 minute' * $1)
              OR 
              (started_at IS NULL AND created_at <= NOW() - interval '1 minute' * $1)
            )
        `;
        const autoRes = await pool.query(autoFinishQuery, [autoFinishMinutes]);
        for (const trip of autoRes.rows) {
          let finalDist = trip.distance_km || 0;
          let finalPrice = trip.total_price;
          let rateId = trip.price_rate_id;
          
          if (!finalPrice || parseFloat(finalPrice) === 0) {
             let pricePerKm = 0;
             if (rateId) {
                const r = await pool.query(`SELECT price_per_km FROM price_rates WHERE id = $1`, [rateId]);
                if (r.rows.length > 0) pricePerKm = r.rows[0].price_per_km;
             } else {
                const r = await pool.query(`SELECT id, price_per_km FROM price_rates LIMIT 1`);
                if (r.rows.length > 0) {
                  rateId = r.rows[0].id;
                  pricePerKm = r.rows[0].price_per_km;
                }
             }
             finalPrice = (finalDist * pricePerKm).toFixed(2);
          }

          await pool.query(
            `UPDATE trips 
             SET status = 'completed', total_price = $1, price_rate_id = $2, ended_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [finalPrice, rateId, trip.id]
          );
          
          if (trip.driver_id) {
            io.to(`room_driver_${trip.driver_id}`).emit('trip_reminder', {
              tripId: trip.id,
              message: `El viaje ha sido finalizado automáticamente tras ${autoFinishMinutes} minutos.`,
            });
          }
          io.to('room_admin').emit('trip_reminder', {
            tripId: trip.id,
            message: `Un viaje ha sido finalizado automáticamente tras ${autoFinishMinutes} minutos (ID: ${trip.id}).`,
          });
        }
      } catch (err) {
        console.error('Error en cron auto-finish:', err);
      }

    } catch (error) {
      console.error('Error en el cron de recordatorios:', error);
    }
  });
};
