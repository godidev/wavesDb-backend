import { createApp } from '../src/config/express'
import { connectToDatabase } from '../src/database'
import { loadEnvironment } from '../src/config/environment'
import { logger } from '../src/logger'

const app = createApp()

const { MONGO_URL } = loadEnvironment()

let isConnected = false

export default async function handler(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
) {
  if (!isConnected && MONGO_URL) {
    try {
      await connectToDatabase(MONGO_URL)
      isConnected = true
      logger.info('Connected to database (serverless)')
    } catch (err) {
      logger.error({ err }, 'Database connection failed in serverless')
    }
  }

  return app(req, res)
}
