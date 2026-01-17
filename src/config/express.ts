import express, { Express, json } from 'express'
import cors from 'cors'
import { buoysRouter } from '@routes/buoy.routes'
import { scrapeRouter } from '@routes/scrape.routes'
import { SurfForecastRouter } from '@routes/surf-forecast.routes'
import { stationsRouter } from '@routes/station.routes'

export const createApp = (): Express => {
  const app = express()

  app.use(cors({ origin: '*' }))
  app.use(json())

  app.use('/stations', stationsRouter)
  app.use('/buoys', buoysRouter)
  app.use('/surf-forecast', SurfForecastRouter)
  app.use('/scrape', scrapeRouter)

  return app
}
