import { createApp } from '@config/express'
import { loadEnvironment } from '@config/environment'
import { connectToDatabase } from './database'
import { logger } from '@logger'
import { initializeScheduler } from '@services/scheduler.service'

const app = createApp()
export default app

const { PORT, MONGO_URL, NODE_ENV } = loadEnvironment()

const isVercel = process.env.VERCEL === '1'

if (NODE_ENV !== 'test' && !isVercel) {
  connectToDatabase(MONGO_URL)
    .then(() => {
      logger.info('Connected to database')

      try {
        initializeScheduler()
      } catch (err) {
        logger.error({ err }, 'Failed to initialize scheduler')
      }

      app.listen(PORT, () => {
        logger.info({ port: PORT }, 'App listening')
      })
    })
    .catch((err) => {
      logger.error({ err }, 'Database connection failed')
      process.exit(1)
    })
}
