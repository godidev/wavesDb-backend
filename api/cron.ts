import type { VercelRequest, VercelResponse } from '@vercel/node'
import { connectToDatabase } from '../src/database'
import { loadEnvironment } from '../src/config/environment'
import { scrapeAll } from '../src/services/scraper.service'
import { logger } from '../src/logger'

const { MONGO_URL } = loadEnvironment()

let isConnected = false

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron request attempt')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (!isConnected && MONGO_URL) {
      await connectToDatabase(MONGO_URL)
      isConnected = true
      logger.info('Connected to database (cron)')
    }

    logger.info('Vercel Cron Job triggered: scrapeAll')
    const result = await scrapeAll()

    if (result.success) {
      return res.status(200).json({
        message: 'Cron job completed successfully',
        results: result.results,
      })
    } else {
      return res.status(207).json({
        message: 'Cron job completed with some failures',
        results: result.results,
      })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error({ err }, 'Cron job failed')
    return res.status(500).json({ error: errorMessage })
  }
}
