import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Trigger restart
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

import tripRoutes from './routes/tripRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ViajesQ API is running' });
});

// Socket.io for Real-time GPS Tracking
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Driver app emits this when moving
  socket.on('driverLocationUpdate', (data) => {
    // data should contain { driverId, tripId, lat, lng }
    // Broadcast to admins watching the map
    io.emit('adminMapUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server and Socket.io running on port ${port}`);
});
