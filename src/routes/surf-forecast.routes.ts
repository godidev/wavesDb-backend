import Router from 'express'
import { SurfForecastController } from '@controllers/surf-forecast.controller'
import { validate } from '../middleware/validate'
import { surfForecastSpotSchema } from '@schemas/surf-forecast.schema'

export const SurfForecastRouter = Router()

SurfForecastRouter.get(
  '/:spotId/hourly',
  validate(surfForecastSpotSchema),
  SurfForecastController.getHourlySurfForecasts,
)

SurfForecastRouter.get(
  '/:spotId/general',
  validate(surfForecastSpotSchema),
  SurfForecastController.getGeneralSurfForecasts,
)

SurfForecastRouter.delete('/', SurfForecastController.deleteSurfForecast)
