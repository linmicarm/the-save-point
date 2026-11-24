// One shared Prisma client for the whole server.
// Each `new PrismaClient()` opens its own connection pool, so 27 route files
// meant 27 pools against Supabase. New code imports this instead; old routes
// can be migrated one at a time by swapping their two lines for:
//   const prisma = require('../db')
const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis
const prisma = globalForPrisma.__prisma || new PrismaClient()

// survive hot reloads (nodemon etc.) without leaking clients in dev
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma

module.exports = prisma
