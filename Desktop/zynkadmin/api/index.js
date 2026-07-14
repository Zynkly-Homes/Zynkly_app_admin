require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('../zynkly-admin/backend/src/config/db');
const errorHandler = require('../zynkly-admin/backend/src/middleware/errorHandler');

// Route imports
const authRoutes = require('../zynkly-admin/backend/src/routes/authRoutes');
const dashboardRoutes = require('../zynkly-admin/backend/src/routes/dashboardRoutes');
const userRoutes = require('../zynkly-admin/backend/src/routes/userRoutes');
const serviceRoutes = require('../zynkly-admin/backend/src/routes/serviceRoutes');
const bookingRoutes = require('../zynkly-admin/backend/src/routes/bookingRoutes');
const paymentRoutes = require('../zynkly-admin/backend/src/routes/paymentRoutes');
const notificationRoutes = require('../zynkly-admin/backend/src/routes/notificationRoutes');
const reportRoutes = require('../zynkly-admin/backend/src/routes/reportRoutes');
const settingsRoutes = require('../zynkly-admin/backend/src/routes/settingsRoutes');

// Connect to database
connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../zynkly-admin/backend/src/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../zynkly-admin/backend/src/uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Zynkly API is running 🚀', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
