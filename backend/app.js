const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/products.routes');
const orderRoutes = require('./src/routes/orders.routes');
const vendorRoutes = require('./src/routes/vendor.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/vendor', vendorRoutes);

app.use(errorHandler);

module.exports = app;
