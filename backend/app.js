const express = require('express');
const cors = require('cors');
const errorHandler  = require('./src/middleware/errorHandler');
const authRoutes    = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/products.routes');
const orderRoutes   = require('./src/routes/orders.routes');
const vendorRoutes  = require('./src/routes/vendor.routes');
const vehiclesRouter = require('./src/routes/vehicles.routes');
const adminRoutes    = require('./src/routes/admin.routes');
const dispatchRoutes = require('./src/routes/dispatch.routes');
const returnsRoutes  = require('./src/routes/returns.routes');

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4000',
    'https://purzaa.netlify.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders',   orderRoutes);
app.use('/api/v1/vendor',   vendorRoutes);
app.use('/api/v1/vehicles', vehiclesRouter);
app.use('/api/v1/admin',      adminRoutes);
app.use('/api/v1/dispatches', dispatchRoutes);
app.use('/api/v1/returns',    returnsRoutes);

app.use(errorHandler);

module.exports = app;
