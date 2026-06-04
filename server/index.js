require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Stripe = require('stripe');
const { requireAdminAuth, signAdminToken } = require('./middleware/auth');
const { validateBody, schemas } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 4000;

const requiredEnvVars = ['STRIPE_SECRET_KEY', 'ADMIN_PASSWORD_HASH', 'JWT_SECRET', 'CORS_ORIGINS', 'CLIENT_URL'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const allowedOrigins = process.env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('tiny', {
  skip: (req) => req.path === '/api/admin/login' || req.path === '/api/create-checkout',
}));

app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
}));

const adminLoginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
});

function requireCsrf(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || token !== req.admin?.csrf) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
}

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

app.post('/api/products', requireAdminAuth, requireCsrf, validateBody(schemas.productSchema), (req, res) => {
  const product = { id: nextProductId++, ...req.body };
  products.push(product);
  res.status(201).json({ product });
});

app.put('/api/products/:id', requireAdminAuth, requireCsrf, validateBody(schemas.productUpdateSchema), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products[idx] = { ...products[idx], ...req.body, id };
  res.json({ product: products[idx] });
});

app.delete('/api/products/:id', requireAdminAuth, requireCsrf, (req, res) => {
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

app.post('/api/categories', requireAdminAuth, requireCsrf, validateBody(schemas.categorySchema), (req, res) => {
  const cat = { id: nextCategoryId++, name: req.body.name };
  categories.push(cat);
  res.status(201).json({ category: cat });
});

app.put('/api/categories/:id', requireAdminAuth, requireCsrf, validateBody(schemas.categorySchema), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  categories[idx] = { ...categories[idx], name: req.body.name };
  res.json({ category: categories[idx] });
});

app.delete('/api/categories/:id', requireAdminAuth, requireCsrf, (req, res) => {
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

app.get('/api/orders', requireAdminAuth, (_, res) => {
  const safeOrders = orders.map((order) => ({
    id: order.id,
    customer: order.customer,
    items: order.items,
    total: order.total,
    payment: order.payment,
    address: order.address,
    status: order.status,
    date: order.date,
  }));
  res.json({ orders: safeOrders });
});

app.put('/api/orders/:id/status', requireAdminAuth, requireCsrf, validateBody(schemas.orderStatusSchema), (req, res) => {
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

app.get('/api/discounts', requireAdminAuth, (_, res) => {
  res.json({ discounts });
});

app.post('/api/discounts', requireAdminAuth, requireCsrf, validateBody(schemas.discountCreateSchema), (req, res) => {
  const d = { id: nextDiscountId++, code: req.body.code, discount: req.body.discount, active: req.body.active !== false };
  discounts.push(d);
  res.status(201).json({ discount: d });
});

app.put('/api/discounts/:id/toggle', requireAdminAuth, requireCsrf, (req, res) => {
  const d = discounts.find(d => d.id === parseInt(req.params.id, 10));
  if (!d) return res.status(404).json({ error: 'Not found' });
  d.active = !d.active;
  res.json({ discount: d });
});

app.post('/api/discounts/check', validateBody(schemas.discountCheckSchema), (req, res) => {
  const { code } = req.body;
  const d = discounts.find(d => d.code.toUpperCase() === (code || '').toUpperCase() && d.active);
  if (!d) return res.json({ valid: false });
  res.json({ valid: true, discount: d.discount, code: d.code });
});

app.delete('/api/discounts/:id', requireAdminAuth, requireCsrf, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = discounts.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Discount not found' });
  discounts.splice(idx, 1);
  res.json({ ok: true });
});

// Dashboard stats
app.get('/api/dashboard', requireAdminAuth, (_, res) => {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const newOrders = orders.filter((o) => o.status === 'New').length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  res.json({ totalRevenue, totalOrders, newOrders, lowStock, avgOrder });
});

app.get('/api/analytics', requireAdminAuth, (_, res) => {
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
app.post('/api/admin/login', adminLoginLimiter, validateBody(schemas.loginSchema), async (req, res) => {
  const isValid = await bcrypt.compare(req.body.password, process.env.ADMIN_PASSWORD_HASH);
  if (!isValid) {
    return res.status(401).json({ ok: false, error: 'Wrong password' });
  }

  const csrfToken = crypto.randomBytes(32).toString('hex');
  const token = signAdminToken(csrfToken);
  return res.json({ ok: true, token, csrfToken });
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

app.post('/api/banner', requireAdminAuth, requireCsrf, validateBody(schemas.bannerSchema), (req, res) => {
  siteBanner = { ...siteBanner, ...req.body };
  res.json({ banner: siteBanner });
});

app.get('/api/site-texts', (_, res) => {
  res.json({ texts: siteTexts });
});

app.post('/api/site-texts', requireAdminAuth, requireCsrf, validateBody(schemas.siteTextsSchema), (req, res) => {
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

app.post('/api/settings', requireAdminAuth, requireCsrf, validateBody(schemas.settingsSchema), (req, res) => {
  siteSettings = { ...siteSettings, ...req.body };
  res.json({ settings: siteSettings });
});

// ─── Stripe Checkout ───
let nextOrderId = 10;

app.post('/api/create-checkout', validateBody(schemas.checkoutSchema), async (req, res) => {
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
    let stripeDiscounts = [];
    if (coupon) {
      const found = discounts.find(d => d.code.toUpperCase() === coupon.toUpperCase() && d.active);
      if (found) {
        try {
          const couponObj = await stripe.coupons.create({
            percent_off: found.discount,
            duration: 'once',
            name: found.code,
          });
          stripeDiscounts.push({ coupon: couponObj.id });
        } catch (_) {}
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      discounts: stripeDiscounts.length > 0 ? stripeDiscounts : undefined,
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
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

app.post('/api/checkout/verify', validateBody(schemas.checkoutVerifySchema), async (req, res) => {
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
