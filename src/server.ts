import { serve } from '@hono/node-server'
import app from './index.js'

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 Server starting on http://localhost:${port}`)
console.log(`📁 Database location: ${process.env.DATABASE_PATH || 'data/database.sqlite'}`)

serve({
  fetch: app.fetch,
  port
})
