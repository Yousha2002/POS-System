// src/app.js
import express from 'express';
import cors from './middlewares/cors.js';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menus.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// Middlewares
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});


app.use( (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;