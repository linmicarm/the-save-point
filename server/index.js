require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const Sentry  = require('@sentry/node')
const pinoHttp = require('pino-http')

const logger = require('./logger')
const { metricsMiddleware, getMetrics } = require('./middleware/metrics')

// ── Sentry — initialise before anything else so it can capture startup errors.
// Gracefully no-ops when SENTRY_DSN is not set (local dev, CI).
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Capture 10 % of transactions for performance monitoring
    tracesSampleRate: 0.1,
  })
  logger.info('Sentry initialised')
}

// ── Routes
const authRoutes       = require('./routes/auth')
const userRoutes       = require('./routes/users')
const seasonRoutes     = require('./routes/seasons')
const journalRoutes    = require('./routes/journal')
const wishlistRoutes   = require('./routes/wishlist')
const rhythmRoutes     = require('./routes/rhythm')
const yearRoutes       = require('./routes/year')
const traditionsRoutes = require('./routes/traditions')
const monthRoutes      = require('./routes/months')
const letterRoutes     = require('./routes/letters')
const commonplaceRoutes = require('./routes/commonplace')
const milestoneRoutes  = require('./routes/milestones')
const nowRoutes        = require('./routes/now')
const placesRoutes     = require('./routes/places')
const capsuleRoutes    = require('./routes/capsule')
const discoverRoutes   = require('./routes/discover')
const mediaRoutes      = require('./routes/media')
const postRoutes       = require('./routes/posts')
const blogRoutes       = require('./routes/blog')
const mealRoutes       = require('./routes/meals')
const habitRoutes      = require('./routes/habits')
const medialogRoutes   = require('./routes/medialog')
const photoRoutes      = require('./routes/photos')
const recipeRoutes     = require('./routes/recipes')
const notifRoutes      = require('./routes/notifications')
const followRoutes     = require('./routes/follows')
const searchRoutes     = require('./routes/search')
const exportRoutes     = require('./routes/export')
const uploadRoutes     = require('./routes/upload')
const checkinRoutes    = require('./routes/checkins')
const seedRoutes       = require('./routes/seeds')

const app = express()

// ── Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

// Structured HTTP request logging (skips /api/health to avoid log noise)
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: req => req.url === '/api/health' },
}))

// In-memory request / error counters
app.use(metricsMiddleware)

// ── API routes
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/seasons',       seasonRoutes)
app.use('/api/journal',       journalRoutes)
app.use('/api/wishlist',      wishlistRoutes)
app.use('/api/rhythm',        rhythmRoutes)
app.use('/api/year',          yearRoutes)
app.use('/api/traditions',    traditionsRoutes)
app.use('/api/months',        monthRoutes)
app.use('/api/letters',       letterRoutes)
app.use('/api/commonplace',   commonplaceRoutes)
app.use('/api/milestones',    milestoneRoutes)
app.use('/api/now',           nowRoutes)
app.use('/api/places',        placesRoutes)
app.use('/api/capsule',       capsuleRoutes)
app.use('/api/discover',      discoverRoutes)
app.use('/api/media',         mediaRoutes)
app.use('/api/posts',         postRoutes)
app.use('/api/blog',          blogRoutes)
app.use('/api/meals',         mealRoutes)
app.use('/api/habits',        habitRoutes)
app.use('/api/medialog',      medialogRoutes)
app.use('/api/photos',        photoRoutes)
app.use('/api/recipes',       recipeRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/follows',       followRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/export',        exportRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/checkins',      checkinRoutes)
app.use('/api/seeds',         seedRoutes)

// ── Health check — useful for Render health probes and uptime monitors
app.get('/api/health', (req, res) => {
  const { requests, errors } = getMetrics()
  res.json({
    status:      'ok',
    uptime:      Math.floor(process.uptime()),  // seconds since process start
    requests,
    errors,
    errorRate:   requests > 0 ? +(errors / requests).toFixed(4) : 0,
    memory:      process.memoryUsage().heapUsed,
    timestamp:   new Date().toISOString(),
  })
})

// ── Sentry error handler — must be registered AFTER routes
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app)
}

// ── Global error handler — catches anything routes throw / next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, url: req.url, method: req.method }, 'unhandled error')
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => logger.info({ port: PORT }, `Server running on port ${PORT}`))
