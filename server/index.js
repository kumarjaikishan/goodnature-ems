require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5008;

const errorHandle = require('./utils/error_util');
const route = require('./router/route');
const esslRoutes = require('./essl');
const TelegramRoute = require('./telegramHook');
const { eventsHandler } = require('./utils/sse');
const { webhook } = require('./services/payment');
const { apiMonitorMiddleware } = require('./utils/apiMonitor');
require('./conn/conn');

// Enable CORS
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server) or matching allowed origins / vercel previews
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Alternatively allow all in production if needed
  },
  credentials: true
}));

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhook
);


// ----------------------
// Normal API parsers
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Raw-body middleware only for ESSL device routes
// ----------------------
// Raw-body only for ESSL device routes
app.use([
  '/essl/iclock/cdata',
  '/essl/iclock/cdata.aspx',
  '/essl/iclock/getrequest.aspx',
  '/essl/iclock/devicecmd'
], (req, res, next) => {
  let raw = '';
  req.on('data', chunk => raw += chunk.toString());
  req.on('end', () => {
    req.bodyRaw = raw; // store raw body
    next();
  });
});

console.log("Timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
// console.log("Local Hours:", new Date().getHours());
// console.log("UTC Hours:", new Date().getUTCHours());

// ----------------------
// Optional: log incoming requests
// ----------------------
app.use((req, res, next) => {
  // console.log(`📡 Incoming: ${req.method} ${req.url}`);
  // if (req.bodyRaw) console.log('📡 Incoming essl request: ', req.bodyRaw);
  next();
});


const plotRoutes = require('./router/plots.routes');

// ----------------------
// API performance monitor (records timing for every request; stats are
// only exposed to the 'developer' role via /api/api-monitor/stats)
// ----------------------
app.use(apiMonitorMiddleware);

// ----------------------
// Health Check Routes (for Root / Render / Uptime monitors)
// ----------------------
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'Good Nature EMS Server is healthy and running'
  });
});

app.use('/api/plots', plotRoutes);
app.use('/api', route);
app.get('/events', eventsHandler);
app.use('/', esslRoutes);
app.use('/api/telegram', TelegramRoute);

// ----------------------
// 404 handler
// ----------------------
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found, kindly Re-Check api End point' });
});

// ----------------------
// Error handler
// ----------------------
app.use(errorHandle);

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server is running at port: ${PORT}`);
});
