import express, { json } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { buoysRouter } from '@routes/buoy.routes'
import { scrapeRouter } from '@routes/scrape.routes'
import { SurfForecastRouter } from '@routes/surf-forecast.routes'
import { stationsRouter } from '@routes/station.routes'
import { logger } from '@logger'

const { PORT = 3000, MONGO_URL, NODE_ENV } = process.env

if (!MONGO_URL && NODE_ENV !== 'test') {
  logger.error(
    'MONGO_URL is not defined. Please check your environment variables.',
  )
  process.exit(1)
}

const app = express()
app.use(cors({ origin: '*' }))

app.use(json())

app.use('/buoys', buoysRouter)
app.use('/scrape', scrapeRouter)
app.use('/stations', stationsRouter)
app.use('/surf-forecast', SurfForecastRouter)

export default app

if (NODE_ENV !== 'test') {
  mongoose
    .connect(MONGO_URL!)
    .then(() => {
      logger.info('Connected to database')
      app.listen(PORT, () => {
        logger.info({ port: PORT }, 'App listening')
      })
    })
    .catch((err) => logger.error({ err }, 'Database connection failed'))
}
