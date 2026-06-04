require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

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

// ─── Products ───
let nextProductId = 100;
let products = [
  { id: 1, name: 'Classic Black Metal Case', description: 'A timeless matte-black aluminum case with precision cutouts and a premium anodized finish. Lightweight yet rugged — built for everyday durability with a sleek, understated look.', price: 29.99, oldPrice: 39.99, category: 'Black', stock: 15, sku: 'BLK-001', status: 'Active', image: '/assets/template.png' },
  { id: 2, name: 'Brushed Silver Metal Case', description: 'Polished brushed-aluminum with a mirror-like sheen. Each case undergoes a 12-step finishing process for a flawless metallic grain that catches the light beautifully.', price: 34.99, oldPrice: 44.99, category: 'Silver', stock: 8, sku: 'SLV-001', status: 'Active', image: '/assets/template.png' },
  { id: 3, name: 'Gold Titanium Case', description: 'Premium titanium alloy in a radiant gold finish. Aerospace-grade strength with luxury aesthetics. Scratch-resistant, hypoallergenic, and strikingly bold.', price: 49.99, oldPrice: 69.99, category: 'Gold', stock: 3, sku: 'GLD-001', status: 'Active', image: '/assets/template.png' },
  { id: 4, name: 'Rose Gold Aluminum Case', description: 'Elegant rose gold finish with a soft metallic sheen. Precision-machined from aircraft-grade aluminum for a perfect blend of style and protection.', price: 39.99, oldPrice: 54.99, category: 'Rose Gold', stock: 12, sku: 'RSG-001', status: 'Active', image: '/assets/template.png' },
  { id: 5, name: 'Midnight Blue Titanium Case', description: 'Deep midnight blue titanium alloy. Military-grade durability with a stealthy, refined aesthetic that stands out in any crowd.', price: 54.99, oldPrice: 69.99, category: 'Blue', stock: 0, sku: 'BLU-001', status: 'Hidden', image: '/assets/template.png' },
];

app.get('/api/products', (_, res) => {
  res.json({ products });
});

app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

app.post('/api/products', (req, res) => {
  const product = { id: nextProductId++, ...req.body };
  products.push(product);
  res.status(201).json({ product });
});

app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products[idx] = { ...products[idx], ...req.body, id };
  res.json({ product: products[idx] });
});

app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  res.json({ ok: true });
});

// ─── Categories ───
let nextCategoryId = 10;
let categories = [
  { id: 1, name: 'Black' },
  { id: 2, name: 'Silver' },
  { id: 3, name: 'Gold' },
  { id: 4, name: 'Rose Gold' },
  { id: 5, name: 'Blue' },
  { id: 6, name: 'Red' },
];

app.get('/api/categories', (_, res) => {
  res.json({ categories });
});

app.post('/api/categories', (req, res) => {
  const cat = { id: nextCategoryId++, name: req.body.name };
  categories.push(cat);
  res.status(201).json({ category: cat });
});

app.put('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  categories[idx] = { ...categories[idx], name: req.body.name };
  res.json({ category: categories[idx] });
});

app.delete('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  categories.splice(idx, 1);
  res.json({ ok: true });
});

