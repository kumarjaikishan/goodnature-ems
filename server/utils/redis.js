// utils/redis.js
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

let hasLoggedError = false;
client.on('error', (err) => {
  if (!hasLoggedError) {
    console.warn('⚠️ Redis connection error (app will run without cache):', err.message);
    hasLoggedError = true;
  }
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.warn("⚠️ Redis connection skipped:", err.message);
  }
})();

module.exports = client;
