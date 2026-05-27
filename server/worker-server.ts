import { startAllWorkers, stopAllWorkers, getWorkersHealth } from '@/workers'
import redis from '@/lib/queue/redis'
import express from 'express'

const app = express()

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await getWorkersHealth()
    res.json({ status: 'healthy', workers: health })
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: (error as Error).message })
  }
})

// Queue health endpoint
app.get('/queues/health', async (req, res) => {
  try {
    const ping = await redis.ping()
    res.json({ status: ping === 'PONG' ? 'healthy' : 'unhealthy', redis: ping })
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: (error as Error).message })
  }
})

async function startServer() {
  const port = process.env.WORKER_PORT || 3001

  try {
    // Start all workers
    await startAllWorkers()

    // Start Express server
    app.listen(port, () => {
      console.log(`[Worker Server] Started on port ${port}`)
    })
  } catch (error) {
    console.error('[Worker Server] Failed to start:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker Server] SIGTERM received, shutting down...')
  await stopAllWorkers()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Worker Server] SIGINT received, shutting down...')
  await stopAllWorkers()
  process.exit(0)
})

startServer()