// ─── Orders ───
let orders = [
  { id: 'ORD-001', customer: 'John Doe', items: 'Classic Black ×2', total: 64.98, payment: 'Credit Card', status: 'Delivered', address: '123 Main St, New York, NY 10001', date: '2026-05-15' },
  { id: 'ORD-002', customer: 'Jane Smith', items: 'Gold Titanium ×1', total: 49.99, payment: 'PayPal', status: 'Shipped', address: '456 Oak Ave, Los Angeles, CA 90001', date: '2026-05-28' },
  { id: 'ORD-003', customer: 'Bob Johnson', items: 'Silver ×2 + Rose Gold ×1', total: 114.97, payment: 'Credit Card', status: 'Paid', address: '789 Pine Rd, Chicago, IL 60601', date: '2026-06-01' },
  { id: 'ORD-004', customer: 'Alice Williams', items: 'Classic Black ×1', total: 29.99, payment: 'Apple Pay', status: 'New', address: '321 Elm St, San Francisco, CA 94101', date: '2026-06-02' },
  { id: 'ORD-005', customer: 'Charlie Brown', items: 'Gold Titanium ×2', total: 84.98, payment: 'Credit Card', status: 'New', address: '654 Maple Dr, Miami, FL 33101', date: '2026-06-03' },
  { id: 'ORD-006', customer: 'Diana Prince', items: 'Brushed Silver ×1', total: 34.99, payment: 'PayPal', status: 'Cancelled', address: '987 Cedar Ln, Seattle, WA 98101', date: '2026-05-20' },
  { id: 'ORD-007', customer: 'Eve Adams', items: 'Silver ×2 + Black ×2', total: 174.96, payment: 'Credit Card', status: 'New', address: '147 Birch Ct, Austin, TX 73301', date: '2026-06-03' },
];

app.get('/api/orders', (_, res) => {
  res.json({ orders });
});

app.put('/api/orders/:id/status', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = req.body.status;
  res.json({ order });
});

// ─── Discounts ───
let nextDiscountId = 20;
let discounts = [
  { id: 1, code: 'WELCOME10', discount: 10, active: true },
  { id: 2, code: 'YODA20', discount: 20, active: true },
  { id: 3, code: 'FREESHIP', discount: 15, active: false },
  { id: 4, code: 'VIP30', discount: 30, active: true },
];

app.get('/api/discounts', (_, res) => {
  res.json({ discounts });
});

app.post('/api/discounts', (req, res) => {
  const d = { id: nextDiscountId++, code: req.body.code, discount: req.body.discount, active: req.body.active !== false };
  discounts.push(d);
  res.status(201).json({ discount: d });
});

app.put('/api/discounts/:id/toggle', (req, res) => {
  const d = discounts.find(d => d.id === parseInt(req.params.id, 10));
  if (!d) return res.status(404).json({ error: 'Not found' });
  d.active = !d.active;
  res.json({ discount: d });
});

app.post('/api/discounts/check', (req, res) => {
  const { code } = req.body;
  const d = discounts.find(d => d.code.toUpperCase() === (code || '').toUpperCase() && d.active);
  if (!d) return res.json({ valid: false });
  res.json({ valid: true, discount: d.discount, code: d.code });
});

app.delete('/api/discounts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = discounts.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Discount not found' });
  discounts.splice(idx, 1);
  res.json({ ok: true });
});

// Dashboard stats
app.get('/api/dashboard', (_, res) => {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'New').length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  res.json({ totalRevenue, totalOrders, newOrders, lowStock, avgOrder });
});

app.get('/api/analytics', (_, res) => {
  // Revenue by status
  const paidOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Shipped' || o.status === 'Delivered');
  const revenueByStatus = {
    pending: orders.filter(o => o.status === 'New').reduce((s, o) => s + o.total, 0),
    completed: paidOrders.reduce((s, o) => s + o.total, 0),
    cancelled: orders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + o.total, 0),
  };

  // Popular products (parse items string for order counts)
  const productSales = {};
  orders.forEach(o => {
    const items = o.items.split(' + ');
    items.forEach(item => {
      const match = item.match(/^(.+?) ×(\d+)$/);
      if (match) {
        const name = match[1].trim();
        const qty = parseInt(match[2]) || 1;
        productSales[name] = (productSales[name] || 0) + qty;
      }
    });
  });
  const popularProducts = Object.entries(productSales)
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold);

  // Monthly sales (mock)
  const monthlySales = [
    { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 120 }, { month: 'May', revenue: 340 }, { month: 'Jun', revenue: totalRevenue },
  ];

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const topProduct = popularProducts[0] || { name: '—', sold: 0 };

  res.json({
    totalRevenue,
    totalOrders,
    avgOrder: avgOrder,
    topProduct: topProduct.name,
    topProductSales: topProduct.sold,
    revenueByStatus,
    popularProducts,
    monthlySales,
  });
});

