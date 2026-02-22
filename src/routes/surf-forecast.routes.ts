import Router from 'express'
import { SurfForecastController } from '@controllers/surf-forecast.controller'
import { validate } from '../middleware/validate'
import { surfForecastSpotSchema } from '@schemas/surf-forecast.schema'

export const SurfForecastRouter = Router()

SurfForecastRouter.get('/spots', SurfForecastController.getAllSpots)
SurfForecastRouter.get(
  '/:spot/hourly',
  validate(surfForecastSpotSchema),
  SurfForecastController.getHourlySurfForecasts,
)

SurfForecastRouter.get(
  '/:spot/general',
  validate(surfForecastSpotSchema),
  SurfForecastController.getGeneralSurfForecasts,
)

SurfForecastRouter.delete('/', SurfForecastController.deleteSurfForecast)
