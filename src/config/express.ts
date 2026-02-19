import express, { Express, json } from 'express'
import cors from 'cors'
import { buoysRouter } from '@routes/buoy.routes'
import { scrapeRouter } from '@routes/scrape.routes'
import { SurfForecastRouter } from '@routes/surf-forecast.routes'
import { stationsRouter } from '@routes/station.routes'
import { errorHandler } from '../middleware/errorHandler'
import { loadEnvironment } from './environment'

export const createApp = (): Express => {
  const app = express()
  const { ALLOWED_ORIGINS, NODE_ENV } = loadEnvironment()

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (NODE_ENV !== 'production' && ALLOWED_ORIGINS.length === 0) {
          return callback(null, true)
        }
        if (ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      },
    }),
  )
  app.use(json())

  app.use('/stations', stationsRouter)
  app.use('/buoys', buoysRouter)
  app.use('/surf-forecast', SurfForecastRouter)
  app.use('/scrape', scrapeRouter)

  // Error handler global - DEBE ir al final
  app.use(errorHandler)

  return app
}
