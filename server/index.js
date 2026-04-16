require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5008;

const errorHandle = require('./utils/error_util');
const route = require('./router/route');
const esslRoutes = require('./essl');
const { eventsHandler } = require('./utils/sse');
const { webhook } = require('./services/payment');
require('./conn/conn');

// Enable CORS
app.use(cors({
  origin: "http://localhost:5173",
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


// ----------------------
// Routes
// ----------------------

app.use('/api', route);
app.get('/events', eventsHandler);
app.use('/', esslRoutes);

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
