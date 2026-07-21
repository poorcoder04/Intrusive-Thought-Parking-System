require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// ─── Fix #20: CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Fix #12: Body size limit (10 kb) ────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Fix #11: Rate limiting on auth routes ───────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 20,                    // max 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' }
});

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes           = require('./route/authRoute.js');
const parkThoughtRoutes    = require('./route/parkThoughtRoute.js');
const activeThoughtRoutes  = require('./route/activeThoughtRoute.js');
const notifiedThoughtRoutes = require('./route/notifiedRoute.js');
const deleteThoughtRoutes  = require('./route/deleteThoughtRoute.js');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/thoughts', parkThoughtRoutes);
app.use('/api/thoughts', activeThoughtRoutes);
app.use('/api/thoughts', notifiedThoughtRoutes);
app.use('/api/thoughts', deleteThoughtRoutes);

// SPA fallback — serve index.html for any unmatched GET (client-side routing)
// Express 5 requires '/{*path}' instead of the deprecated '*' wildcard
app.get('/{*path}', (req, res, next) => {
  // Let API 404s fall through to the JSON error handler below
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Fix #19: JSON 404 handler for unmatched API routes ──────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Fix #19: Global error handler ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'An unexpected server error occurred.'
  });
});

// ─── Fix #4: Connect DB first, THEN start cron + server ──────────────────────
const connectDB = require('./config/db.js');
const { initCronJobs } = require('./services/cronServices');

connectDB().then(() => {
  initCronJobs();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
