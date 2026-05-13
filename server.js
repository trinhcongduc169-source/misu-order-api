const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pricesRouter = require('./routes/prices');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MISU Order API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/prices', pricesRouter);
app.use('/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy API endpoint.',
  });
});

app.use((err, req, res, next) => {
  console.error('[MISU API ERROR]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    details: err.details,
    stack: err.stack,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server gặp lỗi. Vui lòng thử lại sau.',
    details: err.details,
  });
});

app.listen(PORT, () => {
  console.log(`MISU Order API is running on port ${PORT}`);
});