// ─── Admin login ───
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === 'admin') {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Wrong password' });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'YODA' });
});

// ─── Banners & Content ───
let siteBanner = {
  title: 'YODA Metal Cases',
  subtitle: 'Premium Protection for Your Device',
  buttonText: 'Shop Now',
  buttonLink: '/catalog',
  active: true,
};

let siteTexts = {
  aboutTitle: 'About YODA',
  aboutText: 'YODA is a premium brand of metal cases for smartphones and tablets. We combine military-grade protection with elegant design. Every case is precision-machined from aircraft-grade aluminum.',
  contactTitle: 'Contact Us',
  contactText: 'Have questions? Reach out to us at support@yoda-cases.com or visit our showroom.',
  faqTitle: 'FAQ',
  faqText: 'Find answers to common questions about our products, shipping, returns, and warranty.',
  footerText: '© 2026 YODA Metal Cases. All rights reserved.',
};

app.get('/api/banner', (_, res) => {
  res.json({ banner: siteBanner });
});

app.post('/api/banner', (req, res) => {
  siteBanner = { ...siteBanner, ...req.body };
  res.json({ banner: siteBanner });
});

app.get('/api/site-texts', (_, res) => {
  res.json({ texts: siteTexts });
});

app.post('/api/site-texts', (req, res) => {
  siteTexts = { ...siteTexts, ...req.body };
  res.json({ texts: siteTexts });
});

// ─── Settings ───
let siteSettings = {
  currency: 'USD',
  currencySymbol: '$',
  shippingMethods: [
    { name: 'Standard Shipping', price: 4.99, days: '5-8' },
    { name: 'Express Shipping', price: 12.99, days: '2-3' },
    { name: 'Free Shipping', price: 0, days: '7-12', minOrder: 50 },
  ],
  paymentMethods: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay'],
  seoTitle: 'YODA Metal Cases — Premium Protection for Your Device',
  seoDescription: 'Military-grade metal cases for smartphones and tablets. Precision-machined from aircraft-grade aluminum.',
  seoKeywords: 'metal cases, phone cases, aluminum cases, premium protection, yoda cases',
  socialLinks: [
    { platform: 'Instagram', url: 'https://instagram.com/yodacases' },
    { platform: 'Twitter', url: 'https://twitter.com/yodacases' },
    { platform: 'Facebook', url: 'https://facebook.com/yodacases' },
  ],
};

app.get('/api/settings', (_, res) => {
  res.json({ settings: siteSettings });
});

app.post('/api/settings', (req, res) => {
  siteSettings = { ...siteSettings, ...req.body };
  res.json({ settings: siteSettings });
});

// ─── Stripe Checkout ───
let nextOrderId = 10;

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { items, coupon, customer } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty || 1,
    }));

    // Apply coupon discount if provided
    let discounts = [];
    if (coupon) {
      const found = discounts.find(d => d.code.toUpperCase() === coupon.toUpperCase() && d.active);
      if (found) {
        try {
          const couponObj = await stripe.coupons.create({
            percent_off: found.discount,
            duration: 'once',
            name: found.code,
          });
          discounts.push({ coupon: couponObj.id });
        } catch (_) {}
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      discounts: discounts.length > 0 ? discounts : undefined,
      success_url: `${req.headers.origin || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/checkout/cancel`,
      metadata: {
        customer_name: customer?.name || 'Guest',
        customer_address: customer?.address || '',
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Payment error' });
  }
});

app.post('/api/checkout/verify', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Create order
      const order = {
        id: `ORD-${String(nextOrderId++).padStart(3, '0')}`,
        customer: session.metadata?.customer_name || 'Guest',
        items: 'via Stripe',
        total: (session.amount_total || 0) / 100,
        payment: 'Credit Card',
        status: 'Paid',
        address: session.metadata?.customer_address || '',
        date: new Date().toISOString().slice(0, 10),
      };
      orders.unshift(order);
      res.json({ ok: true, order });
    } else {
      res.json({ ok: false, status: session.payment_status });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🦾 YODA server running on port ${PORT}`);
});
