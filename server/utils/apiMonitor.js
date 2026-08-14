/**
 * Lightweight in-memory API performance monitor.
 * ─────────────────────────────────────────────────────────────────────────
 * Keeps the last MAX_RECORDS_PER_ENDPOINT calls for every endpoint
 * (method + route pattern, e.g. "GET /api/plots/bookings/:id") so a
 * developer can see which endpoints are slow, how latency trends over the
 * last 50 calls, and how often each one errors.
 *
 * Deliberately in-memory, not persisted to Mongo/Redis:
 *  - it's operational/debug data, not business data - losing it on a
 *    restart is fine and expected
 *  - a ring buffer of 50 entries per endpoint is tiny, so there's no
 *    unbounded growth risk even with hundreds of distinct endpoints
 *  - avoids adding a write to every single API call's hot path (a DB or
 *    Redis write per request would itself become the kind of performance
 *    problem this tool exists to catch)
 *
 * NOTE: with multiple server instances/processes (PM2 cluster mode, several
 * containers, etc.) each process has its own independent stats - this
 * reflects only the instance that handled the request, not a merged view
 * across the whole fleet. Fine for a single-instance deployment or for
 * spot-checking one instance; not a substitute for real APM if you scale
 * horizontally.
 */

const MAX_RECORDS_PER_ENDPOINT = 30;

// endpointKey -> array of records (oldest first, capped at MAX_RECORDS_PER_ENDPOINT)
const store = new Map();

const processStartedAt = new Date();

function recordCall(endpointKey, record) {
  let records = store.get(endpointKey);
  if (!records) {
    records = [];
    store.set(endpointKey, records);
  }
  records.push(record);
  if (records.length > MAX_RECORDS_PER_ENDPOINT) {
    records.shift();
  }
}

/**
 * Express middleware. Mount once, globally, as early as possible (after
 * body parsers). Reads req.route/req.baseUrl at response-finish time
 * (Express has populated them by then, once routing has matched) so
 * endpoints are grouped by route PATTERN ("/employee/:id"), not by the
 * literal URL that was called ("/employee/64f1a2...") - otherwise every
 * distinct id would become its own "endpoint" and the stats would never
 * aggregate meaningfully.
 */
function apiMonitorMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      // req.route.path is the pattern within whichever router matched
      // (e.g. "/bookings/:id"); req.baseUrl is that router's mount prefix
      // (e.g. "/api/plots"). Together they reconstruct the full pattern.
      // If nothing matched (404, or a route registered without going
      // through Express routing, e.g. a raw app.use handler), fall back to
      // the raw path so the call still gets recorded somewhere.
      const routePattern = req.route?.path;
      const path = routePattern
        ? `${req.baseUrl || ''}${routePattern}`
        : (req.originalUrl || req.url || '').split('?')[0];

      const endpointKey = `${req.method} ${path}`;

      recordCall(endpointKey, {
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        ok: res.statusCode < 400,
      });
    } catch (err) {
      // Monitoring must never be the reason a real request fails.
      console.error('apiMonitor: failed to record call', err.message);
    }
  });

  next();
}

/**
 * Aggregated stats for every tracked endpoint, computed from its last-50
 * ring buffer. Sorted by nothing in particular - the frontend sorts/filters.
 */
function getStats() {
  const endpoints = [];

  for (const [endpointKey, records] of store.entries()) {
    if (!records.length) continue;

    const [method, ...pathParts] = endpointKey.split(' ');
    const path = pathParts.join(' ');

    const durations = records.map((r) => r.durationMs);
    const errorCount = records.filter((r) => !r.ok).length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const sorted = [...durations].sort((a, b) => a - b);
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);

    endpoints.push({
      endpointKey,
      method,
      path,
      callCount: records.length,
      avgMs: Math.round((sum / durations.length) * 100) / 100,
      minMs: sorted[0],
      maxMs: sorted[sorted.length - 1],
      p95Ms: sorted[p95Index],
      errorCount,
      errorRate: Math.round((errorCount / records.length) * 1000) / 10, // %
      lastCallAt: records[records.length - 1].timestamp,
      lastDurationMs: records[records.length - 1].durationMs,
      lastStatusCode: records[records.length - 1].statusCode,
      records, // last up-to-50, oldest first
    });
  }

  return {
    processStartedAt: processStartedAt.toISOString(),
    endpointCount: endpoints.length,
    endpoints,
  };
}

function clearStats() {
  store.clear();
}

module.exports = { apiMonitorMiddleware, getStats, clearStats };
