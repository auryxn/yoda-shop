require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/dist'));
  app.get('*', (_, res) => {
    res.sendFile('index.html', { root: '../client/dist' });
  });
}

// API routes
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'YODA' });
});

app.get('/api/products', (_, res) => {
  res.json({
    products: [
      { id: 1, name: 'Classic Black Metal Case', price: 29.99, image: '/images/classic-black.jpg' },
      { id: 2, name: 'Brushed Silver Metal Case', price: 34.99, image: '/images/brushed-silver.jpg' },
      { id: 3, name: 'Gold Titanium Case', price: 49.99, image: '/images/gold-titanium.jpg' },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🦾 YODA server running on port ${PORT}`);
});
