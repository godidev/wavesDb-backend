import { createApp } from '@config/express'
import { loadEnvironment } from '@config/environment'
import { connectToDatabase } from './database'
import { logger } from '@logger'

const app = createApp()
export default app

const { PORT, MONGO_URL, NODE_ENV } = loadEnvironment()

if (NODE_ENV !== 'test') {
  connectToDatabase(MONGO_URL)
    .then(() => {
      logger.info('Connected to database')
      app.listen(PORT, () => {
        logger.info({ port: PORT }, 'App listening')
      })
    })
    .catch((err) => {
      logger.error({ err }, 'Database connection failed')
      process.exit(1)
    })
}
