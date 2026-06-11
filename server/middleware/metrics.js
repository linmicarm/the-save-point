/**
 * In-memory request / error counters for /api/health.
 *
 * Intentionally simple — no external store needed.
 * Counters reset on process restart, which is fine for a lightweight
 * "is the server healthy?" check.
 */

const counters = {
  requests: 0,
  errors:   0,
}

/** Express middleware — increment request counter, detect 5xx on finish. */
function metricsMiddleware(req, res, next) {
  counters.requests++
  res.on('finish', () => {
    if (res.statusCode >= 500) counters.errors++
  })
  next()
}

/** Returns a snapshot of the current counters. */
function getMetrics() {
  return { ...counters }
}

module.exports = { metricsMiddleware, getMetrics }
