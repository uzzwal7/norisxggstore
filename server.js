require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const helmet        = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit      = require('express-rate-limit');
const connectDB      = require('./config/db');
const { seedProducts } = require('./controllers/productController');
const carouselSlides   = require('./config/carouselSlides');

// ── Connect to MongoDB ────────────────────────────────────────
connectDB().then(() => seedProducts());

const app = express();

// ── View Engine (EJS) ─────────────────────────────────────────
// Templates live in /views, split into small partials/pages so each
// section of the site (header, carousel, shop, etc.) is its own file.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Security & Middleware ─────────────────────────────────────
// Security HTTP headers (hides tech stack, blocks clickjacking, etc.)
// CSP is disabled because the site loads inline scripts/styles by design;
// the other protections (X-Frame-Options, X-Content-Type-Options, HSTS
// when on HTTPS, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
// Raised to 15mb to allow payment-screenshot uploads (sent as base64)
app.use(express.json({ limit: '15mb' }));
// Strips any $ or . from req.body/req.query/req.params keys — blocks
// NoSQL injection attempts like { "email": { "$gt": "" } }
app.use(mongoSanitize());

// Rate limit API routes (200 req / 15 min per IP)
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// Stricter rate limit on login/register specifically — blocks password
// brute-forcing and spam account creation (10 attempts / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' }
});
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ── Serve Static Files ────────────────────────────────────────
// CSS, client-side app.js, and images still live in /public
app.use(express.static(path.join(__dirname, 'public')));
// Admin panel at /admin
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/feedback',      require('./routes/feedbackRoutes'));
app.use('/api/promo',         require('./routes/promoRoutes'));
app.use('/api/cart',          require('./routes/cartRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── Page Rendering ───────────────────────────────────────────
// The whole site is one SPA page assembled from views/index.ejs.
// Carousel slide data is injected here from config/carouselSlides.js.
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('*', (req, res) => res.render('index', { slides: carouselSlides }));

// ── Start Server ──────────────────────────────────────────────
// On Vercel, the platform itself calls the exported "app" as a serverless
// function — it must NOT call app.listen(), or the function crashes.
// Locally (npm start), there is no VERCEL env var, so it starts normally.
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 norisxgg store server running on http://localhost:${PORT}`);
    console.log(`🛒 Store:  http://localhost:${PORT}`);
    console.log(`🔧 Admin:  http://localhost:${PORT}/admin`);
    console.log(`📡 API:    http://localhost:${PORT}/api\n`);
  });
}

module.exports = app;