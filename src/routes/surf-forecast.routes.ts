import Router from 'express'
import { SurfForecastController } from '@controllers/surf-forecast.controller'
import { validate } from '../middleware/validate'
import { surfForecastSpotSchema } from '@schemas/surf-forecast.schema'

export const SurfForecastRouter = Router()

SurfForecastRouter.get('/spots', SurfForecastController.getAllSpots)
SurfForecastRouter.get(
  '/:spot',
  validate(surfForecastSpotSchema),
  SurfForecastController.getSurfForecasts,
)

SurfForecastRouter.delete('/', SurfForecastController.deleteSurfForecast)
