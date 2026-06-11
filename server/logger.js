/**
 * Structured logger — pino in production, pretty-printed in dev.
 *
 * Usage:
 *   const logger = require('./logger')
 *   logger.info({ userId }, 'user logged in')
 *   logger.error({ err }, 'database query failed')
 */

const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In development, use human-readable output if pino-pretty is available.
  // In production (NODE_ENV=production), emit newline-delimited JSON so
  // log aggregators (Datadog, Render log drain, CloudWatch) can parse it.
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
})

module.exports = logger
